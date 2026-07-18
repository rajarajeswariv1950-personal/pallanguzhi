import { ActivityIndicator, StyleSheet, View, ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { AppText } from './Text';
import { Icon, IconName } from './Icon';
import { PressableScale } from '@/components/anim/PressableScale';
import { tapFeedback } from '@/services/feedback';
import { theme } from '@/theme';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
export type ButtonSize = 'md' | 'lg';

export interface ButtonProps {
  label: string;
  onPress?: () => void;
  variant?: ButtonVariant;
  size?: ButtonSize;
  disabled?: boolean;
  loading?: boolean;
  icon?: IconName;
  fullWidth?: boolean;
  /** Play tap sound + haptic on press (default true). */
  feedback?: boolean;
  style?: ViewStyle;
}

export function Button({
  label,
  onPress,
  variant = 'primary',
  size = 'lg',
  disabled = false,
  loading = false,
  icon,
  fullWidth = true,
  feedback = true,
  style,
}: ButtonProps) {
  const isGradient = variant === 'primary' || variant === 'danger';
  const gradientColors = variant === 'danger' ? theme.gradients.maroon : theme.gradients.gold;
  const textColor =
    variant === 'primary'
      ? theme.colors.textOnGold
      : variant === 'danger'
        ? theme.colors.textInverse
        : theme.colors.primaryLight;
  // minHeight (not height) so a wrapped two-line Tamil label can grow the
  // button gracefully; single-line buttons keep the exact same size.
  const height = size === 'lg' ? 56 : 46;
  const isInteractive = !disabled && !loading;

  const handlePress = () => {
    if (!isInteractive) return;
    if (feedback) tapFeedback();
    onPress?.();
  };

  return (
    <PressableScale
      onPress={handlePress}
      disabled={!isInteractive}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: !isInteractive, busy: loading }}
      style={[
        styles.base,
        { minHeight: height },
        fullWidth ? styles.fullWidth : null,
        variant === 'secondary' ? styles.secondary : null,
        variant === 'ghost' ? styles.ghost : null,
        variant === 'primary' ? theme.shadows.gold : null,
        disabled ? styles.disabled : null,
        style,
      ]}
    >
      {isGradient ? (
        <LinearGradient
          colors={gradientColors}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
      ) : null}
      <View style={styles.content}>
        {loading ? (
          <ActivityIndicator color={textColor} />
        ) : (
          <>
            {icon ? <Icon name={icon} size={20} color={textColor} /> : null}
            <AppText
              variant="button"
              color={textColor}
              // Long Tamil labels wrap to a second line at full size —
              // readable and premium; never shrunk-tiny, never ellipsized.
              numberOfLines={2}
              style={styles.label}
            >
              {label}
            </AppText>
          </>
        )}
      </View>
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: theme.radii.lg,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: theme.spacing.xl,
    paddingVertical: theme.spacing.xs,
  },
  fullWidth: { alignSelf: 'stretch' },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing.sm,
    // The text must be able to measure against a bounded width for
    // adjustsFontSizeToFit; without this Android lets it overflow-crop.
    maxWidth: '100%',
  },
  label: {
    textAlign: 'center',
    flexShrink: 1,
    // Tamil ascenders/descenders clip on Android without explicit room.
    includeFontPadding: false,
  },
  secondary: {
    borderWidth: 1.5,
    borderColor: theme.colors.borderStrong,
    backgroundColor: 'rgba(212,163,44,0.14)',
  },
  ghost: { backgroundColor: 'transparent' },
  disabled: { opacity: 0.45 },
});
