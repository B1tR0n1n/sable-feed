import { useEffect, useCallback, useRef } from 'react';
import {
  View,
  FlatList,
  RefreshControl,
  Text,
  Pressable,
  StyleSheet,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ArticleCard } from '../../components/ArticleCard';
import { useStore } from '../../lib/store';
import { colors, fonts, fontSize, spacing } from '../../constants/theme';

export default function UnreadScreen() {
  const insets = useSafeAreaInsets();
  const { articles, loading, refreshing, fetchArticles, markAllRead, sync } =
    useStore();
  const hasMore = useRef(true);

  const loadArticles = useCallback(
    async (append = false) => {
      const before =
        append && articles.length > 0
          ? articles[articles.length - 1].published_at || undefined
          : undefined;
      const more = await fetchArticles({
        is_read: false,
        before,
        append,
      });
      hasMore.current = more;
    },
    [articles, fetchArticles]
  );

  useEffect(() => {
    loadArticles();
  }, []);

  const onRefresh = useCallback(async () => {
    await sync();
    await loadArticles();
  }, [sync, loadArticles]);

  const unread = articles.filter((a) => !a.is_read);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Text style={styles.title}>UNREAD</Text>
        <Pressable onPress={() => markAllRead()}>
          <Text style={styles.markAll}>MARK ALL READ</Text>
        </Pressable>
      </View>
      <FlatList
        data={unread}
        keyExtractor={(item) => String(item.id)}
        renderItem={({ item }) => <ArticleCard article={item} showTier />}
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
              <Text style={styles.emptyText}>All caught up.</Text>
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.lg,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  title: {
    fontFamily: fonts.monoBold,
    fontSize: fontSize.xl,
    color: colors.gold,
    letterSpacing: 3,
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
  },
  empty: { padding: spacing.xxl, alignItems: 'center' },
  emptyText: {
    fontFamily: fonts.serifItalic,
    fontSize: fontSize.lg,
    color: colors.dim,
  },
});
