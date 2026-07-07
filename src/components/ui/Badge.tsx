import { StyleSheet, View, ViewStyle } from 'react-native';
import { AppText } from './Text';
import { theme } from '@/theme';

export type BadgeTone = 'neutral' | 'gold' | 'success' | 'warning' | 'danger';

export interface BadgeProps {
  label: string;
  tone?: BadgeTone;
  style?: ViewStyle;
}

// Light-theme tones: soft tinted fills with deep, readable text on the light UI.
const TONES: Record<BadgeTone, { bg: string; border: string; text: string }> = {
  neutral: { bg: 'rgba(133,111,82,0.12)', border: theme.colors.border, text: theme.colors.textMuted },
  gold: { bg: 'rgba(212,163,44,0.18)', border: theme.colors.borderStrong, text: theme.palette.goldDeep },
  success: { bg: 'rgba(76,160,91,0.16)', border: theme.colors.success, text: theme.palette.greenDeep },
  warning: { bg: 'rgba(232,140,42,0.16)', border: theme.colors.warning, text: theme.palette.saffronDeep },
  danger: { bg: 'rgba(202,70,54,0.14)', border: theme.colors.danger, text: theme.palette.maroon },
};

export function Badge({ label, tone = 'neutral', style }: BadgeProps) {
  const t = TONES[tone];
  return (
    <View
      style={[
        styles.badge,
        { backgroundColor: t.bg, borderColor: t.border },
        style,
      ]}
    >
      <AppText variant="small" color={t.text}>
        {label}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    alignSelf: 'flex-start',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.radii.pill,
    borderWidth: 1,
  },
});
