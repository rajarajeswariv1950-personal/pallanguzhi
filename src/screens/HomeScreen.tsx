import { View, StyleSheet } from 'react-native';
import { BrandedScreen, BrandHero, Button, OptionCard, AppText, FadeSlideIn } from '@/components';
import { useAppTranslation } from '@/hooks/useAppTranslation';
import { useProfileStore } from '@/store/profileStore';
import type { RootStackScreenProps } from '@/navigation/types';
import { theme } from '@/theme';

export function HomeScreen({ navigation }: RootStackScreenProps<'Home'>) {
  const { t } = useAppTranslation();
  const name = useProfileStore((s) => s.name);

  const menu: { icon: 'book' | 'settings-sharp' | 'person' | 'information-circle'; label: string; route: 'HowToPlay' | 'Settings' | 'Profile' | 'About' }[] = [
    { icon: 'book', label: t('home.howToPlay'), route: 'HowToPlay' },
    { icon: 'settings-sharp', label: t('home.settings'), route: 'Settings' },
    { icon: 'person', label: t('home.profile'), route: 'Profile' },
    { icon: 'information-circle', label: t('home.about'), route: 'About' },
  ];

  return (
    <BrandedScreen showBack={false}>
      <View style={styles.container}>
        <FadeSlideIn delay={0}>
          <BrandHero emphasis emblem tagline={t('home.subtitle')} />
        </FadeSlideIn>

        {name ? (
          <FadeSlideIn delay={90}>
            <AppText variant="title" align="center" color={theme.colors.primaryLight}>
              {t('home.welcomeName', { name })}
            </AppText>
          </FadeSlideIn>
        ) : null}

        <FadeSlideIn delay={140}>
          <Button label={t('home.play')} icon="play" onPress={() => navigation.navigate('ModeSelect')} />
        </FadeSlideIn>

        <View style={styles.menu}>
          {menu.map((item, i) => (
            <FadeSlideIn key={item.route} delay={200 + i * 70}>
              <OptionCard icon={item.icon} title={item.label} onPress={() => navigation.navigate(item.route)} />
            </FadeSlideIn>
          ))}
        </View>
      </View>
    </BrandedScreen>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: theme.spacing.xl,
    paddingTop: theme.spacing.md,
  },
  menu: {
    gap: theme.spacing.md,
  },
});
