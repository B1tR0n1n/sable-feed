export default async function articleRoutes(fastify) {
  const db = fastify.db;

  // GET /api/articles — Paginated article list
  fastify.get('/api/articles', async (request) => {
    const { tier_id, feed_id, is_read, is_saved, before, limit = 50 } = request.query;
    const lim = Math.min(parseInt(limit) || 50, 200);

    let where = ['1=1'];
    const params = {};

    if (tier_id) {
      where.push('f.tier_id = @tier_id');
      params.tier_id = tier_id;
    }
    if (feed_id) {
      where.push('a.feed_id = @feed_id');
      params.feed_id = parseInt(feed_id);
    }
    if (is_read !== undefined) {
      where.push('COALESCE(s.is_read, 0) = @is_read');
      params.is_read = is_read === 'true' || is_read === '1' ? 1 : 0;
    }
    if (is_saved !== undefined) {
      where.push('COALESCE(s.is_saved, 0) = @is_saved');
      params.is_saved = is_saved === 'true' || is_saved === '1' ? 1 : 0;
    }
    if (before) {
      where.push('a.published_at < @before');
      params.before = before;
    }

    params.limit = lim;

    const sql = `
      SELECT a.id, a.feed_id, a.guid, a.title, a.link, a.summary, a.author,
             a.published_at, a.fetched_at,
             f.title as feed_title, f.tier_id,
             COALESCE(s.is_read, 0) as is_read,
             COALESCE(s.is_saved, 0) as is_saved
      FROM articles a
      JOIN feeds f ON f.id = a.feed_id
      LEFT JOIN article_state s ON s.article_id = a.id
      WHERE ${where.join(' AND ')}
      ORDER BY a.published_at DESC
      LIMIT @limit
    `;

    const articles = db.prepare(sql).all(params);

    return {
      articles,
      has_more: articles.length === lim,
      next_cursor: articles.length > 0 ? articles[articles.length - 1].published_at : null,
    };
  });

  // GET /api/articles/:id — Single article with full content
  fastify.get('/api/articles/:id', async (request, reply) => {
    const { id } = request.params;

    const article = db.prepare(`
      SELECT a.*, f.title as feed_title, f.tier_id, f.site_url as feed_site_url,
             COALESCE(s.is_read, 0) as is_read,
             COALESCE(s.is_saved, 0) as is_saved
      FROM articles a
      JOIN feeds f ON f.id = a.feed_id
      LEFT JOIN article_state s ON s.article_id = a.id
      WHERE a.id = ?
    `).get(id);

    if (!article) return reply.code(404).send({ error: 'Article not found' });
    return article;
  });

  // PATCH /api/articles/:id/read — Mark as read/unread
  fastify.patch('/api/articles/:id/read', async (request, reply) => {
    const { id } = request.params;
    const { is_read } = request.body || {};

    const article = db.prepare('SELECT id FROM articles WHERE id = ?').get(id);
    if (!article) return reply.code(404).send({ error: 'Article not found' });

    db.prepare(`
      INSERT INTO article_state (article_id, is_read, read_at)
      VALUES (?, ?, CASE WHEN ? THEN datetime('now') ELSE NULL END)
      ON CONFLICT(article_id) DO UPDATE SET
        is_read = excluded.is_read,
        read_at = CASE WHEN excluded.is_read THEN datetime('now') ELSE NULL END
    `).run(id, is_read ? 1 : 0, is_read ? 1 : 0);

    return { id: parseInt(id), is_read: !!is_read };
  });

  // PATCH /api/articles/:id/save — Toggle saved
  fastify.patch('/api/articles/:id/save', async (request, reply) => {
    const { id } = request.params;
    const { is_saved } = request.body || {};

    const article = db.prepare('SELECT id FROM articles WHERE id = ?').get(id);
    if (!article) return reply.code(404).send({ error: 'Article not found' });

    db.prepare(`
      INSERT INTO article_state (article_id, is_saved, saved_at)
      VALUES (?, ?, CASE WHEN ? THEN datetime('now') ELSE NULL END)
      ON CONFLICT(article_id) DO UPDATE SET
        is_saved = excluded.is_saved,
        saved_at = CASE WHEN excluded.is_saved THEN datetime('now') ELSE NULL END
    `).run(id, is_saved ? 1 : 0, is_saved ? 1 : 0);

    return { id: parseInt(id), is_saved: !!is_saved };
  });

  // POST /api/articles/mark-all-read — Mark all as read
  fastify.post('/api/articles/mark-all-read', async (request) => {
    const { tier_id, feed_id } = request.body || {};

    let articleIds;
    if (feed_id) {
      articleIds = db.prepare('SELECT id FROM articles WHERE feed_id = ?').all(feed_id);
    } else if (tier_id) {
      articleIds = db.prepare(`
        SELECT a.id FROM articles a
        JOIN feeds f ON f.id = a.feed_id
        WHERE f.tier_id = ?
      `).all(tier_id);
    } else {
      articleIds = db.prepare('SELECT id FROM articles').all();
    }

    const markRead = db.prepare(`
      INSERT INTO article_state (article_id, is_read, read_at)
      VALUES (?, 1, datetime('now'))
      ON CONFLICT(article_id) DO UPDATE SET is_read = 1, read_at = datetime('now')
    `);

    const markAll = db.transaction(() => {
      for (const { id } of articleIds) {
        markRead.run(id);
      }
    });

    markAll();

    return { marked: articleIds.length };
  });
}
