import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
} from 'react-native-reanimated';
import { BrandHero, AppText, AppFooter } from '@/components';
import { BackgroundDecor } from '@/components/layout/BackgroundDecor';
import { useLanguageStore } from '@/store/languageStore';
import { useAppTranslation } from '@/hooks/useAppTranslation';
import type { RootStackScreenProps } from '@/navigation/types';
import { theme } from '@/theme';

const MIN_SPLASH_MS = 1500;

export function SplashScreen({ navigation }: RootStackScreenProps<'Splash'>) {
  const { t } = useAppTranslation();
  const hydrated = useLanguageStore((s) => s.hydrated);

  const heroOpacity = useSharedValue(0);
  const heroScale = useSharedValue(0.9);
  const footerOpacity = useSharedValue(0);

  useEffect(() => {
    heroOpacity.value = withTiming(1, { duration: 700, easing: Easing.out(Easing.cubic) });
    heroScale.value = withTiming(1, { duration: 850, easing: Easing.out(Easing.cubic) });
    footerOpacity.value = withDelay(700, withTiming(1, { duration: 500 }));
  }, [footerOpacity, heroOpacity, heroScale]);

  useEffect(() => {
    if (!hydrated) return;
    const timer = setTimeout(() => {
      // Always route to the language picker — the choice is made on every launch
      // and is never auto-skipped from a stored value.
      navigation.reset({
        index: 0,
        routes: [{ name: 'LanguageSelect' }],
      });
    }, MIN_SPLASH_MS);
    return () => clearTimeout(timer);
  }, [hydrated, navigation]);

  const heroStyle = useAnimatedStyle(() => ({
    opacity: heroOpacity.value,
    transform: [{ scale: heroScale.value }],
  }));
  const footerStyle = useAnimatedStyle(() => ({ opacity: footerOpacity.value }));

  return (
    <View style={styles.root}>
      <StatusBar style="dark" />
      <LinearGradient colors={theme.gradients.splash} style={StyleSheet.absoluteFill} />
      <BackgroundDecor />
      <LinearGradient
        colors={['rgba(200,155,60,0.12)', 'transparent']}
        style={styles.topGlow}
        pointerEvents="none"
      />
      <View style={styles.center}>
        <Animated.View style={heroStyle}>
          <BrandHero tagline={t('splash.tagline')} />
        </Animated.View>
      </View>
      <Animated.View style={[styles.footer, footerStyle]}>
        <AppText variant="caption" muted style={styles.loading}>
          {t('splash.loading')}
        </AppText>
        <AppFooter />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: theme.colors.bgDeep },
  topGlow: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '45%',
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: theme.layout.screenPaddingH,
  },
  footer: {
    alignItems: 'center',
    paddingHorizontal: theme.layout.screenPaddingH,
    paddingBottom: theme.spacing.xxl,
  },
  loading: {
    marginBottom: theme.spacing.md,
  },
});
