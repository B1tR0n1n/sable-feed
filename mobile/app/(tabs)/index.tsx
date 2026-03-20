import { useEffect, useCallback } from 'react';
import { View, FlatList, RefreshControl, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Header } from '../../components/Header';
import { TierSection } from '../../components/TierSection';
import { useStore } from '../../lib/store';
import { colors } from '../../constants/theme';

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const {
    tiers,
    feeds,
    refreshing,
    expandedTiers,
    fetchTiers,
    fetchFeeds,
    sync,
    toggleTier,
  } = useStore();

  useEffect(() => {
    fetchTiers();
    fetchFeeds();
    sync();
  }, []);

  const onRefresh = useCallback(async () => {
    await sync();
    await Promise.all([fetchTiers(), fetchFeeds()]);
  }, [sync, fetchTiers, fetchFeeds]);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <FlatList
        data={tiers}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={<Header />}
        renderItem={({ item }) => (
          <TierSection
            tier={item}
            feeds={feeds[item.id] || []}
            expanded={!!expandedTiers[item.id]}
            onToggle={() => toggleTier(item.id)}
          />
        )}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.gold}
            colors={[colors.gold]}
          />
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
});
