import { ReactNode } from 'react';
import { View, StyleSheet } from 'react-native';
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
              title={t('tutorial.sowingExampleTitle')}
              caption={t('tutorial.sowingExampleCaption')}
              beforeLabel={t('tutorial.before')}
              afterLabel={t('tutorial.after')}
              before={{ top: [0, 0, 0, 0, 0, 0, 0], bottom: [0, 5, 0, 0, 0, 0, 0], highlightBottom: [1] }}
              after={{ top: [0, 0, 0, 0, 0, 0, 0], bottom: [0, 0, 1, 1, 1, 1, 1], highlightBottom: [2, 3, 4, 5, 6] }}
            />
          </Card>
        </FadeSlideIn>

        <FadeSlideIn delay={step()}>
          <Card>
            <ExampleDiagram
              title={t('tutorial.captureExampleTitle')}
              caption={t('tutorial.captureExampleCaption')}
              beforeLabel={t('tutorial.before')}
              afterLabel={t('tutorial.after')}
              before={{ top: [2, 2, 2, 2, 2, 2, 2], bottom: [0, 0, 0, 0, 0, 1, 2], store: 0, highlightBottom: [5] }}
              after={{ top: [2, 2, 2, 2, 2, 2, 2], bottom: [0, 0, 0, 0, 0, 1, 0], store: 2, highlightBottom: [6] }}
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
      <AppText variant="h3" style={styles.sectionTitle}>
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
  divider: { marginVertical: theme.spacing.md },
  demoIntro: { marginTop: theme.spacing.xs },
  groupLabel: { marginTop: theme.spacing.sm, marginLeft: theme.spacing.xs },
  faq: { gap: theme.spacing.md },
});
