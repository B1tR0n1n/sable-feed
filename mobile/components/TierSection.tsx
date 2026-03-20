import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { colors, fonts, fontSize, spacing } from '../constants/theme';
import { Badge } from './Badge';
import type { Tier, Feed } from '../lib/api';

interface TierSectionProps {
  tier: Tier;
  feeds: Feed[];
  expanded: boolean;
  onToggle: () => void;
}

export function TierSection({ tier, feeds, expanded, onToggle }: TierSectionProps) {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <Pressable style={styles.header} onPress={onToggle}>
        <View style={styles.headerLeft}>
          <Text style={styles.label}>{tier.label}</Text>
          <View style={styles.headerInfo}>
            <Text style={styles.title}>{tier.title}</Text>
            <Badge text={tier.cadence} variant="cadence" />
          </View>
        </View>
        <View style={styles.headerRight}>
          {tier.unread_count > 0 && (
            <Badge text={String(tier.unread_count)} variant="count" />
          )}
          <Text style={styles.chevron}>{expanded ? '\u2212' : '+'}</Text>
        </View>
      </Pressable>

      {expanded && (
        <View style={styles.feedList}>
          <Pressable
            style={styles.viewAllRow}
            onPress={() => router.push(`/tier/${tier.id}` as any)}
          >
            <Text style={styles.viewAllText}>VIEW ALL ARTICLES</Text>
            <Text style={styles.viewAllArrow}>{'\u2192'}</Text>
          </Pressable>

          {feeds.map((feed) => (
            <Pressable
              key={feed.id}
              style={styles.feedRow}
              onPress={() => router.push(`/feed/${feed.id}` as any)}
            >
              <View style={styles.feedInfo}>
                <Text style={styles.feedTitle} numberOfLines={1}>
                  {feed.title}
                </Text>
                {feed.last_error ? (
                  <Text style={styles.feedError} numberOfLines={1}>
                    {feed.last_error}
                  </Text>
                ) : null}
              </View>
              {feed.unread_count > 0 && (
                <Text style={styles.feedUnread}>{feed.unread_count}</Text>
              )}
            </Pressable>
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.md,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    flex: 1,
    gap: spacing.md,
  },
  label: {
    fontFamily: fonts.monoBold,
    fontSize: fontSize.xl,
    color: colors.gold,
    letterSpacing: 2,
    minWidth: 32,
  },
  headerInfo: {
    flex: 1,
    gap: spacing.sm,
  },
  title: {
    fontFamily: fonts.mono,
    fontSize: fontSize.sm,
    color: colors.text,
    letterSpacing: 1.5,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  chevron: {
    fontFamily: fonts.mono,
    fontSize: fontSize.xl,
    color: colors.dim,
  },
  feedList: {
    paddingBottom: spacing.md,
    paddingLeft: spacing.xl + spacing.md,
    paddingRight: spacing.md,
  },
  viewAllRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    marginBottom: spacing.xs,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  viewAllText: {
    fontFamily: fonts.mono,
    fontSize: fontSize.xs,
    color: colors.gold,
    letterSpacing: 2,
  },
  viewAllArrow: {
    fontFamily: fonts.mono,
    fontSize: fontSize.md,
    color: colors.gold,
  },
  feedRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  feedInfo: {
    flex: 1,
    marginRight: spacing.md,
  },
  feedTitle: {
    fontFamily: fonts.mono,
    fontSize: fontSize.sm,
    color: colors.text,
  },
  feedError: {
    fontFamily: fonts.mono,
    fontSize: fontSize.xs,
    color: colors.danger,
    marginTop: 2,
  },
  feedUnread: {
    fontFamily: fonts.monoBold,
    fontSize: fontSize.sm,
    color: colors.gold,
    minWidth: 24,
    textAlign: 'right',
  },
});
