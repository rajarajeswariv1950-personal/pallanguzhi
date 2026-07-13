import { View, StyleSheet, Image } from 'react-native';
import { BrandedScreen, BrandHero, Card, AppText } from '@/components';
import { useAppTranslation } from '@/hooks/useAppTranslation';
import { APP_VERSION, brandAssets } from '@/constants/brand';
import type { RootStackScreenProps } from '@/navigation/types';
import { theme } from '@/theme';

export function AboutScreen(_props: RootStackScreenProps<'About'>) {
  const { t } = useAppTranslation();

  // Approved benefit lines — centralized in translations (single-language).
  const benefits = [
    t('about.benefit1'),
    t('about.benefit2'),
    t('about.benefit3'),
    t('about.benefit4'),
    t('about.benefit5'),
    t('about.benefit6'),
  ];

  return (
    <BrandedScreen title={t('about.title')}>
      <View style={styles.container}>
        {/* Hero: full board key art + app name + Phoenix emblem crest. */}
        <BrandHero compact emblem tagline={t('brand.tagline')} />

        {/* Company overview */}
        <Card>
          <AppText variant="body" muted>
            {t('about.intro')}
          </AppText>
        </Card>

        {/* Mission */}
        <Card>
          <AppText variant="body" muted>
            {t('about.mission')}
          </AppText>
        </Card>

        {/* Why play — approved benefit list */}
        <Card>
          <AppText variant="overline" color={theme.colors.textMuted}>
            {t('about.benefitsTitle')}
          </AppText>
          <View style={styles.benefits}>
            {benefits.map((line, i) => (
              <View key={i} style={styles.benefitRow}>
                <View style={styles.bullet} />
                <AppText variant="body" muted style={styles.benefitText}>
                  {line}
                </AppText>
              </View>
            ))}
          </View>
        </Card>

        {/* A Note on Tradition — the game's cultural heart (i18n en/ta). */}
        <Card>
          <AppText variant="title">{t('about.traditionTitle')}</AppText>
          <AppText variant="body" muted style={styles.paragraph}>
            {t('about.traditionBody1')}
          </AppText>
          <AppText variant="body" muted style={styles.paragraph}>
            {t('about.traditionBody2')}
          </AppText>
          <AppText variant="body" muted style={styles.paragraph}>
            {t('about.traditionBody3')}
          </AppText>
        </Card>

        {/* Studio credit — "Credits to" / "Phoenix Neumed" + a local placeholder
            image block for the user to replace later. */}
        <Card>
          <AppText variant="overline" color={theme.colors.textMuted}>
            {t('about.studioTitle')}
          </AppText>
          <AppText variant="h3" style={styles.spacer}>
            {t('about.studio')}
          </AppText>
          {/* Placeholder image — swap assets/brand/credit-placeholder.png later.
              Rendered smaller, centered, and contained so the full credit
              artwork is always visible with no cropping. */}
          <Image
            source={brandAssets.creditPlaceholder}
            style={styles.creditPlaceholder}
            resizeMode="contain"
            fadeDuration={0}
            accessibilityRole="image"
            accessibilityLabel={t('about.studio')}
          />
        </Card>

        <View style={styles.footer}>
          <AppText variant="caption" muted align="center">
            {t('common.versionValue', { value: APP_VERSION })}
          </AppText>
          <AppText variant="small" muted align="center">
            {t('about.rightsReserved')}
          </AppText>
        </View>
      </View>
    </BrandedScreen>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: theme.spacing.lg,
    paddingTop: theme.spacing.sm,
  },
  spacer: { marginTop: theme.spacing.xs },
  paragraph: { marginTop: theme.spacing.md },
  creditPlaceholder: {
    width: 220,
    height: 220,
    alignSelf: 'center',
    marginTop: theme.spacing.md,
    marginBottom: theme.spacing.xs,
    borderRadius: theme.radii.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
  },
  benefits: {
    gap: theme.spacing.md,
    marginTop: theme.spacing.md,
  },
  benefitRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: theme.spacing.sm,
  },
  bullet: {
    width: 7,
    height: 7,
    borderRadius: 4,
    marginTop: 8,
    backgroundColor: theme.colors.primary,
    ...theme.shadows.gold,
  },
  benefitText: { flex: 1 },
  footer: {
    alignItems: 'center',
    gap: theme.spacing.xs,
    marginTop: theme.spacing.sm,
  },
});
