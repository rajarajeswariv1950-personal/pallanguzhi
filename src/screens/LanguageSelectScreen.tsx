import { View, StyleSheet } from 'react-native';
import { BrandedScreen, BrandHero, Button, AppText, BackButton } from '@/components';
import { useLanguageStore } from '@/store/languageStore';
import { useAppTranslation } from '@/hooks/useAppTranslation';
import type { AppLanguage } from '@/i18n';
import type { RootStackScreenProps } from '@/navigation/types';
import { theme } from '@/theme';

export function LanguageSelectScreen({
  navigation,
  route,
}: RootStackScreenProps<'LanguageSelect'>) {
  const { t, i18n } = useAppTranslation();
  const setLanguage = useLanguageStore((s) => s.setLanguage);
  const current = useLanguageStore((s) => s.resolvedLanguage);
  const fromSettings = route.params?.fromSettings ?? false;

  // This first screen is the ONLY bilingual screen — app name, prompt, options and
  // footer are all shown in both English and Tamil so either speaker can choose.
  // Every screen after selection is single-language. Read each language directly.
  const tEn = i18n.getFixedT('en');
  const tTa = i18n.getFixedT('ta');

  const choose = async (lng: AppLanguage) => {
    await setLanguage(lng);
    if (fromSettings) {
      navigation.goBack();
    } else {
      navigation.reset({ index: 0, routes: [{ name: 'Home' }] });
    }
  };

  return (
    // header={false}: hide the single-language brand header so this screen's app
    // name comes only from the bilingual hero. bilingualFooter: bilingual credit.
    <BrandedScreen header={false} showBack={false} bilingualFooter>
      <View style={styles.container}>
        {fromSettings ? (
          <View style={styles.backRow}>
            <BackButton />
          </View>
        ) : null}

        {/* Full board key art (main visual) + Phoenix emblem as a secondary
            badge above it + bilingual app name. */}
        <BrandHero compact bilingual emblem />

        {/* Bilingual tagline/subtitle — English then Tamil (this screen only). */}
        <View style={styles.tagline}>
          <AppText variant="body" align="center" muted>
            {tEn('brand.tagline')}
          </AppText>
          <AppText variant="body" align="center" muted>
            {tTa('brand.tagline')}
          </AppText>
        </View>

        <View style={styles.heading}>
          {/* Choose-language instruction — English then Tamil. */}
          <AppText variant="h2" align="center">
            {tEn('language.title')}
          </AppText>
          <AppText
            variant="h3"
            align="center"
            color={theme.colors.primaryLight}
            style={styles.subtitle}
          >
            {tTa('language.title')}
          </AppText>
        </View>

        <View style={styles.options}>
          <Button
            label={t('language.english')}
            icon="language"
            variant={current === 'en' ? 'primary' : 'secondary'}
            onPress={() => choose('en')}
          />
          <Button
            label={t('language.tamil')}
            icon="language"
            variant={current === 'ta' ? 'primary' : 'secondary'}
            onPress={() => choose('ta')}
          />
        </View>
      </View>
    </BrandedScreen>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    gap: theme.spacing.xl,
    paddingTop: theme.spacing.md,
  },
  backRow: {
    width: '100%',
    alignItems: 'flex-start',
  },
  tagline: { alignItems: 'center', gap: theme.spacing.xs },
  heading: { alignItems: 'center' },
  subtitle: { marginTop: theme.spacing.xs },
  options: {
    width: '100%',
    gap: theme.spacing.md,
  },
});
