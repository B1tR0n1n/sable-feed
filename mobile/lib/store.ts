import { create } from 'zustand';
import * as api from './api';
import type { Tier, Feed, Article } from './api';

interface AppState {
  tiers: Tier[];
  feeds: Record<string, Feed[]>;
  articles: Article[];
  currentArticle: Article | null;

  loading: boolean;
  refreshing: boolean;
  error: string | null;
  lastSync: string | null;
  expandedTiers: Record<string, boolean>;

  fetchTiers: () => Promise<void>;
  fetchFeeds: () => Promise<void>;
  fetchArticles: (params: {
    tier_id?: string;
    feed_id?: number;
    is_read?: boolean;
    is_saved?: boolean;
    before?: string;
    limit?: number;
    append?: boolean;
  }) => Promise<boolean>;
  fetchArticle: (id: number) => Promise<void>;
  markRead: (id: number, is_read: boolean) => void;
  toggleSaved: (id: number, is_saved: boolean) => void;
  markAllRead: (params?: { tier_id?: string; feed_id?: number }) => Promise<void>;
  refreshAll: () => Promise<void>;
  sync: () => Promise<void>;
  toggleTier: (tierId: string) => void;
  clearError: () => void;
}

export const useStore = create<AppState>((set, get) => ({
  tiers: [],
  feeds: {},
  articles: [],
  currentArticle: null,
  loading: false,
  refreshing: false,
  error: null,
  lastSync: null,
  expandedTiers: {},

  fetchTiers: async () => {
    try {
      const tiers = await api.getTiers();
      set({ tiers });
    } catch (err: any) {
      set({ error: err.message });
    }
  },

  fetchFeeds: async () => {
    try {
      const feeds = await api.getFeeds();
      set({ feeds });
    } catch (err: any) {
      set({ error: err.message });
    }
  },

  fetchArticles: async (params) => {
    const { append = false, ...queryParams } = params;
    try {
      if (!append) set({ loading: true });
      const result = await api.getArticles(queryParams);
      set((state) => {
        if (!append) return { articles: result.articles, loading: false };
        // Deduplicate on append to prevent "two children with same key"
        const existingIds = new Set(state.articles.map((a) => a.id));
        const newArticles = result.articles.filter((a) => !existingIds.has(a.id));
        return { articles: [...state.articles, ...newArticles], loading: false };
      });
      return result.has_more;
    } catch (err: any) {
      set({ error: err.message, loading: false });
      return false;
    }
  },

  fetchArticle: async (id) => {
    try {
      set({ loading: true });
      const article = await api.getArticle(id);
      set({ currentArticle: article, loading: false });
    } catch (err: any) {
      set({ error: err.message, loading: false });
    }
  },

  markRead: (id, is_read) => {
    set((state) => ({
      articles: state.articles.map((a) =>
        a.id === id ? { ...a, is_read: is_read ? 1 : 0 } : a
      ),
      currentArticle:
        state.currentArticle?.id === id
          ? { ...state.currentArticle, is_read: is_read ? 1 : 0 }
          : state.currentArticle,
    }));
    api.markRead(id, is_read).catch(() => {});
  },

  toggleSaved: (id, is_saved) => {
    set((state) => ({
      articles: state.articles.map((a) =>
        a.id === id ? { ...a, is_saved: is_saved ? 1 : 0 } : a
      ),
      currentArticle:
        state.currentArticle?.id === id
          ? { ...state.currentArticle, is_saved: is_saved ? 1 : 0 }
          : state.currentArticle,
    }));
    api.toggleSaved(id, is_saved).catch(() => {});
  },

  markAllRead: async (params) => {
    try {
      await api.markAllRead(params);
      set((state) => ({
        articles: state.articles.map((a) => {
          if (params?.feed_id && a.feed_id !== params.feed_id) return a;
          if (params?.tier_id && a.tier_id !== params.tier_id) return a;
          return { ...a, is_read: 1 };
        }),
      }));
      await get().fetchTiers();
    } catch (err: any) {
      set({ error: err.message });
    }
  },

  refreshAll: async () => {
    try {
      set({ refreshing: true });
      await api.refreshAll();
      await Promise.all([get().fetchTiers(), get().fetchFeeds()]);
      set({ refreshing: false });
    } catch (err: any) {
      set({ error: err.message, refreshing: false });
    }
  },

  sync: async () => {
    try {
      set({ refreshing: true });
      const { lastSync } = get();
      const result = await api.syncArticles(lastSync || undefined);
      set({ lastSync: result.synced_at, refreshing: false });
      await get().fetchTiers();
    } catch (err: any) {
      set({ error: err.message, refreshing: false });
    }
  },

  toggleTier: (tierId) => {
    set((state) => ({
      expandedTiers: {
        ...state.expandedTiers,
        [tierId]: !state.expandedTiers[tierId],
      },
    }));
  },

  clearError: () => set({ error: null }),
}));
