import { migrate, getDb, closeDb } from './db.js';

const TIERS = [
  {
    id: 'channel',
    label: '01',
    title: 'MSP CHANNEL & BUSINESS',
    cadence: '2-3x / WEEK',
    purpose: 'Understand the world Brightworks operates in — partner programs, MSP trends, competitive landscape.',
    sort_order: 1,
  },
  {
    id: 'partners',
    label: '02',
    title: 'BRIGHTWORKS PARTNER STACK',
    cadence: 'ON UPDATE',
    purpose: 'Early awareness of changes in tools your clients depend on — JumpCloud, SolCyber, Juniper Mist, Cisco, Microsoft.',
    sort_order: 2,
  },
  {
    id: 'threat',
    label: '03',
    title: 'CYBERSECURITY — THREAT AWARENESS',
    cadence: 'DAILY SCAN',
    purpose: 'Contextualize threats for client conversations. A TAM who can brief a client on a new CVE in plain language is worth more than one who can\'t.',
    sort_order: 3,
  },
  {
    id: 'infra',
    label: '04',
    title: 'INFRASTRUCTURE & NETWORKING',
    cadence: '2-3x / WEEK',
    purpose: 'Stay current on the network and systems layer you\'ll be diagnosing and designing at client sites.',
    sort_order: 4,
  },
  {
    id: 'ai',
    label: '05',
    title: 'AI/ML & PERSONAL TRAJECTORY',
    cadence: 'WEEKLY DEEP READ',
    purpose: 'Feed the SABLE project and long-term positioning. This is your edge — the thing that separates you from every other TAM.',
    sort_order: 5,
  },
];

const FEEDS = [
  // Tier 01 — MSP CHANNEL & BUSINESS
  { title: 'CRN — IT Channel News', url: 'https://www.crn.com/news/rss.xml', tier_id: 'channel' },
  { title: 'CRN — Managed Services', url: 'https://www.crn.com/news/managed-services/rss.xml', tier_id: 'channel' },
  { title: 'CRN — Security', url: 'https://www.crn.com/news/security/rss.xml', tier_id: 'channel' },
  { title: 'CRN — Cloud', url: 'https://www.crn.com/news/cloud/rss.xml', tier_id: 'channel' },
  { title: 'Channel Futures', url: 'https://www.channelfutures.com/rss.xml', tier_id: 'channel' },

  // Tier 02 — BRIGHTWORKS PARTNER STACK
  { title: 'JumpCloud Blog', url: 'https://jumpcloud.com/blog/feed', tier_id: 'partners' },
  { title: 'JumpCloud — Device Mgmt', url: 'https://jumpcloud.com/blog/feed', tier_id: 'partners' },
  { title: 'SolCyber Blog', url: 'https://solcyber.com/blog/feed/', tier_id: 'partners' },
  { title: 'Juniper Networks Blog', url: 'https://blogs.juniper.net/feed', tier_id: 'partners' },
  { title: 'Cisco Networking Blog', url: 'https://blogs.cisco.com/networking/feed', tier_id: 'partners' },
  { title: 'Cisco Security Blog', url: 'https://blogs.cisco.com/security/feed', tier_id: 'partners' },
  { title: 'Microsoft 365 Blog', url: 'https://www.microsoft.com/en-us/microsoft-365/blog/feed/', tier_id: 'partners' },
  { title: 'Microsoft Security Blog', url: 'https://www.microsoft.com/en-us/security/blog/feed/', tier_id: 'partners' },

  // Tier 03 — CYBERSECURITY — THREAT AWARENESS
  { title: 'Krebs on Security', url: 'https://krebsonsecurity.com/feed/', tier_id: 'threat' },
  { title: 'Bruce Schneier', url: 'https://www.schneier.com/blog/atom.xml', tier_id: 'threat' },
  { title: 'CISA Advisories (All)', url: 'https://www.cisa.gov/cybersecurity-advisories/all.xml', tier_id: 'threat' },
  { title: 'CISA ICS Advisories', url: 'https://www.cisa.gov/cybersecurity-advisories/ics-advisories.xml', tier_id: 'threat' },
  { title: 'BleepingComputer', url: 'https://www.bleepingcomputer.com/feed/', tier_id: 'threat' },
  { title: 'The Record', url: 'https://therecord.media/feed', tier_id: 'threat' },

  // Tier 04 — INFRASTRUCTURE & NETWORKING
  { title: 'Ars Technica — Technology', url: 'https://feeds.arstechnica.com/arstechnica/technology-lab', tier_id: 'infra' },
  { title: 'Ars Technica — Security', url: 'https://feeds.arstechnica.com/arstechnica/security', tier_id: 'infra' },
  { title: 'The Register', url: 'https://www.theregister.com/headlines.atom', tier_id: 'infra' },
  { title: 'ipSpace.net', url: 'https://feed.ipspace.net/blog', tier_id: 'infra' },
  { title: 'CRN — Networking', url: 'https://www.crn.com/news/networking/rss.xml', tier_id: 'infra' },

  // Tier 05 — AI/ML & PERSONAL TRAJECTORY
  { title: 'Simon Willison\'s Blog', url: 'https://simonwillison.net/atom/everything/', tier_id: 'ai' },
  { title: 'Hugging Face Blog', url: 'https://huggingface.co/blog/feed.xml', tier_id: 'ai' },
  { title: 'The Changelog', url: 'https://changelog.com/podcast/feed', tier_id: 'ai' },
  { title: 'TLDR Newsletter', url: 'https://tldr.tech/api/rss/tech', tier_id: 'ai' },
];

export function seed() {
  const db = migrate();

  const tierCount = db.prepare('SELECT COUNT(*) as count FROM tiers').get().count;
  if (tierCount > 0) {
    console.log('Database already seeded. Skipping.');
    return;
  }

  const insertTier = db.prepare(`
    INSERT INTO tiers (id, label, title, cadence, purpose, sort_order)
    VALUES (@id, @label, @title, @cadence, @purpose, @sort_order)
  `);

  const insertFeed = db.prepare(`
    INSERT OR IGNORE INTO feeds (title, url, tier_id)
    VALUES (@title, @url, @tier_id)
  `);

  const seedAll = db.transaction(() => {
    for (const tier of TIERS) {
      insertTier.run(tier);
    }
    for (const feed of FEEDS) {
      insertFeed.run(feed);
    }
  });

  seedAll();
  console.log(`Seeded ${TIERS.length} tiers and ${FEEDS.length} feeds.`);
}

// Run directly
if (process.argv[1] && process.argv[1].endsWith('seed.js')) {
  seed();
  closeDb();
}
