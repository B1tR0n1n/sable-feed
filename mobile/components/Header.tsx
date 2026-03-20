import { View, Text, StyleSheet } from 'react-native';
import { colors, fonts, fontSize, spacing } from '../constants/theme';

export function Header() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>SABLE FEED</Text>
      <Text style={styles.subtitle}>Intelligence Feed</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingTop: spacing.lg,
    paddingBottom: spacing.md,
    paddingHorizontal: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  title: {
    fontFamily: fonts.monoBold,
    fontSize: fontSize.xxl,
    color: colors.gold,
    letterSpacing: 4,
  },
  subtitle: {
    fontFamily: fonts.serifItalic,
    fontSize: fontSize.lg,
    color: colors.dim,
    marginTop: spacing.xs,
  },
});
