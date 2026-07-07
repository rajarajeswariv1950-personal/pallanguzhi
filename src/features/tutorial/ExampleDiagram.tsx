import { View, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { AppText } from '@/components/ui/Text';
import { Icon } from '@/components/ui/Icon';
import { PITS_PER_ROW } from '@/features/game/types';
import { theme } from '@/theme';

export interface MiniBoardState {
  top: number[];
  bottom: number[];
  store?: number;
  highlightBottom?: number[];
}

export interface ExampleDiagramProps {
  title: string;
  caption: string;
  beforeLabel: string;
  afterLabel: string;
  before: MiniBoardState;
  after: MiniBoardState;
}

export function ExampleDiagram({
  title,
  caption,
  beforeLabel,
  afterLabel,
  before,
  after,
}: ExampleDiagramProps) {
  return (
    <View style={styles.wrap}>
      <AppText variant="h3">{title}</AppText>

      <View style={styles.stage}>
        <LabeledBoard label={beforeLabel} state={before} />
        <View style={styles.arrow}>
          <Icon name="arrow-down" size={22} color={theme.colors.primaryLight} />
        </View>
        <LabeledBoard label={afterLabel} state={after} />
      </View>

      <AppText variant="caption" muted>
        {caption}
      </AppText>
    </View>
  );
}

function LabeledBoard({ label, state }: { label: string; state: MiniBoardState }) {
  return (
    <View style={styles.labeled}>
      <AppText variant="small" muted style={styles.label}>
        {label}
      </AppText>
      <MiniBoard state={state} />
    </View>
  );
}

function MiniBoard({ state }: { state: MiniBoardState }) {
  return (
    <View style={styles.board}>
      <LinearGradient
        colors={theme.gradients.woodWarm}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      <View style={styles.grid}>
        <MiniRow values={state.top} />
        <MiniRow values={state.bottom} highlight={state.highlightBottom} />
      </View>
      {state.store !== undefined ? (
        <View style={styles.store}>
          <AppText variant="caption" color={theme.palette.goldLight}>
            {state.store}
          </AppText>
        </View>
      ) : null}
    </View>
  );
}

function MiniRow({ values, highlight }: { values: number[]; highlight?: number[] }) {
  const pits = Array.from({ length: PITS_PER_ROW }, (_, i) => values[i] ?? 0);
  return (
    <View style={styles.row}>
      {pits.map((count, i) => (
        <View key={i} style={[styles.pit, highlight?.includes(i) && styles.pitHighlight]}>
          <AppText variant="small" color={theme.colors.textInverse}>
            {count}
          </AppText>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: theme.spacing.md },
  stage: { gap: theme.spacing.sm },
  arrow: { alignItems: 'center' },
  labeled: { gap: theme.spacing.xs },
  label: { marginLeft: theme.spacing.xs },
  board: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
    padding: theme.spacing.sm,
    borderRadius: theme.radii.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    overflow: 'hidden',
  },
  grid: { flex: 1, gap: theme.spacing.xs },
  row: { flexDirection: 'row', gap: 4 },
  pit: {
    flex: 1,
    aspectRatio: 1,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(4,16,15,0.55)',
    borderWidth: 1,
    borderColor: 'rgba(200,155,60,0.22)',
  },
  pitHighlight: {
    borderColor: theme.colors.primary,
    backgroundColor: 'rgba(200,155,60,0.20)',
  },
  store: {
    width: 30,
    height: 64,
    borderRadius: theme.radii.pill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(4,16,15,0.55)',
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
});
