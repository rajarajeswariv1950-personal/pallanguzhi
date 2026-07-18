import { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import { Card } from './Card';
import { AppText } from './Text';
import { Icon, IconName } from './Icon';
import { tapFeedback } from '@/services/feedback';
import { theme } from '@/theme';

export interface OptionCardProps {
  title: string;
  subtitle?: string;
  icon?: IconName;
  onPress?: () => void;
  rightSlot?: ReactNode;
  disabled?: boolean;
}

/** A premium tappable menu row: icon medallion + title/subtitle + chevron. */
export function OptionCard({
  title,
  subtitle,
  icon,
  onPress,
  rightSlot,
  disabled,
}: OptionCardProps) {
  return (
    <Card
      onPress={
        disabled || !onPress
          ? undefined
          : () => {
              tapFeedback();
              onPress();
            }
      }
      accessibilityLabel={title}
      style={disabled ? styles.disabled : undefined}
    >
      <View style={styles.row}>
        {icon ? (
          <View style={styles.medallion}>
            <Icon name={icon} size={24} color={theme.colors.primaryLight} />
          </View>
        ) : null}
        <View style={styles.texts}>
          <AppText
            variant="title"
            numberOfLines={1}
            // Long Tamil titles (Settings rows etc.) shrink instead of
            // ellipsizing; no-op where the title already fits.
            adjustsFontSizeToFit
            minimumFontScale={0.7}
          >
            {title}
          </AppText>
          {subtitle ? (
            <AppText variant="caption" muted numberOfLines={2} style={styles.subtitle}>
              {subtitle}
            </AppText>
          ) : null}
        </View>
        {rightSlot ?? <Icon name="chevron-forward" size={20} color={theme.colors.textMuted} />}
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.lg,
  },
  medallion: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(200,155,60,0.14)',
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  texts: { flex: 1 },
  subtitle: { marginTop: 2 },
  disabled: { opacity: 0.5 },
});
