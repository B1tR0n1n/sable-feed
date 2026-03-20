import { useState, useCallback } from 'react';
import {
  View,
  Text,
  Pressable,
  ScrollView,
  TextInput,
  Alert,
  StyleSheet,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useStore } from '../../lib/store';
import * as api from '../../lib/api';
import { colors, fonts, fontSize, spacing } from '../../constants/theme';

export default function SettingsScreen() {
  const insets = useSafeAreaInsets();
  const { feeds, tiers, refreshing, refreshAll, fetchFeeds } = useStore();
  const [newUrl, setNewUrl] = useState('');
  const [newTier, setNewTier] = useState('channel');

  const allFeeds = Object.values(feeds).flat();

  const handleAddFeed = useCallback(async () => {
    if (!newUrl.trim()) return;
    try {
      await api.addFeed(newUrl.trim(), newTier);
      setNewUrl('');
      await fetchFeeds();
      Alert.alert('Feed Added', 'The feed has been added and is being fetched.');
    } catch (err: any) {
      Alert.alert('Error', err.message);
    }
  }, [newUrl, newTier, fetchFeeds]);

  const handleDeleteFeed = useCallback(
    (feed: api.Feed) => {
      Alert.alert('Remove Feed', `Remove "${feed.title}"?`, [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            try {
              await api.deleteFeed(feed.id);
              await fetchFeeds();
            } catch (err: any) {
              Alert.alert('Error', err.message);
            }
          },
        },
      ]);
    },
    [fetchFeeds]
  );

  const handleRefresh = useCallback(async () => {
    await refreshAll();
    Alert.alert('Refreshed', 'All feeds have been refreshed.');
  }, [refreshAll]);

  return (
    <ScrollView
      style={[styles.container, { paddingTop: insets.top }]}
      contentContainerStyle={styles.scrollContent}
    >
      <View style={styles.header}>
        <Text style={styles.headerTitle}>SETTINGS</Text>
      </View>

      {/* Add Feed */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>ADD FEED</Text>
        <TextInput
          style={styles.input}
          value={newUrl}
          onChangeText={setNewUrl}
          placeholder="RSS feed URL"
          placeholderTextColor={colors.dim}
          autoCapitalize="none"
          autoCorrect={false}
          keyboardType="url"
        />
        <View style={styles.tierPicker}>
          {tiers.map((t) => (
            <Pressable
              key={t.id}
              style={[
                styles.tierOption,
                newTier === t.id && styles.tierSelected,
              ]}
              onPress={() => setNewTier(t.id)}
            >
              <Text
                style={[
                  styles.tierOptionText,
                  newTier === t.id && styles.tierSelectedText,
                ]}
              >
                {t.label}
              </Text>
            </Pressable>
          ))}
        </View>
        <Pressable style={styles.button} onPress={handleAddFeed}>
          <Text style={styles.buttonText}>ADD</Text>
        </Pressable>
      </View>

      {/* Refresh */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>SYNC</Text>
        <Pressable
          style={[styles.button, refreshing && styles.buttonDisabled]}
          onPress={handleRefresh}
          disabled={refreshing}
        >
          <Text style={styles.buttonText}>
            {refreshing ? 'REFRESHING...' : 'REFRESH ALL FEEDS'}
          </Text>
        </Pressable>
      </View>

      {/* Feed Management */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>MANAGE FEEDS</Text>
        {allFeeds.map((feed) => (
          <View key={feed.id} style={styles.feedRow}>
            <View style={styles.feedInfo}>
              <Text style={styles.feedTitle} numberOfLines={1}>
                {feed.title}
              </Text>
              <Text style={styles.feedUrl} numberOfLines={1}>
                {feed.url}
              </Text>
              {feed.last_error ? (
                <Text style={styles.feedError} numberOfLines={2}>
                  ERROR: {feed.last_error}
                </Text>
              ) : null}
            </View>
            <Pressable onPress={() => handleDeleteFeed(feed)}>
              <Text style={styles.deleteText}>{'\u00d7'}</Text>
            </Pressable>
          </View>
        ))}
      </View>

      {/* About */}
      <View style={styles.about}>
        <Text style={styles.aboutText}>SABLE FEED v1.0</Text>
        <Text style={styles.aboutDim}>b1tr0n1n — SABLE STANDING BY</Text>
        <Text style={styles.aboutDim}>Built 2026</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  scrollContent: { paddingBottom: spacing.xxl },
  header: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.lg,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  headerTitle: {
    fontFamily: fonts.monoBold,
    fontSize: fontSize.xl,
    color: colors.gold,
    letterSpacing: 3,
  },
  section: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.lg,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  sectionTitle: {
    fontFamily: fonts.mono,
    fontSize: fontSize.sm,
    color: colors.gold,
    letterSpacing: 2,
    marginBottom: spacing.md,
  },
  input: {
    fontFamily: fonts.mono,
    fontSize: fontSize.md,
    color: colors.text,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 4,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    marginBottom: spacing.md,
  },
  tierPicker: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.md,
    flexWrap: 'wrap',
  },
  tierOption: {
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: 2,
  },
  tierSelected: {
    borderColor: colors.gold,
    backgroundColor: colors.surface,
  },
  tierOptionText: {
    fontFamily: fonts.mono,
    fontSize: fontSize.sm,
    color: colors.dim,
  },
  tierSelectedText: {
    color: colors.gold,
  },
  button: {
    borderWidth: 1,
    borderColor: colors.activeBorder,
    paddingVertical: spacing.sm,
    alignItems: 'center',
    borderRadius: 2,
  },
  buttonDisabled: { opacity: 0.5 },
  buttonText: {
    fontFamily: fonts.mono,
    fontSize: fontSize.sm,
    color: colors.gold,
    letterSpacing: 2,
  },
  feedRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  feedInfo: { flex: 1, marginRight: spacing.md },
  feedTitle: {
    fontFamily: fonts.mono,
    fontSize: fontSize.sm,
    color: colors.text,
  },
  feedUrl: {
    fontFamily: fonts.mono,
    fontSize: fontSize.xs,
    color: colors.dim,
    marginTop: 2,
  },
  feedError: {
    fontFamily: fonts.mono,
    fontSize: fontSize.xs,
    color: colors.danger,
    marginTop: 4,
  },
  deleteText: {
    fontFamily: fonts.mono,
    fontSize: fontSize.xxl,
    color: colors.danger,
    paddingHorizontal: spacing.sm,
  },
  about: {
    alignItems: 'center',
    paddingVertical: spacing.xxl,
  },
  aboutText: {
    fontFamily: fonts.mono,
    fontSize: fontSize.sm,
    color: colors.gold,
    letterSpacing: 2,
    marginBottom: spacing.sm,
  },
  aboutDim: {
    fontFamily: fonts.mono,
    fontSize: fontSize.xs,
    color: colors.dim,
    letterSpacing: 1,
    marginBottom: spacing.xs,
  },
});
