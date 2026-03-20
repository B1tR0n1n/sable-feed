import cron from 'node-cron';
import { refreshAllFeeds } from './rss.js';

let task = null;

export function startCron(db, interval = '*/30 * * * *') {
  if (task) task.stop();

  task = cron.schedule(interval, async () => {
    console.log(`[${new Date().toISOString()}] Cron: refreshing all feeds...`);
    try {
      const results = await refreshAllFeeds(db);
      const total = results.reduce((sum, r) => sum + (r.newArticles || 0), 0);
      const errors = results.filter((r) => !r.success).length;
      console.log(`[${new Date().toISOString()}] Cron: done. ${total} new articles, ${errors} errors.`);
    } catch (err) {
      console.error(`[${new Date().toISOString()}] Cron error:`, err.message);
    }
  });

  console.log(`Feed refresh cron scheduled: ${interval}`);
  return task;
}

export function stopCron() {
  if (task) {
    task.stop();
    task = null;
  }
}
