import { refreshAllFeeds } from '../rss.js';

export default async function syncRoutes(fastify) {
  const db = fastify.db;

  // GET /api/sync — Bulk fetch for mobile cache refresh
  fastify.get('/api/sync', async (request) => {
    const { since, limit = 500 } = request.query;
    const lim = Math.min(parseInt(limit) || 500, 1000);

    let articles;
    if (since) {
      articles = db.prepare(`
        SELECT a.id, a.feed_id, a.guid, a.title, a.link, a.summary, a.author,
               a.published_at, a.fetched_at,
               f.title as feed_title, f.tier_id,
               COALESCE(s.is_read, 0) as is_read,
               COALESCE(s.is_saved, 0) as is_saved
        FROM articles a
        JOIN feeds f ON f.id = a.feed_id
        LEFT JOIN article_state s ON s.article_id = a.id
        WHERE a.fetched_at > ? OR s.read_at > ? OR s.saved_at > ?
        ORDER BY a.fetched_at DESC
        LIMIT ?
      `).all(since, since, since, lim);
    } else {
      articles = db.prepare(`
        SELECT a.id, a.feed_id, a.guid, a.title, a.link, a.summary, a.author,
               a.published_at, a.fetched_at,
               f.title as feed_title, f.tier_id,
               COALESCE(s.is_read, 0) as is_read,
               COALESCE(s.is_saved, 0) as is_saved
        FROM articles a
        JOIN feeds f ON f.id = a.feed_id
        LEFT JOIN article_state s ON s.article_id = a.id
        ORDER BY a.published_at DESC
        LIMIT ?
      `).all(lim);
    }

    return {
      articles,
      synced_at: new Date().toISOString(),
      count: articles.length,
    };
  });

  // GET /api/health — Health check
  fastify.get('/api/health', async () => {
    const feedCount = db.prepare('SELECT COUNT(*) as count FROM feeds').get().count;
    const articleCount = db.prepare('SELECT COUNT(*) as count FROM articles').get().count;
    return {
      status: 'ok',
      app: 'SABLE FEED',
      version: '1.0.0',
      feeds: feedCount,
      articles: articleCount,
      timestamp: new Date().toISOString(),
    };
  });

  // POST /api/refresh-all — Trigger manual refresh of all feeds
  fastify.post('/api/refresh-all', async () => {
    const results = await refreshAllFeeds(db);
    const total = results.reduce((sum, r) => sum + (r.newArticles || 0), 0);
    const errors = results.filter((r) => !r.success);

    return {
      refreshed: results.length,
      new_articles: total,
      errors: errors.map((e) => ({ feed: e.title, error: e.error })),
    };
  });
}
