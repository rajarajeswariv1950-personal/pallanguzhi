import { View, StyleSheet, Switch } from 'react-native';
import { BrandedScreen, Card, OptionCard, AppText, Icon, Divider } from '@/components';
import type { IconName } from '@/components';
import { PressableScale } from '@/components/anim/PressableScale';
import { useAppTranslation } from '@/hooks/useAppTranslation';
import { useSettingsStore, VOLUME_STEP } from '@/store/settingsStore';
import { tapFeedback } from '@/services/feedback';
import { APP_VERSION } from '@/constants/brand';
import type { RootStackScreenProps } from '@/navigation/types';
import { theme } from '@/theme';

export function SettingsScreen({ navigation }: RootStackScreenProps<'Settings'>) {
  const { t } = useAppTranslation();
  const music = useSettingsStore((s) => s.music);
  const sound = useSettingsStore((s) => s.sound);
  const haptics = useSettingsStore((s) => s.haptics);
  const toggle = useSettingsStore((s) => s.toggle);

  const onToggle = (key: 'music' | 'sound' | 'haptics') => {
    tapFeedback();
    toggle(key);
  };

  return (
    <BrandedScreen title={t('settings.title')}>
      <View style={styles.container}>
        <SectionLabel>{t('settings.audio')}</SectionLabel>
        <Card>
          <SettingRow icon="musical-notes" label={t('settings.music')} value={music} onValueChange={() => onToggle('music')} />
          <Divider style={styles.rowDivider} />
          <MusicVolumeRow />
          <Divider style={styles.rowDivider} />
          <SettingRow icon="volume-high" label={t('settings.sound')} value={sound} onValueChange={() => onToggle('sound')} />
          <Divider style={styles.rowDivider} />
          <SettingRow icon="phone-portrait" label={t('settings.haptics')} value={haptics} onValueChange={() => onToggle('haptics')} />
        </Card>

        <SectionLabel>{t('settings.language')}</SectionLabel>
        <OptionCard
          icon="language"
          title={t('settings.changeLanguage')}
          onPress={() => navigation.navigate('LanguageSelect', { fromSettings: true })}
        />

        <SectionLabel>{t('settings.gameplaySection')}</SectionLabel>
        <OptionCard icon="book" title={t('settings.replayTutorial')} onPress={() => navigation.navigate('HowToPlay')} />
        <OptionCard icon="document-text" title={t('settings.viewRules')} onPress={() => navigation.navigate('HowToPlay')} />

        {/* Merged subsection: About information now lives inside Credits. */}
        <SectionLabel>{t('settings.credits')}</SectionLabel>
        <OptionCard
          icon="ribbon"
          title={t('settings.credits')}
          subtitle={t('settings.creditsDesc')}
          onPress={() => navigation.navigate('About')}
        />

        <AppText variant="caption" muted align="center" style={styles.version}>
          {t('common.versionValue', { value: APP_VERSION })}
        </AppText>
      </View>
    </BrandedScreen>
  );
}

function SectionLabel({ children }: { children: string }) {
  return (
    <AppText variant="overline" color={theme.colors.textMuted} style={styles.sectionLabel}>
      {children}
    </AppText>
  );
}

function SettingRow({
  icon,
  label,
  value,
  onValueChange,
}: {
  icon: IconName;
  label: string;
  value: boolean;
  onValueChange: () => void;
}) {
  return (
    <View style={styles.settingRow}>
      <Icon name={icon} size={22} color={theme.colors.primaryLight} />
      <AppText variant="title" style={styles.settingLabel}>
        {label}
      </AppText>
      <Switch
        value={value}
        onValueChange={onValueChange}
        trackColor={{ false: theme.palette.sand, true: theme.colors.primary }}
        thumbColor={theme.palette.white}
        ios_backgroundColor={theme.palette.sand}
      />
    </View>
  );
}

/** Mute is the Music toggle above; this adds friendly volume down / up steppers. */
function MusicVolumeRow() {
  const { t } = useAppTranslation();
  const music = useSettingsStore((s) => s.music);
  const musicVolume = useSettingsStore((s) => s.musicVolume);
  const adjust = useSettingsStore((s) => s.adjustMusicVolume);

  const pct = Math.round(musicVolume * 100);
  const muted = !music;
  const canDown = !muted && pct > 0;
  const canUp = !muted && pct < 100;

  const step = (delta: number) => {
    tapFeedback();
    adjust(delta);
  };

  return (
    <View style={[styles.settingRow, muted && styles.rowMuted]}>
      <Icon name="volume-medium" size={22} color={theme.colors.primaryLight} />
      <AppText variant="title" style={styles.settingLabel}>
        {t('settings.musicVolume')}
      </AppText>
      <View style={styles.stepper}>
        <PressableScale
          onPress={canDown ? () => step(-VOLUME_STEP) : undefined}
          disabled={!canDown}
          accessibilityRole="button"
          accessibilityLabel={t('settings.volumeDown')}
          style={[styles.stepBtn, !canDown && styles.stepBtnDisabled]}
        >
          <Icon name="remove" size={20} color={theme.colors.primaryDeep} />
        </PressableScale>
        <AppText variant="bodyStrong" align="center" style={styles.stepValue}>
          {muted ? t('settings.muted') : `${pct}%`}
        </AppText>
        <PressableScale
          onPress={canUp ? () => step(VOLUME_STEP) : undefined}
          disabled={!canUp}
          accessibilityRole="button"
          accessibilityLabel={t('settings.volumeUp')}
          style={[styles.stepBtn, !canUp && styles.stepBtnDisabled]}
        >
          <Icon name="add" size={20} color={theme.colors.primaryDeep} />
        </PressableScale>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: theme.spacing.md,
    paddingTop: theme.spacing.sm,
  },
  sectionLabel: {
    marginTop: theme.spacing.md,
    marginLeft: theme.spacing.xs,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.lg,
    paddingVertical: theme.spacing.xs,
  },
  settingLabel: { flex: 1 },
  rowMuted: { opacity: 0.5 },
  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  stepBtn: {
    width: 40,
    height: 40,
    borderRadius: theme.radii.pill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(212,163,44,0.16)',
    borderWidth: 1.5,
    borderColor: theme.colors.borderStrong,
  },
  stepBtnDisabled: { opacity: 0.4 },
  stepValue: { minWidth: 54 },
  rowDivider: { marginVertical: theme.spacing.sm },
  version: { marginTop: theme.spacing.lg },
});
