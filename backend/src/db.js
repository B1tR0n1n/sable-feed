import Database from 'better-sqlite3';
import { fileURLToPath } from 'url';
import path from 'path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DB_PATH = process.env.DB_PATH || path.join(__dirname, '..', 'data', 'sable-feed.db');

let db;

export function getDb() {
  if (!db) {
    db = new Database(DB_PATH);
    db.pragma('journal_mode = WAL');
    db.pragma('foreign_keys = ON');
  }
  return db;
}

export function migrate() {
  const db = getDb();

  db.exec(`
    CREATE TABLE IF NOT EXISTS tiers (
      id TEXT PRIMARY KEY,
      label TEXT NOT NULL,
      title TEXT NOT NULL,
      cadence TEXT NOT NULL,
      purpose TEXT NOT NULL,
      sort_order INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS feeds (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      url TEXT NOT NULL UNIQUE,
      site_url TEXT,
      tier_id TEXT NOT NULL REFERENCES tiers(id),
      last_fetched_at DATETIME,
      last_error TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS articles (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      feed_id INTEGER NOT NULL REFERENCES feeds(id) ON DELETE CASCADE,
      guid TEXT NOT NULL,
      title TEXT NOT NULL,
      link TEXT,
      summary TEXT,
      content TEXT,
      author TEXT,
      published_at DATETIME,
      fetched_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(feed_id, guid)
    );

    CREATE TABLE IF NOT EXISTS article_state (
      article_id INTEGER PRIMARY KEY REFERENCES articles(id) ON DELETE CASCADE,
      is_read BOOLEAN DEFAULT 0,
      is_saved BOOLEAN DEFAULT 0,
      read_at DATETIME,
      saved_at DATETIME
    );

    CREATE INDEX IF NOT EXISTS idx_articles_feed_published ON articles(feed_id, published_at DESC);
    CREATE INDEX IF NOT EXISTS idx_articles_published ON articles(published_at DESC);
    CREATE INDEX IF NOT EXISTS idx_article_state_saved ON article_state(is_saved) WHERE is_saved = 1;
  `);

  // Fix feed URLs that have gone 404 since initial seed
  const urlFixes = [
    ['https://www.channelfutures.com/feed', 'https://www.channelfutures.com/rss.xml'],
  ];
  const updateUrl = db.prepare(
    'UPDATE feeds SET url = ?, last_error = NULL WHERE url = ?'
  );
  for (const [oldUrl, newUrl] of urlFixes) {
    // If the new URL already exists (e.g. JumpCloud Blog covers the same feed),
    // delete the old row instead of updating to avoid UNIQUE violation
    const existing = db.prepare('SELECT id FROM feeds WHERE url = ?').get(newUrl);
    if (existing) {
      db.prepare('DELETE FROM feeds WHERE url = ?').run(oldUrl);
    } else {
      updateUrl.run(newUrl, oldUrl);
    }
  }

  return db;
}

export function closeDb() {
  if (db) {
    db.close();
    db = null;
  }
}
