export default async function tierRoutes(fastify) {
  const db = fastify.db;

  // GET /api/tiers — List all tiers with unread counts
  fastify.get('/api/tiers', async () => {
    const tiers = db.prepare(`
      SELECT t.*,
        (SELECT COUNT(*) FROM articles a
         JOIN feeds f ON f.id = a.feed_id
         LEFT JOIN article_state s ON s.article_id = a.id
         WHERE f.tier_id = t.id AND (s.is_read IS NULL OR s.is_read = 0)
        ) as unread_count,
        (SELECT COUNT(*) FROM articles a
         JOIN feeds f ON f.id = a.feed_id
         WHERE f.tier_id = t.id
        ) as total_count
      FROM tiers t
      ORDER BY t.sort_order
    `).all();

    return tiers;
  });

  // PUT /api/tiers/:id — Update tier metadata
  fastify.put('/api/tiers/:id', async (request, reply) => {
    const { id } = request.params;
    const { title, cadence, purpose } = request.body || {};

    const tier = db.prepare('SELECT * FROM tiers WHERE id = ?').get(id);
    if (!tier) return reply.code(404).send({ error: 'Tier not found' });

    db.prepare(`
      UPDATE tiers SET
        title = COALESCE(?, title),
        cadence = COALESCE(?, cadence),
        purpose = COALESCE(?, purpose)
      WHERE id = ?
    `).run(title, cadence, purpose, id);

    return db.prepare('SELECT * FROM tiers WHERE id = ?').get(id);
  });
}
