import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { colors, fonts, fontSize, spacing } from '../constants/theme';
import type { Article } from '../lib/api';

interface ArticleCardProps {
  article: Article;
  showTier?: boolean;
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  const diffHrs = Math.floor(diffMs / 3600000);

  if (diffMin < 60) return `${Math.max(1, diffMin)}m ago`;
  if (diffHrs < 24) return `${diffHrs}h ago`;
  if (diffHrs < 168) return `${Math.floor(diffHrs / 24)}d ago`;
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export function ArticleCard({ article, showTier = false }: ArticleCardProps) {
  const router = useRouter();
  const isUnread = !article.is_read;

  return (
    <Pressable
      style={[styles.container, isUnread && styles.unread]}
      onPress={() => router.push(`/article/${article.id}` as any)}
    >
      {isUnread && <View style={styles.unreadBar} />}
      <View style={styles.content}>
        <View style={styles.meta}>
          <Text style={styles.feedName} numberOfLines={1}>
            {article.feed_title}
            {showTier ? ` \u00b7 ${article.tier_id.toUpperCase()}` : ''}
          </Text>
          <Text style={styles.date}>{formatDate(article.published_at)}</Text>
        </View>
        <Text
          style={[styles.title, !isUnread && styles.readTitle]}
          numberOfLines={2}
        >
          {article.title}
        </Text>
        {article.summary ? (
          <Text style={styles.summary} numberOfLines={2}>
            {article.summary}
          </Text>
        ) : null}
        {article.author ? (
          <Text style={styles.author}>{article.author}</Text>
        ) : null}
      </View>
      {article.is_saved ? <Text style={styles.savedIcon}>{'\u25a0'}</Text> : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
    backgroundColor: colors.background,
  },
  unread: {
    backgroundColor: colors.surface,
  },
  unreadBar: {
    width: 2,
    backgroundColor: colors.gold,
    marginRight: spacing.md,
    borderRadius: 1,
  },
  content: {
    flex: 1,
  },
  meta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  feedName: {
    fontFamily: fonts.mono,
    fontSize: fontSize.xs,
    color: colors.dim,
    letterSpacing: 0.5,
    flex: 1,
    marginRight: spacing.sm,
  },
  date: {
    fontFamily: fonts.mono,
    fontSize: fontSize.xs,
    color: colors.dim,
  },
  title: {
    fontFamily: fonts.serif,
    fontSize: fontSize.lg,
    color: colors.text,
    lineHeight: 22,
    marginBottom: spacing.xs,
  },
  readTitle: {
    color: colors.dim,
  },
  summary: {
    fontFamily: fonts.serif,
    fontSize: fontSize.md,
    color: colors.dim,
    lineHeight: 20,
  },
  author: {
    fontFamily: fonts.mono,
    fontSize: fontSize.xs,
    color: colors.dim,
    marginTop: spacing.xs,
  },
  savedIcon: {
    color: colors.gold,
    fontSize: fontSize.sm,
    marginLeft: spacing.sm,
    alignSelf: 'flex-start',
    marginTop: spacing.xs,
  },
});
