import Parser from 'rss-parser';

const parser = new Parser({
  timeout: 15000,
  headers: {
    'User-Agent': 'SableFeed/1.0 (+https://github.com/b1tr0n1n/sable-feed)',
    'Accept': 'application/rss+xml, application/atom+xml, application/xml, text/xml, */*',
  },
  customFields: {
    item: [
      ['content:encoded', 'contentEncoded'],
      ['dc:creator', 'dcCreator'],
    ],
  },
});

function truncate(str, len) {
  if (!str) return null;
  if (str.length <= len) return str;
  return str.slice(0, len).replace(/\s+\S*$/, '') + '...';
}

function normalizeDate(dateStr) {
  if (!dateStr) return null;
  const d = new Date(dateStr);
  return isNaN(d.getTime()) ? null : d.toISOString();
}

// rss-parser can return objects/arrays for fields (e.g. Microsoft feeds
// return { name: '...' } for author). Coerce everything to a string or null
// so SQLite doesn't choke on non-bindable types.
function toStr(val) {
  if (val == null) return null;
  if (typeof val === 'string') return val;
  if (typeof val === 'number' || typeof val === 'boolean') return String(val);
  if (typeof val === 'object') {
    // { name: 'Foo' } → 'Foo', arrays → join
    if (Array.isArray(val)) return val.map(toStr).filter(Boolean).join(', ');
    if (val.name) return String(val.name);
    if (val._) return String(val._);
    try { return JSON.stringify(val); } catch { return null; }
  }
  return String(val);
}

export async function fetchFeed(feedUrl) {
  const feed = await parser.parseURL(feedUrl);

  const articles = (feed.items || []).map((item) => {
    const guid = toStr(item.guid || item.id || item.link || item.title);
    const content = toStr(item.contentEncoded || item['content:encoded'] || item.content) || null;
    const rawSummary = toStr(item.contentSnippet || item.summary) ||
      (content ? content.replace(/<[^>]*>/g, '') : null);
    const summary = truncate(rawSummary, 500);

    return {
      guid,
      title: toStr(item.title) || 'Untitled',
      link: toStr(item.link) || null,
      summary,
      content,
      author: toStr(item.creator || item.dcCreator || item.author) || null,
      published_at: normalizeDate(item.pubDate || item.isoDate || item.published),
    };
  });

  return {
    feedTitle: feed.title || null,
    feedSiteUrl: feed.link || null,
    articles,
  };
}

export async function refreshFeed(db, feed) {
  try {
    const result = await fetchFeed(feed.url);

    const insertArticle = db.prepare(`
      INSERT OR IGNORE INTO articles (feed_id, guid, title, link, summary, content, author, published_at)
      VALUES (@feed_id, @guid, @title, @link, @summary, @content, @author, @published_at)
    `);

    const insertState = db.prepare(`
      INSERT OR IGNORE INTO article_state (article_id)
      VALUES (?)
    `);

    let newCount = 0;
    const insertAll = db.transaction(() => {
      for (const article of result.articles) {
        const info = insertArticle.run({
          feed_id: feed.id,
          ...article,
        });
        if (info.changes > 0) {
          insertState.run(info.lastInsertRowid);
          newCount++;
        }
      }
    });

    insertAll();

    // Update feed metadata
    const updateFeed = db.prepare(`
      UPDATE feeds SET last_fetched_at = datetime('now'), last_error = NULL,
        site_url = COALESCE(@site_url, site_url),
        title = CASE WHEN title = url THEN COALESCE(@title, title) ELSE title END
      WHERE id = @id
    `);

    updateFeed.run({
      id: feed.id,
      site_url: result.feedSiteUrl,
      title: result.feedTitle,
    });

    return { success: true, newArticles: newCount };
  } catch (err) {
    db.prepare('UPDATE feeds SET last_error = ?, last_fetched_at = datetime(\'now\') WHERE id = ?')
      .run(err.message, feed.id);
    return { success: false, error: err.message };
  }
}

export async function refreshAllFeeds(db) {
  const feeds = db.prepare('SELECT * FROM feeds').all();
  const results = [];

  for (const feed of feeds) {
    const result = await refreshFeed(db, feed);
    results.push({ feed_id: feed.id, title: feed.title, ...result });
  }

  // Prune old articles (30+ days, not saved)
  db.prepare(`
    DELETE FROM articles WHERE id IN (
      SELECT a.id FROM articles a
      LEFT JOIN article_state s ON s.article_id = a.id
      WHERE a.published_at < datetime('now', '-30 days')
        AND (s.is_saved IS NULL OR s.is_saved = 0)
    )
  `).run();

  return results;
}
