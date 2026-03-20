import { useEffect, useCallback, useRef } from 'react';
import { View, FlatList, RefreshControl, Text, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ArticleCard } from '../../components/ArticleCard';
import { useStore } from '../../lib/store';
import { colors, fonts, fontSize, spacing } from '../../constants/theme';

export default function SavedScreen() {
  const insets = useSafeAreaInsets();
  const { articles, loading, refreshing, fetchArticles, sync } = useStore();
  const hasMore = useRef(true);

  const loadArticles = useCallback(
    async (append = false) => {
      const before =
        append && articles.length > 0
          ? articles[articles.length - 1].published_at || undefined
          : undefined;
      const more = await fetchArticles({ is_saved: true, before, append });
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

  const saved = articles.filter((a) => a.is_saved);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Text style={styles.title}>SAVED</Text>
      </View>
      <FlatList
        data={saved}
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
              <Text style={styles.emptyText}>No saved articles.</Text>
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
  empty: { padding: spacing.xxl, alignItems: 'center' },
  emptyText: {
    fontFamily: fonts.serifItalic,
    fontSize: fontSize.lg,
    color: colors.dim,
  },
});
