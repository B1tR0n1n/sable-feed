import { refreshFeed } from '../rss.js';
import { parseOpml, generateOpml } from '../opml.js';

export default async function feedRoutes(fastify) {
  const db = fastify.db;

  // GET /api/feeds — List all feeds grouped by tier
  fastify.get('/api/feeds', async () => {
    const feeds = db.prepare(`
      SELECT f.*,
        (SELECT COUNT(*) FROM articles a
         LEFT JOIN article_state s ON s.article_id = a.id
         WHERE a.feed_id = f.id AND (s.is_read IS NULL OR s.is_read = 0)
        ) as unread_count,
        (SELECT COUNT(*) FROM articles a WHERE a.feed_id = f.id) as total_count
      FROM feeds f
      ORDER BY f.tier_id, f.title
    `).all();

    // Group by tier
    const grouped = {};
    for (const feed of feeds) {
      if (!grouped[feed.tier_id]) grouped[feed.tier_id] = [];
      grouped[feed.tier_id].push(feed);
    }

    return grouped;
  });

  // POST /api/feeds — Add a feed
  fastify.post('/api/feeds', async (request, reply) => {
    const { url, tier_id, title } = request.body || {};
    if (!url || !tier_id) {
      return reply.code(400).send({ error: 'url and tier_id are required' });
    }

    const tier = db.prepare('SELECT id FROM tiers WHERE id = ?').get(tier_id);
    if (!tier) return reply.code(400).send({ error: 'Invalid tier_id' });

    try {
      const info = db.prepare(
        'INSERT INTO feeds (title, url, tier_id) VALUES (?, ?, ?)'
      ).run(title || url, url, tier_id);

      const feed = db.prepare('SELECT * FROM feeds WHERE id = ?').get(info.lastInsertRowid);

      // Trigger initial fetch
      refreshFeed(db, feed).catch(() => {});

      return reply.code(201).send(feed);
    } catch (err) {
      if (err.message.includes('UNIQUE')) {
        return reply.code(409).send({ error: 'Feed URL already exists' });
      }
      throw err;
    }
  });

  // DELETE /api/feeds/:id — Remove a feed
  fastify.delete('/api/feeds/:id', async (request, reply) => {
    const { id } = request.params;
    const info = db.prepare('DELETE FROM feeds WHERE id = ?').run(id);
    if (info.changes === 0) return reply.code(404).send({ error: 'Feed not found' });
    return { deleted: true };
  });

  // POST /api/feeds/:id/refresh — Force refresh a single feed
  fastify.post('/api/feeds/:id/refresh', async (request, reply) => {
    const { id } = request.params;
    const feed = db.prepare('SELECT * FROM feeds WHERE id = ?').get(id);
    if (!feed) return reply.code(404).send({ error: 'Feed not found' });

    const result = await refreshFeed(db, feed);
    return result;
  });

  // POST /api/feeds/import-opml — Import OPML file
  fastify.post('/api/feeds/import-opml', async (request, reply) => {
    const data = await request.file();
    if (!data) return reply.code(400).send({ error: 'No file uploaded' });

    const buffer = await data.toBuffer();
    const xmlString = buffer.toString('utf-8');

    let feeds;
    try {
      feeds = parseOpml(xmlString);
    } catch (err) {
      return reply.code(400).send({ error: `Invalid OPML: ${err.message}` });
    }

    // Map category names to tier IDs (best effort)
    const tierMap = {};
    const tiers = db.prepare('SELECT * FROM tiers').all();
    for (const tier of tiers) {
      tierMap[tier.label] = tier.id;
      tierMap[tier.title.toLowerCase()] = tier.id;
      tierMap[`${tier.label} — ${tier.title}`.toLowerCase()] = tier.id;
    }

    const { tier_id: defaultTier } = request.query;
    let imported = 0;
    let skipped = 0;

    const insertFeed = db.prepare(
      'INSERT OR IGNORE INTO feeds (title, url, site_url, tier_id) VALUES (?, ?, ?, ?)'
    );

    const importAll = db.transaction(() => {
      for (const feed of feeds) {
        const cat = feed.category?.toLowerCase();
        const tierId = (cat && tierMap[cat]) || defaultTier || 'channel';
        const info = insertFeed.run(feed.title, feed.url, feed.site_url, tierId);
        if (info.changes > 0) imported++;
        else skipped++;
      }
    });

    importAll();

    return { imported, skipped, total: feeds.length };
  });

  // GET /api/feeds/export-opml — Export current feeds as OPML
  fastify.get('/api/feeds/export-opml', async (request, reply) => {
    const tiers = db.prepare('SELECT * FROM tiers ORDER BY sort_order').all();
    const feeds = db.prepare('SELECT * FROM feeds ORDER BY tier_id, title').all();

    const opml = generateOpml(tiers, feeds);

    reply.header('Content-Type', 'application/xml');
    reply.header('Content-Disposition', 'attachment; filename="sable-feed.opml"');
    return opml;
  });
}
