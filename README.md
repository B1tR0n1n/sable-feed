# SABLE FEED

Personal intelligence feed reader for MSP technical account management.

## Architecture

- **Backend**: Node.js + Fastify + SQLite (`backend/`)
- **Mobile**: React Native + Expo + Zustand (`mobile/`)

## Quick Start

### Backend

```bash
cd backend
npm install
npm run dev
```

Server starts on `http://localhost:3000`. Database seeds automatically with 5 tiers and 28 feeds.

### Mobile

```bash
cd mobile
npm install
npx expo start
```

Set `EXPO_PUBLIC_API_URL` to your backend URL (defaults to `http://localhost:3000`).

### Feed Refresh

Feeds auto-refresh every 30 minutes via cron. Force refresh:

```bash
curl -X POST http://localhost:3000/api/refresh-all
```

## API

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/health` | Health check |
| GET | `/api/tiers` | List tiers with unread counts |
| GET | `/api/feeds` | List feeds grouped by tier |
| POST | `/api/feeds` | Add feed `{ url, tier_id }` |
| DELETE | `/api/feeds/:id` | Remove feed |
| POST | `/api/feeds/:id/refresh` | Force refresh single feed |
| POST | `/api/feeds/import-opml` | Import OPML (multipart) |
| GET | `/api/feeds/export-opml` | Export OPML |
| GET | `/api/articles` | Paginated articles (query: tier_id, feed_id, is_read, is_saved, before, limit) |
| GET | `/api/articles/:id` | Single article with full content |
| PATCH | `/api/articles/:id/read` | Mark read/unread |
| PATCH | `/api/articles/:id/save` | Toggle saved |
| POST | `/api/articles/mark-all-read` | Mark all read (optional: tier_id, feed_id) |
| GET | `/api/sync` | Bulk sync (query: since, limit) |
| POST | `/api/refresh-all` | Refresh all feeds |

---

SABLE FEED v1.0
b1tr0n1n — SABLE STANDING BY
Built 2026
