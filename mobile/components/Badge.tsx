import { View, Text, StyleSheet } from 'react-native';
import { colors, fonts, fontSize, spacing } from '../constants/theme';

interface BadgeProps {
  text: string;
  variant?: 'cadence' | 'count';
}

export function Badge({ text, variant = 'cadence' }: BadgeProps) {
  return (
    <View style={[styles.badge, styles[variant]]}>
      <Text style={[styles.text, variant === 'count' && styles.countText]}>
        {text}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: 2,
    alignSelf: 'flex-start',
  },
  cadence: {
    borderWidth: 1,
    borderColor: colors.activeBorder,
  },
  count: {
    backgroundColor: colors.gold,
    minWidth: 24,
    alignItems: 'center' as const,
    borderRadius: 12,
    paddingHorizontal: spacing.sm,
  },
  text: {
    fontFamily: fonts.mono,
    fontSize: fontSize.xs,
    color: colors.gold,
    letterSpacing: 1.5,
    textTransform: 'uppercase' as const,
  },
  countText: {
    color: colors.background,
    fontFamily: fonts.monoBold,
  },
});
