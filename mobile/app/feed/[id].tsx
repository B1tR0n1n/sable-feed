import { useEffect, useCallback, useRef } from 'react';
import {
  View,
  FlatList,
  RefreshControl,
  Text,
  Pressable,
  StyleSheet,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ArticleCard } from '../../components/ArticleCard';
import { useStore } from '../../lib/store';
import { colors, fonts, fontSize, spacing } from '../../constants/theme';

export default function FeedScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const feedId = parseInt(id || '0', 10);
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { articles, feeds, loading, refreshing, fetchArticles, markAllRead, sync } =
    useStore();
  const hasMore = useRef(true);

  const allFeeds = Object.values(feeds).flat();
  const feed = allFeeds.find((f) => f.id === feedId);

  const loadArticles = useCallback(
    async (append = false) => {
      const before =
        append && articles.length > 0
          ? articles[articles.length - 1].published_at || undefined
          : undefined;
      const more = await fetchArticles({ feed_id: feedId, before, append });
      hasMore.current = more;
    },
    [feedId, articles, fetchArticles]
  );

  useEffect(() => {
    loadArticles();
  }, [feedId]);

  const onRefresh = useCallback(async () => {
    await sync();
    await loadArticles();
  }, [sync, loadArticles]);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()}>
          <Text style={styles.back}>{'\u2190'} BACK</Text>
        </Pressable>
        <Text style={styles.title} numberOfLines={1}>
          {feed?.title || `Feed ${id}`}
        </Text>
        <Pressable onPress={() => markAllRead({ feed_id: feedId })}>
          <Text style={styles.markAll}>MARK READ</Text>
        </Pressable>
      </View>
      <FlatList
        data={articles}
        keyExtractor={(item) => String(item.id)}
        renderItem={({ item }) => <ArticleCard article={item} />}
        onEndReached={() => hasMore.current && loadArticles(true)}
        onEndReachedThreshold={0.5}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.gold}
            colors={[colors.gold]}
          />
        }
        ListEmptyComponent={
          !loading ? (
            <View style={styles.empty}>
              <Text style={styles.emptyText}>No articles yet.</Text>
            </View>
          ) : null
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  back: {
    fontFamily: fonts.mono,
    fontSize: fontSize.xs,
    color: colors.gold,
    letterSpacing: 1,
    marginBottom: spacing.sm,
  },
  title: {
    fontFamily: fonts.mono,
    fontSize: fontSize.md,
    color: colors.text,
    letterSpacing: 0.5,
  },
  markAll: {
    fontFamily: fonts.mono,
    fontSize: fontSize.xs,
    color: colors.gold,
    letterSpacing: 1,
    borderWidth: 1,
    borderColor: colors.activeBorder,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    alignSelf: 'flex-end',
    marginTop: spacing.sm,
  },
  empty: { padding: spacing.xxl, alignItems: 'center' },
  emptyText: {
    fontFamily: fonts.serifItalic,
    fontSize: fontSize.lg,
    color: colors.dim,
  },
});
