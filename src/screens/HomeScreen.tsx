import { View, StyleSheet, BackHandler, Platform, Alert } from 'react-native';
import { BrandedScreen, BrandHero, Button, OptionCard, AppText, FadeSlideIn } from '@/components';
import { useAppTranslation } from '@/hooks/useAppTranslation';
import { useProfileStore } from '@/store/profileStore';
import type { RootStackScreenProps } from '@/navigation/types';
import { theme } from '@/theme';

export function HomeScreen({ navigation }: RootStackScreenProps<'Home'>) {
  const { t } = useAppTranslation();
  const name = useProfileStore((s) => s.name);

  // Explicit way OUT of the app. Android supports a true programmatic exit;
  // iOS forbids apps closing themselves (App Store rule), so there the
  // dialog explains the swipe-up gesture instead of silently doing nothing.
  const exitApp = () => {
    if (Platform.OS === 'android') {
      Alert.alert(t('home.exitTitle'), t('home.exitConfirm'), [
        { text: t('common.cancel'), style: 'cancel' },
        { text: t('home.exitApp'), style: 'destructive', onPress: () => BackHandler.exitApp() },
      ]);
    } else {
      Alert.alert(t('home.exitTitle'), t('home.exitIosHint'), [{ text: t('common.confirm') }]);
    }
  };

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
          <FadeSlideIn delay={200 + menu.length * 70}>
            <OptionCard
              icon="power"
              title={t('home.exitApp')}
              subtitle={Platform.OS === 'android' ? t('home.exitSubtitle') : t('home.exitIosSubtitle')}
              onPress={exitApp}
            />
          </FadeSlideIn>
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
