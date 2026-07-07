import { StyleSheet, View, ViewStyle } from 'react-native';
import { theme } from '@/theme';

export interface DividerProps {
  ornament?: boolean;
  style?: ViewStyle;
}

export function Divider({ ornament = false, style }: DividerProps) {
  if (!ornament) {
    return <View style={[styles.line, style]} />;
  }
  return (
    <View style={[styles.row, style]}>
      <View style={styles.flexLine} />
      <View style={styles.diamond} />
      <View style={styles.flexLine} />
    </View>
  );
}

const styles = StyleSheet.create({
  line: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: theme.colors.divider,
    alignSelf: 'stretch',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
    alignSelf: 'stretch',
  },
  flexLine: {
    flex: 1,
    height: StyleSheet.hairlineWidth,
    backgroundColor: theme.colors.divider,
  },
  diamond: {
    width: 8,
    height: 8,
    transform: [{ rotate: '45deg' }],
    backgroundColor: theme.colors.primary,
  },
});
