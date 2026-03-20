import axios from 'axios';

const client = axios.create({
  baseURL: process.env.EXPO_PUBLIC_API_URL || 'https://sable-feed-production.up.railway.app',
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
});

// ── Types ──────────────────────────────────────────────

export interface Tier {
  id: string;
  label: string;
  title: string;
  cadence: string;
  purpose: string;
  sort_order: number;
  unread_count: number;
  total_count: number;
}

export interface Feed {
  id: number;
  title: string;
  url: string;
  site_url: string | null;
  tier_id: string;
  last_fetched_at: string | null;
  last_error: string | null;
  created_at: string;
  unread_count: number;
  total_count: number;
}

export interface Article {
  id: number;
  feed_id: number;
  guid: string;
  title: string;
  link: string | null;
  summary: string | null;
  content?: string | null;
  author: string | null;
  published_at: string | null;
  fetched_at: string;
  feed_title: string;
  tier_id: string;
  is_read: number;
  is_saved: number;
}

export interface ArticleListResponse {
  articles: Article[];
  has_more: boolean;
  next_cursor: string | null;
}

export interface SyncResponse {
  articles: Article[];
  synced_at: string;
  count: number;
}

// ── Tiers ──────────────────────────────────────────────

export const getTiers = () =>
  client.get<Tier[]>('/api/tiers').then((r) => r.data);

// ── Feeds ──────────────────────────────────────────────

export const getFeeds = () =>
  client.get<Record<string, Feed[]>>('/api/feeds').then((r) => r.data);

export const addFeed = (url: string, tier_id: string, title?: string) =>
  client.post<Feed>('/api/feeds', { url, tier_id, title }).then((r) => r.data);

export const deleteFeed = (id: number) =>
  client.delete(`/api/feeds/${id}`).then((r) => r.data);

export const refreshFeed = (id: number) =>
  client.post(`/api/feeds/${id}/refresh`).then((r) => r.data);

// ── Articles ───────────────────────────────────────────

export const getArticles = (params: {
  tier_id?: string;
  feed_id?: number;
  is_read?: boolean;
  is_saved?: boolean;
  before?: string;
  limit?: number;
}) =>
  client
    .get<ArticleListResponse>('/api/articles', { params })
    .then((r) => r.data);

export const getArticle = (id: number) =>
  client.get<Article>(`/api/articles/${id}`).then((r) => r.data);

export const markRead = (id: number, is_read: boolean) =>
  client.patch(`/api/articles/${id}/read`, { is_read }).then((r) => r.data);

export const toggleSaved = (id: number, is_saved: boolean) =>
  client.patch(`/api/articles/${id}/save`, { is_saved }).then((r) => r.data);

export const markAllRead = (params?: { tier_id?: string; feed_id?: number }) =>
  client
    .post<{ marked: number }>('/api/articles/mark-all-read', params || {})
    .then((r) => r.data);

// ── Sync ───────────────────────────────────────────────

export const syncArticles = (since?: string) =>
  client
    .get<SyncResponse>('/api/sync', { params: since ? { since } : {} })
    .then((r) => r.data);

// ── System ─────────────────────────────────────────────

export const refreshAll = () =>
  client
    .post<{
      refreshed: number;
      new_articles: number;
      errors: { feed: string; error: string }[];
    }>('/api/refresh-all')
    .then((r) => r.data);

export const healthCheck = () =>
  client.get('/api/health').then((r) => r.data);
