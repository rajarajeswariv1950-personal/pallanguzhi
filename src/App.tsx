import { useEffect } from 'react';
import { StyleSheet } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer } from '@react-navigation/native';
import { RootNavigator } from '@/navigation/RootNavigator';
import { navigationTheme } from '@/navigation/navigationTheme';
import { initI18n } from '@/i18n';
import { initAudio } from '@/services/feedback';
import { useLanguageStore } from '@/store/languageStore';
import { useSettingsStore } from '@/store/settingsStore';
import { useProfileStore } from '@/store/profileStore';

// Initialise i18n synchronously with a safe default so the very first render
// already has translations. Hydration then switches to the saved/device language.
initI18n('en');

export default function App() {
  const hydrateLanguage = useLanguageStore((s) => s.hydrate);
  const hydrateSettings = useSettingsStore((s) => s.hydrate);
  const hydrateProfile = useProfileStore((s) => s.hydrate);

  useEffect(() => {
    void hydrateLanguage();
    void hydrateProfile();
    // Configure audio after settings are loaded so the music toggle is respected.
    void hydrateSettings().then(() => initAudio());
  }, [hydrateLanguage, hydrateProfile, hydrateSettings]);

  return (
    <GestureHandlerRootView style={styles.flex}>
      <SafeAreaProvider>
        <NavigationContainer theme={navigationTheme}>
          <RootNavigator />
        </NavigationContainer>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
});
