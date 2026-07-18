import { ReactNode } from 'react';
import { Platform, View, StyleSheet } from 'react-native';
import {
  BrandedScreen,
  Card,
  AppText,
  Divider,
  Badge,
  Icon,
  FadeSlideIn,
} from '@/components';
import type { IconName } from '@/components';
import { TutorialDemo } from '@/features/tutorial/TutorialDemo';
import { ExampleDiagram } from '@/features/tutorial/ExampleDiagram';
import { FaqItem } from '@/features/tutorial/FaqItem';
import { useAppTranslation } from '@/hooks/useAppTranslation';
import type { RootStackScreenProps } from '@/navigation/types';
import { theme } from '@/theme';

/**
 * Handwritten script for the rule headings — a warm, storybook feel. Each
 * platform supplies its own built-in script face (no font download, so it
 * works offline on web, iOS and Android alike). Tamil headings automatically
 * fall back to the system Tamil font because script faces carry no Tamil
 * glyphs — the fallback is intentional and keeps Tamil perfectly readable.
 */
const SCRIPT_FONT = Platform.select({
  ios: 'Snell Roundhand',
  android: 'cursive',
  default: '"Snell Roundhand", "Brush Script MT", "Segoe Script", "Comic Sans MS", cursive',
});

export function HowToPlayScreen(_props: RootStackScreenProps<'HowToPlay'>) {
  const { t } = useAppTranslation();

  const sections: { icon: IconName; title: string; body: string }[] = [
    { icon: 'albums', title: t('howToPlay.setupTitle'), body: t('howToPlay.setup') },
    { icon: 'flag', title: t('howToPlay.objectiveTitle'), body: t('howToPlay.objective') },
    { icon: 'hand-left', title: t('howToPlay.movesTitle'), body: t('howToPlay.moves') },
    { icon: 'arrow-redo', title: t('howToPlay.sowingTitle'), body: t('howToPlay.sowing') },
    { icon: 'sync', title: t('howToPlay.lapsTitle'), body: t('howToPlay.laps') },
    { icon: 'download', title: t('howToPlay.capturesTitle'), body: t('howToPlay.captures') },
    { icon: 'diamond', title: t('howToPlay.fourTitle'), body: t('howToPlay.four') },
    { icon: 'swap-horizontal', title: t('howToPlay.turnsTitle'), body: t('howToPlay.turns') },
    { icon: 'repeat', title: t('howToPlay.roundsTitle'), body: t('howToPlay.rounds') },
    { icon: 'stats-chart', title: t('howToPlay.scoringTitle'), body: t('howToPlay.scoring') },
    { icon: 'trophy', title: t('howToPlay.winnerTitle'), body: t('howToPlay.winner') },
    { icon: 'alert-circle', title: t('howToPlay.edgeTitle'), body: t('howToPlay.edge') },
  ];

  let order = 0;
  const step = () => order++ * 60;

  return (
    <BrandedScreen title={t('howToPlay.title')}>
      <View style={styles.container}>
        {/* Overview */}
        <FadeSlideIn delay={step()}>
          <Card>
            <SectionHeader icon="grid" title={t('howToPlay.overviewTitle')} />
            <Divider style={styles.divider} />
            <AppText variant="body" muted>
              {t('howToPlay.overview')}
            </AppText>
          </Card>
        </FadeSlideIn>

        {/* Which exact ruleset this app implements (honest variant note) */}
        <FadeSlideIn delay={step()}>
          <Card>
            <SectionHeader icon="information-circle" title={t('howToPlay.variantTitle')} />
            <Divider style={styles.divider} />
            <AppText variant="body" muted>
              {t('howToPlay.variant')}
            </AppText>
          </Card>
        </FadeSlideIn>

        {/* Animated mini-demo */}
        <FadeSlideIn delay={step()}>
          <Card>
            <SectionHeader icon="play-circle" title={t('tutorial.demoTitle')} />
            <AppText variant="caption" muted style={styles.demoIntro}>
              {t('tutorial.demoIntro')}
            </AppText>
            <Divider style={styles.divider} />
            <TutorialDemo />
          </Card>
        </FadeSlideIn>

        {/* Core rule sections */}
        {sections.map((section) => (
          <FadeSlideIn key={section.title} delay={step()}>
            <Card>
              <SectionHeader icon={section.icon} title={section.title} />
              <Divider style={styles.divider} />
              <AppText variant="body" muted>
                {section.body}
              </AppText>
            </Card>
          </FadeSlideIn>
        ))}

        {/* Illustrated examples */}
        <FadeSlideIn delay={step()}>
          <AppText variant="overline" color={theme.colors.textMuted} style={styles.groupLabel}>
            {t('tutorial.examplesTitle')}
          </AppText>
        </FadeSlideIn>

        <FadeSlideIn delay={step()}>
          <Card>
            <ExampleDiagram
              titleStyle={styles.scriptTitle}
              title={t('tutorial.sowingExampleTitle')}
              caption={t('tutorial.sowingExampleCaption')}
              beforeLabel={t('tutorial.before')}
              afterLabel={t('tutorial.after')}
              before={{ top: [0, 0, 0, 0, 0, 0, 0], bottom: [0, 5, 0, 0, 0, 0, 0], highlightBottom: [1] }}
              after={{ top: [0, 0, 0, 0, 0, 0, 0], bottom: [0, 0, 1, 1, 1, 1, 1], highlightBottom: [2, 3, 4, 5, 6] }}
            />
          </Card>
        </FadeSlideIn>

        {/* Capture, retold clearly: the last shell lands (gold ring), the next
            pit is empty (dashed ring), so the shells one pit beyond (maroon)
            are collected into the store. The legend decodes each marker. */}
        <FadeSlideIn delay={step()}>
          <Card>
            <ExampleDiagram
              titleStyle={styles.scriptTitle}
              title={t('tutorial.captureExampleTitle')}
              caption={t('tutorial.captureExampleCaption')}
              beforeLabel={t('tutorial.before')}
              afterLabel={t('tutorial.after')}
              before={{
                top: [2, 2, 2, 2, 2, 2, 2],
                bottom: [2, 2, 2, 1, 0, 3, 2],
                store: 0,
                highlightBottom: [3],
                emptyBottom: [4],
                captureBottom: [5],
              }}
              after={{
                top: [2, 2, 2, 2, 2, 2, 2],
                bottom: [2, 2, 2, 1, 0, 0, 2],
                store: 3,
                highlightBottom: [3],
                emptyBottom: [4],
              }}
              legend={[
                { kind: 'last', label: t('tutorial.legendLastDrop') },
                { kind: 'empty', label: t('tutorial.legendEmpty') },
                { kind: 'capture', label: t('tutorial.legendCaptured') },
              ]}
            />
          </Card>
        </FadeSlideIn>

        {/* The Pasu (cow): a sown shell makes a pit exactly four, and all
            four are claimed into the store at once. */}
        <FadeSlideIn delay={step()}>
          <Card>
            <ExampleDiagram
              titleStyle={styles.scriptTitle}
              title={t('tutorial.pasuExampleTitle')}
              caption={t('tutorial.pasuExampleCaption')}
              beforeLabel={t('tutorial.before')}
              afterLabel={t('tutorial.after')}
              before={{
                top: [2, 2, 2, 2, 2, 2, 2],
                bottom: [2, 0, 3, 2, 2, 2, 2],
                store: 0,
                highlightBottom: [2],
              }}
              after={{
                top: [2, 2, 2, 2, 2, 2, 2],
                bottom: [2, 0, 0, 2, 2, 2, 2],
                store: 4,
                captureBottom: [2],
              }}
              legend={[
                { kind: 'last', label: t('tutorial.legendLastDrop') },
                { kind: 'capture', label: t('tutorial.legendCaptured') },
              ]}
            />
          </Card>
        </FadeSlideIn>

        {/* Beginner tips */}
        <FadeSlideIn delay={step()}>
          <Card>
            <SectionHeader icon="bulb" title={t('howToPlay.tipsTitle')} />
            <Divider style={styles.divider} />
            <AppText variant="body" muted>
              {t('howToPlay.tips')}
            </AppText>
          </Card>
        </FadeSlideIn>

        {/* FAQ */}
        <FadeSlideIn delay={step()}>
          <AppText variant="overline" color={theme.colors.textMuted} style={styles.groupLabel}>
            {t('tutorial.faqTitle')}
          </AppText>
        </FadeSlideIn>
        <View style={styles.faq}>
          <FaqItem question={t('tutorial.faqQ1')} answer={t('tutorial.faqA1')} />
          <FaqItem question={t('tutorial.faqQ2')} answer={t('tutorial.faqA2')} />
          <FaqItem question={t('tutorial.faqQ3')} answer={t('tutorial.faqA3')} />
          <FaqItem question={t('tutorial.faqQ4')} answer={t('tutorial.faqA4')} />
          <FaqItem question={t('tutorial.faqQ5')} answer={t('tutorial.faqA5')} />
          <FaqItem question={t('tutorial.faqQ6')} answer={t('tutorial.faqA6')} />
          <FaqItem question={t('tutorial.faqQ7')} answer={t('tutorial.faqA7')} />
          <FaqItem question={t('tutorial.faqQ8')} answer={t('tutorial.faqA8')} />
          <FaqItem question={t('tutorial.faqQ9')} answer={t('tutorial.faqA9')} />
          <FaqItem question={t('tutorial.faqQ10')} answer={t('tutorial.faqA10')} />
        </View>
      </View>
    </BrandedScreen>
  );
}

function SectionHeader({ icon, title }: { icon: IconName; title: string }): ReactNode {
  return (
    <View style={styles.sectionHeader}>
      <View style={styles.iconWrap}>
        <Icon name={icon} size={20} color={theme.colors.primaryLight} />
      </View>
      <AppText variant="h3" style={[styles.sectionTitle, styles.scriptTitle]}>
        {title}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: theme.spacing.lg,
    paddingTop: theme.spacing.sm,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(200,155,60,0.14)',
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  sectionTitle: { flex: 1 },
  // Storybook script for headings; slightly larger so the flourish reads
  // clearly. Body copy stays in the clean system face for easy reading by
  // children and elders alike.
  scriptTitle: {
    fontFamily: SCRIPT_FONT,
    fontSize: 26,
    lineHeight: 34,
    fontWeight: '600',
    color: theme.colors.primaryDeep,
  },
  divider: { marginVertical: theme.spacing.md },
  demoIntro: { marginTop: theme.spacing.xs },
  groupLabel: { marginTop: theme.spacing.sm, marginLeft: theme.spacing.xs },
  faq: { gap: theme.spacing.md },
});
