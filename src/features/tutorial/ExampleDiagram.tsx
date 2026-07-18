import { View, StyleSheet, type StyleProp, type TextStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { AppText } from '@/components/ui/Text';
import { Icon } from '@/components/ui/Icon';
import { PitFace } from '@/features/game/components/PitVisual';
import { PITS_PER_ROW } from '@/features/game/types';
import { theme } from '@/theme';

/**
 * One illustrated board state. Pits are drawn with the SAME carved hollows
 * and cowrie shells as the real game board (PitFace), on the same rosewood
 * gradient with the gold inlay, so what learners see in the rules is exactly
 * what they will touch in a match. Role markers make each story readable:
 *  - `highlightBottom`: the pit the story focuses on (golden pulsing ring),
 *  - `emptyBottom`: an empty pit that matters (dashed outline),
 *  - `captureBottom`: shells being claimed (maroon capture tint).
 */
export interface MiniBoardState {
  top: number[];
  bottom: number[];
  store?: number;
  highlightBottom?: number[];
  emptyBottom?: number[];
  captureBottom?: number[];
}

export interface LegendEntry {
  kind: 'last' | 'empty' | 'capture';
  label: string;
}

export interface ExampleDiagramProps {
  title: string;
  caption: string;
  beforeLabel: string;
  afterLabel: string;
  before: MiniBoardState;
  after: MiniBoardState;
  /** Optional middle stage — e.g. the exact moment a pit reaches four (Pasu). */
  midLabel?: string;
  mid?: MiniBoardState;
  legend?: LegendEntry[];
  /** Optional heading override (the How to Play screen passes its handwritten script style). */
  titleStyle?: StyleProp<TextStyle>;
}

export function ExampleDiagram({
  title,
  caption,
  beforeLabel,
  afterLabel,
  before,
  after,
  midLabel,
  mid,
  legend,
  titleStyle,
}: ExampleDiagramProps) {
  return (
    <View style={styles.wrap}>
      <AppText variant="h3" style={titleStyle}>
        {title}
      </AppText>

      <View style={styles.stage}>
        <LabeledBoard label={beforeLabel} state={before} />
        <View style={styles.arrow}>
          <Icon name="arrow-down" size={22} color={theme.colors.primaryLight} />
        </View>
        {mid ? (
          <>
            <LabeledBoard label={midLabel ?? ''} state={mid} />
            <View style={styles.arrow}>
              <Icon name="arrow-down" size={22} color={theme.colors.primaryLight} />
            </View>
          </>
        ) : null}
        <LabeledBoard label={afterLabel} state={after} />
      </View>

      {legend && legend.length > 0 ? (
        <View style={styles.legend}>
          {legend.map((entry, i) => (
            <View key={`${entry.kind}-${i}`} style={styles.legendRow}>
              <View
                style={[
                  styles.legendSwatch,
                  entry.kind === 'last' && styles.legendLast,
                  entry.kind === 'empty' && styles.legendEmpty,
                  entry.kind === 'capture' && styles.legendCapture,
                ]}
              />
              <AppText variant="small" muted style={styles.legendLabel}>
                {entry.label}
              </AppText>
            </View>
          ))}
        </View>
      ) : null}

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
      {/* Same rosewood + sheen + gold inlay as the real game board. */}
      <LinearGradient
        colors={theme.gradients.board}
        start={{ x: 0.1, y: 0 }}
        end={{ x: 0.9, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      <LinearGradient
        colors={theme.gradients.boardSheen}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 0.5 }}
        style={StyleSheet.absoluteFill}
        pointerEvents="none"
      />
      <View pointerEvents="none" style={styles.innerFrame} />
      <View style={styles.grid}>
        <MiniRow values={state.top} />
        <View style={styles.seamWrap} pointerEvents="none">
          <View style={styles.seamDark} />
          <View style={styles.seamLight} />
        </View>
        <MiniRow
          values={state.bottom}
          highlight={state.highlightBottom}
          empty={state.emptyBottom}
          capture={state.captureBottom}
        />
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

function MiniRow({
  values,
  highlight,
  empty,
  capture,
}: {
  values: number[];
  highlight?: number[];
  empty?: number[];
  capture?: number[];
}) {
  const pits = Array.from({ length: PITS_PER_ROW }, (_, i) => values[i] ?? 0);
  return (
    <View style={styles.row}>
      {pits.map((count, i) => (
        <View key={i} style={styles.pitCell}>
          <View style={styles.pitOuter}>
            <PitFace
              count={count}
              highlight={highlight?.includes(i)}
              capture={capture?.includes(i)}
              animateSeeds={false}
            />
          </View>
          {empty?.includes(i) ? <View pointerEvents="none" style={styles.emptyRing} /> : null}
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
    borderWidth: 1.5,
    borderColor: 'rgba(212,163,44,0.55)',
    overflow: 'hidden',
  },
  innerFrame: {
    position: 'absolute',
    top: 4,
    left: 4,
    right: 4,
    bottom: 4,
    borderRadius: theme.radii.md,
    borderWidth: 1,
    borderColor: 'rgba(228,193,115,0.3)',
  },
  grid: { flex: 1, gap: theme.spacing.xs },
  seamWrap: { marginHorizontal: 2 },
  seamDark: { height: 1, borderRadius: 999, backgroundColor: 'rgba(10,4,1,0.5)' },
  seamLight: { height: 1, borderRadius: 999, backgroundColor: 'rgba(228,193,115,0.2)' },
  row: { flexDirection: 'row', gap: 4 },
  pitCell: { flex: 1 },
  pitOuter: {
    aspectRatio: 1,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyRing: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 999,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: 'rgba(246,228,160,0.75)',
  },
  store: {
    width: 30,
    alignSelf: 'stretch',
    minHeight: 64,
    borderRadius: theme.radii.pill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1B110A',
    borderWidth: 1,
    borderColor: 'rgba(212,163,44,0.4)',
  },
  legend: { gap: theme.spacing.xxs },
  legendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  legendSwatch: {
    width: 14,
    height: 14,
    borderRadius: 7,
  },
  legendLast: {
    borderWidth: 2,
    borderColor: theme.colors.primary,
    backgroundColor: 'rgba(212,163,44,0.2)',
  },
  legendEmpty: {
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: 'rgba(156,107,18,0.8)',
    backgroundColor: 'transparent',
  },
  legendCapture: {
    borderWidth: 1.5,
    borderColor: theme.colors.danger,
    backgroundColor: 'rgba(139,42,34,0.3)',
  },
  legendLabel: { flex: 1 },
});
