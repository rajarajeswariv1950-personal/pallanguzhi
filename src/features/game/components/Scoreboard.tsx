import { StyleSheet, View } from 'react-native';
import { Card } from '@/components/ui/Card';
import { AppText } from '@/components/ui/Text';
import { useAppTranslation } from '@/hooks/useAppTranslation';
import { theme } from '@/theme';

export interface ScoreboardProps {
  leftName: string;
  leftScore: number;
  rightName: string;
  rightScore: number;
  /** Which side is to move (0 = left, 1 = right), highlighted with a gold glow. */
  activeSide: 0 | 1 | null;
}

/**
 * Premium in-game scoreboard shared by offline and online play. Shows both full
 * player names (never truncated to initials), large readable captured counts,
 * and a clear golden highlight on the player whose turn it is.
 */
export function Scoreboard({ leftName, leftScore, rightName, rightScore, activeSide }: ScoreboardProps) {
  const { t } = useAppTranslation();
  return (
    <Card style={styles.card}>
      <View style={styles.row}>
        <Side name={leftName} score={leftScore} active={activeSide === 0} side="left" />
        <View style={styles.center}>
          <AppText variant="overline" color={theme.colors.textMuted}>
            {t('common.vs')}
          </AppText>
        </View>
        <Side name={rightName} score={rightScore} active={activeSide === 1} side="right" />
      </View>
    </Card>
  );
}

function Side({
  name,
  score,
  active,
  side,
}: {
  name: string;
  score: number;
  active: boolean;
  side: 'left' | 'right';
}) {
  const { t } = useAppTranslation();
  const align = side === 'left' ? 'flex-start' : 'flex-end';
  return (
    <View style={[styles.side, { alignItems: align }, active && styles.sideActive]}>
      <View style={[styles.nameRow, side === 'right' && styles.nameRowEnd]}>
        {active ? <View style={styles.dot} /> : null}
        <AppText
          variant="bodyStrong"
          numberOfLines={2}
          align={side === 'right' ? 'right' : 'left'}
          color={active ? theme.colors.primaryLight : theme.colors.text}
          style={styles.name}
        >
          {name}
        </AppText>
      </View>
      <AppText variant="h1" color={theme.colors.primaryLight}>
        {score}
      </AppText>
      <AppText variant="small" muted>
        {t('gameplay.captured')}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { alignSelf: 'stretch' },
  row: {
    flexDirection: 'row',
    alignItems: 'stretch',
  },
  center: {
    paddingHorizontal: theme.spacing.sm,
    justifyContent: 'center',
  },
  side: {
    flex: 1,
    gap: 2,
    paddingVertical: theme.spacing.xs,
    paddingHorizontal: theme.spacing.sm,
    borderRadius: theme.radii.md,
  },
  sideActive: {
    backgroundColor: 'rgba(200,155,60,0.14)',
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
    minHeight: 38,
  },
  nameRowEnd: { justifyContent: 'flex-end' },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: theme.colors.primary,
  },
  name: { flexShrink: 1 },
});
