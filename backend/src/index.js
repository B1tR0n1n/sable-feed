import Fastify from 'fastify';
import cors from '@fastify/cors';
import multipart from '@fastify/multipart';
import { migrate, getDb, closeDb } from './db.js';
import { seed } from './seed.js';
import { startCron, stopCron } from './cron.js';
import tierRoutes from './routes/tiers.js';
import feedRoutes from './routes/feeds.js';
import articleRoutes from './routes/articles.js';
import syncRoutes from './routes/sync.js';

const PORT = parseInt(process.env.PORT || '3000', 10);
const HOST = process.env.HOST || '0.0.0.0';

async function main() {
  // Initialize database
  migrate();
  seed();
  const db = getDb();

  // Create Fastify instance
  const fastify = Fastify({
    logger: {
      level: process.env.LOG_LEVEL || 'info',
    },
  });

  // Decorate with db
  fastify.decorate('db', db);

  // Plugins
  await fastify.register(cors, {
    origin: true,
  });
  await fastify.register(multipart, {
    limits: {
      fileSize: 5 * 1024 * 1024, // 5MB max OPML
    },
  });

  // Routes
  await fastify.register(tierRoutes);
  await fastify.register(feedRoutes);
  await fastify.register(articleRoutes);
  await fastify.register(syncRoutes);

  // Start cron
  const cronInterval = process.env.CRON_INTERVAL || '*/30 * * * *';
  startCron(db, cronInterval);

  // Graceful shutdown
  const shutdown = async () => {
    console.log('Shutting down...');
    stopCron();
    await fastify.close();
    closeDb();
    process.exit(0);
  };
  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);

  // Start server
  await fastify.listen({ port: PORT, host: HOST });
  console.log(`\nSABLE FEED backend running on ${HOST}:${PORT}`);
  console.log('b1tr0n1n — SABLE STANDING BY\n');
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
