import { useEffect, useCallback } from 'react';
import {
  View,
  ScrollView,
  Text,
  Pressable,
  Linking,
  StyleSheet,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ArticleContent } from '../../components/ArticleContent';
import { useStore } from '../../lib/store';
import { colors, fonts, fontSize, spacing } from '../../constants/theme';

function formatFullDate(dateStr: string | null): string {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-US', {
    weekday: 'short',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function ArticleScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const articleId = parseInt(id || '0', 10);
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { currentArticle, loading, fetchArticle, markRead, toggleSaved } =
    useStore();

  useEffect(() => {
    fetchArticle(articleId);
  }, [articleId]);

  // Auto-mark as read on open
  useEffect(() => {
    if (currentArticle && !currentArticle.is_read) {
      markRead(currentArticle.id, true);
    }
  }, [currentArticle?.id]);

  const handleOpenBrowser = useCallback(() => {
    if (currentArticle?.link) {
      Linking.openURL(currentArticle.link);
    }
  }, [currentArticle?.link]);

  const handleToggleSaved = useCallback(() => {
    if (currentArticle) {
      toggleSaved(currentArticle.id, !currentArticle.is_saved);
    }
  }, [currentArticle, toggleSaved]);

  if (loading || !currentArticle) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.loadingView}>
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.topBar}>
        <Pressable onPress={() => router.back()}>
          <Text style={styles.back}>{'\u2190'} BACK</Text>
        </Pressable>
        <Pressable onPress={handleToggleSaved}>
          <Text
            style={[
              styles.saveButton,
              !!currentArticle.is_saved && styles.saveActive,
            ]}
          >
            {currentArticle.is_saved ? '\u25a0 SAVED' : '\u25a1 SAVE'}
          </Text>
        </Pressable>
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
        <Text style={styles.feedName}>{currentArticle.feed_title}</Text>
        <Text style={styles.articleTitle}>{currentArticle.title}</Text>

        <View style={styles.meta}>
          {currentArticle.author ? (
            <Text style={styles.author}>{currentArticle.author}</Text>
          ) : null}
          <Text style={styles.date}>
            {formatFullDate(currentArticle.published_at)}
          </Text>
        </View>

        <View style={styles.divider} />

        <ArticleContent
          content={currentArticle.content || null}
          summary={currentArticle.summary || null}
        />

        {currentArticle.link ? (
          <Pressable style={styles.browserButton} onPress={handleOpenBrowser}>
            <Text style={styles.browserButtonText}>OPEN IN BROWSER</Text>
          </Pressable>
        ) : null}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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
  },
  saveButton: {
    fontFamily: fonts.mono,
    fontSize: fontSize.xs,
    color: colors.dim,
    letterSpacing: 1,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  saveActive: {
    color: colors.gold,
    borderColor: colors.activeBorder,
  },
  scroll: { flex: 1 },
  scrollContent: {
    padding: spacing.md,
    paddingBottom: spacing.xxl,
  },
  feedName: {
    fontFamily: fonts.mono,
    fontSize: fontSize.xs,
    color: colors.dim,
    letterSpacing: 1,
    marginBottom: spacing.sm,
    textTransform: 'uppercase',
  },
  articleTitle: {
    fontFamily: fonts.serifBold,
    fontSize: fontSize.title,
    color: colors.text,
    lineHeight: 36,
    marginBottom: spacing.md,
  },
  meta: {
    flexDirection: 'row',
    gap: spacing.md,
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  author: {
    fontFamily: fonts.mono,
    fontSize: fontSize.xs,
    color: colors.text,
  },
  date: {
    fontFamily: fonts.mono,
    fontSize: fontSize.xs,
    color: colors.dim,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.border,
    marginBottom: spacing.lg,
  },
  loadingView: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontFamily: fonts.mono,
    fontSize: fontSize.md,
    color: colors.dim,
  },
  browserButton: {
    marginTop: spacing.xl,
    borderWidth: 1,
    borderColor: colors.activeBorder,
    paddingVertical: spacing.md,
    alignItems: 'center',
    borderRadius: 2,
  },
  browserButtonText: {
    fontFamily: fonts.mono,
    fontSize: fontSize.sm,
    color: colors.gold,
    letterSpacing: 2,
  },
});
