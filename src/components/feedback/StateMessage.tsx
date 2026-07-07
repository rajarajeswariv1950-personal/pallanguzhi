import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { EmblemBadge } from '@/components/branding/EmblemBadge';
import { AppText } from '@/components/ui/Text';
import { Icon, IconName } from '@/components/ui/Icon';
import { Button } from '@/components/ui/Button';
import { theme } from '@/theme';

export type StateVariant = 'loading' | 'info' | 'error';

export interface StateMessageProps {
  variant?: StateVariant;
  title: string;
  message?: string;
  icon?: IconName;
  actionLabel?: string;
  onAction?: () => void;
}

/**
 * Centred, branded state block for loading / empty / error situations. Keeps the
 * Phoenix emblem visible so branding is consistent even on non-gameplay states.
 */
export function StateMessage({
  variant = 'info',
  title,
  message,
  icon,
  actionLabel,
  onAction,
}: StateMessageProps) {
  const fallbackIcon: IconName = variant === 'error' ? 'cloud-offline' : 'information-circle';
  const accentColor = variant === 'error' ? theme.colors.danger : theme.colors.primaryLight;

  return (
    <View style={styles.wrap} accessible accessibilityRole="summary">
      <EmblemBadge size={48} />
      {variant === 'loading' ? (
        <ActivityIndicator color={theme.colors.primaryLight} size="large" style={styles.spinner} />
      ) : (
        <View style={styles.iconWrap}>
          <Icon name={icon ?? fallbackIcon} size={32} color={accentColor} />
        </View>
      )}
      <AppText variant="h3" align="center">
        {title}
      </AppText>
      {message ? (
        <AppText variant="body" muted align="center" style={styles.message}>
          {message}
        </AppText>
      ) : null}
      {actionLabel && onAction ? (
        <Button label={actionLabel} onPress={onAction} fullWidth={false} style={styles.action} />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing.md,
    padding: theme.spacing.xl,
  },
  spinner: { marginVertical: theme.spacing.sm },
  iconWrap: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(200,155,60,0.12)',
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  message: { maxWidth: 340 },
  action: { marginTop: theme.spacing.md },
});
