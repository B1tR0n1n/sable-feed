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

export default function TierScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { articles, tiers, loading, refreshing, fetchArticles, markAllRead, sync } =
    useStore();
  const hasMore = useRef(true);

  const tier = tiers.find((t) => t.id === id);

  const loadArticles = useCallback(
    async (append = false) => {
      const before =
        append && articles.length > 0
          ? articles[articles.length - 1].published_at || undefined
          : undefined;
      const more = await fetchArticles({ tier_id: id, before, append });
      hasMore.current = more;
    },
    [id, articles, fetchArticles]
  );

  useEffect(() => {
    loadArticles();
  }, [id]);

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
        <View style={styles.headerInfo}>
          <Text style={styles.label}>{tier?.label || ''}</Text>
          <Text style={styles.title}>
            {tier?.title || id?.toUpperCase()}
          </Text>
        </View>
        <Pressable onPress={() => markAllRead({ tier_id: id })}>
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
  headerInfo: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: spacing.md,
  },
  label: {
    fontFamily: fonts.monoBold,
    fontSize: fontSize.xxl,
    color: colors.gold,
    letterSpacing: 2,
  },
  title: {
    fontFamily: fonts.mono,
    fontSize: fontSize.sm,
    color: colors.text,
    letterSpacing: 1.5,
    flex: 1,
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
