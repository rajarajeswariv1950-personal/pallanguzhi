import { StyleSheet, View } from 'react-native';
import { AppText } from '@/components/ui/Text';
import { Icon, IconName } from '@/components/ui/Icon';
import { PressableScale } from '@/components/anim/PressableScale';
import { useAppTranslation } from '@/hooks/useAppTranslation';
import { theme } from '@/theme';

/** Speed multipliers shared by every step-through demo (lower = faster). */
export const DEMO_SPEEDS = [
  { label: '0.5×', mult: 2 },
  { label: '0.75×', mult: 1.4 },
  { label: '1×', mult: 1 },
  { label: '1.5×', mult: 0.66 },
  { label: '2×', mult: 0.5 },
];
/** Index of 0.75× — a gentle, beginner-friendly default pace. */
export const DEMO_DEFAULT_SPEED = 1;

export function CtrlButton({
  icon,
  label,
  onPress,
  disabled,
  primary,
  compact,
}: {
  icon: IconName;
  label: string;
  onPress: () => void;
  disabled?: boolean;
  primary?: boolean;
  compact?: boolean;
}) {
  return (
    <PressableScale
      onPress={disabled ? undefined : onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: !!disabled }}
      style={[
        styles.ctrl,
        compact && styles.ctrlCompact,
        primary && styles.ctrlPrimary,
        disabled && styles.ctrlDisabled,
      ]}
    >
      <Icon
        name={icon}
        size={primary ? 26 : 20}
        color={primary ? theme.colors.textOnGold : theme.colors.primaryLight}
      />
      <AppText
        variant="small"
        color={primary ? theme.colors.textOnGold : theme.colors.textMuted}
        numberOfLines={1}
      >
        {label}
      </AppText>
    </PressableScale>
  );
}

/**
 * The full transport strip used by every "watch it happen" demo: restart /
 * back / play-pause / next, plus the slower–faster speed row with the step
 * readout. One shared component so all demos feel identical.
 */
export function DemoTransport({
  playing,
  atStart,
  atEnd,
  speed,
  stepCurrent,
  stepTotal,
  onPlayPause,
  onRestart,
  onRewind,
  onForward,
  onSlower,
  onFaster,
}: {
  playing: boolean;
  atStart: boolean;
  atEnd: boolean;
  speed: number;
  stepCurrent: number;
  stepTotal: number;
  onPlayPause: () => void;
  onRestart: () => void;
  onRewind: () => void;
  onForward: () => void;
  onSlower: () => void;
  onFaster: () => void;
}) {
  const { t } = useAppTranslation();
  return (
    <>
      <View style={styles.transport}>
        <CtrlButton icon="reload" label={t('tutorial.restart')} onPress={onRestart} disabled={atStart && !playing} />
        <CtrlButton icon="play-skip-back" label={t('tutorial.rewind')} onPress={onRewind} disabled={atStart} />
        <CtrlButton
          icon={playing ? 'pause' : 'play'}
          label={playing ? t('tutorial.pause') : t('tutorial.play')}
          onPress={onPlayPause}
          primary
        />
        <CtrlButton icon="play-skip-forward" label={t('tutorial.forward')} onPress={onForward} disabled={atEnd} />
      </View>

      <View style={styles.speedRow}>
        <CtrlButton icon="remove" label={t('tutorial.slower')} onPress={onSlower} disabled={speed <= 0} compact />
        <View style={styles.speedReadout}>
          <AppText variant="small" color={theme.colors.primaryLight}>
            {t('tutorial.speed', { value: DEMO_SPEEDS[speed].label })}
          </AppText>
          <AppText variant="small" muted>
            {t('tutorial.stepLabel', { current: stepCurrent, total: stepTotal })}
          </AppText>
        </View>
        <CtrlButton icon="add" label={t('tutorial.faster')} onPress={onFaster} disabled={speed >= DEMO_SPEEDS.length - 1} compact />
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  transport: {
    flexDirection: 'row',
    alignItems: 'stretch',
    justifyContent: 'space-between',
    gap: theme.spacing.sm,
  },
  ctrl: {
    flex: 1,
    minHeight: 58,
    borderRadius: theme.radii.md,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
    paddingVertical: theme.spacing.xs,
    paddingHorizontal: theme.spacing.xs,
    backgroundColor: 'rgba(200,155,60,0.10)',
    borderWidth: 1.5,
    borderColor: theme.colors.border,
  },
  ctrlCompact: { flex: 0, minWidth: 64 },
  ctrlPrimary: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primaryLight,
    ...(theme.shadows.gold as object),
  },
  ctrlDisabled: { opacity: 0.4 },
  speedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: theme.spacing.sm,
  },
  speedReadout: {
    flex: 1,
    alignItems: 'center',
    gap: 1,
  },
});
