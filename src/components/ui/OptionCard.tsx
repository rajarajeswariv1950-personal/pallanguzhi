import { ReactNode } from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import { Card } from './Card';
import { AppText } from './Text';
import { Icon, IconName } from './Icon';
import { tapFeedback } from '@/services/feedback';
import { theme } from '@/theme';

// Android: no line caps — long Tamil titles/subtitles show in full, wrapping
// at word boundaries (never ellipsized mid-sentence like "…சாதனத்…").
// iOS keeps the original 2-line cap (renders fine there).
const MAX_LINES = Platform.OS === 'android' ? undefined : 2;

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
            // Long Tamil titles wrap to further full-size lines — readable
            // and premium; never shrunk-tiny, never broken mid-word.
            numberOfLines={MAX_LINES}
          >
            {title}
          </AppText>
          {subtitle ? (
            <AppText variant="caption" muted numberOfLines={MAX_LINES} style={styles.subtitle}>
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
