import { Tabs } from 'expo-router';
import { Text, StyleSheet } from 'react-native';
import { colors, fonts, fontSize } from '../../constants/theme';

function TabIcon({ name, focused }: { name: string; focused: boolean }) {
  const icons: Record<string, string> = {
    home: '\u25c9',
    unread: '\u25c8',
    saved: '\u25a0',
    settings: '\u2699',
  };
  return (
    <Text style={[styles.icon, focused && styles.iconActive]}>
      {icons[name] || '\u2022'}
    </Text>
  );
}

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: styles.tabBar,
        tabBarLabelStyle: styles.tabLabel,
        tabBarActiveTintColor: colors.gold,
        tabBarInactiveTintColor: colors.dim,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ focused }) => <TabIcon name="home" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="unread"
        options={{
          title: 'Unread',
          tabBarIcon: ({ focused }) => (
            <TabIcon name="unread" focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="saved"
        options={{
          title: 'Saved',
          tabBarIcon: ({ focused }) => (
            <TabIcon name="saved" focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Settings',
          tabBarIcon: ({ focused }) => (
            <TabIcon name="settings" focused={focused} />
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: colors.background,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
    paddingTop: 4,
  },
  tabLabel: {
    fontFamily: fonts.mono,
    fontSize: fontSize.xs,
    letterSpacing: 1,
  },
  icon: {
    fontSize: 18,
    color: colors.dim,
  },
  iconActive: {
    color: colors.gold,
  },
});
