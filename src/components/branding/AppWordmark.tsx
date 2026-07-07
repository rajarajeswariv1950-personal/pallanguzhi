import { StyleProp, StyleSheet, TextStyle, View, ViewStyle } from 'react-native';
import { AppText } from '@/components/ui/Text';
import { useAppTranslation } from '@/hooks/useAppTranslation';
import { theme, TypographyToken } from '@/theme';

export type WordmarkSize = 'hero' | 'header' | 'inline';

export interface AppWordmarkProps {
  size?: WordmarkSize;
  align?: TextStyle['textAlign'];
  /** Lines allowed for the primary name (default 2). */
  numberOfLines?: number;
  color?: string;
  /** Extra style applied to the primary name text. */
  style?: StyleProp<TextStyle>;
  /** Show the "A Tamil Traditional Game" descriptor line (default true). */
  showDescriptor?: boolean;
  containerStyle?: StyleProp<ViewStyle>;
  /**
   * Bilingual (English + Tamil) lockup — used ONLY on the first language-selection
   * screen. Everywhere else this is false and the wordmark is single-language,
   * following the chosen language.
   */
  bilingual?: boolean;
}

const MAIN_VARIANT: Record<WordmarkSize, TypographyToken> = {
  hero: 'h1',
  header: 'bodyStrong',
  inline: 'caption',
};
const DESCRIPTOR_VARIANT: Record<WordmarkSize, TypographyToken> = {
  hero: 'title',
  header: 'small',
  inline: 'small',
};
// Tamil sits as a slightly smaller secondary tier in the bilingual lockup.
const MAIN_TA_VARIANT: Record<WordmarkSize, TypographyToken> = {
  hero: 'h3',
  header: 'small',
  inline: 'small',
};
const DESC_TA_VARIANT: Record<WordmarkSize, TypographyToken> = {
  hero: 'caption',
  header: 'small',
  inline: 'small',
};

/**
 * Splits a full app name like "Name - Descriptor" or "Name — Descriptor" into
 * its primary and descriptor parts so the wordmark can present a clean two-tier
 * hierarchy without hardcoding the split anywhere.
 */
function splitName(name: string): { main: string; descriptor?: string } {
  const match = name.match(/^(.*?)\s[—-]\s(.*)$/);
  if (match) return { main: match[1].trim(), descriptor: match[2].trim() };
  return { main: name };
}

/**
 * The app name. By default it renders in the ONE selected language (single-
 * language app after the user's choice). With `bilingual`, it renders English
 * then Tamil — used only on the first language-selection screen.
 */
export function AppWordmark({
  size = 'header',
  align = 'center',
  numberOfLines = 2,
  color,
  style,
  showDescriptor = true,
  containerStyle,
  bilingual = false,
}: AppWordmarkProps) {
  const { t, i18n } = useAppTranslation();
  const alignItems =
    align === 'left' ? 'flex-start' : align === 'right' ? 'flex-end' : 'center';
  const mainColor = color ?? theme.colors.primaryLight;

  if (bilingual) {
    const en = splitName(i18n.getFixedT('en')('common.appName') as string);
    const ta = splitName(i18n.getFixedT('ta')('common.appName') as string);
    return (
      <View style={[{ alignItems }, containerStyle]}>
        <AppText variant={MAIN_VARIANT[size]} color={mainColor} align={align} numberOfLines={numberOfLines} style={style}>
          {en.main}
        </AppText>
        {showDescriptor && en.descriptor ? (
          <AppText variant={DESCRIPTOR_VARIANT[size]} color={theme.colors.textMuted} align={align} numberOfLines={2} style={size === 'hero' ? styles.descriptorHero : styles.descriptor}>
            {en.descriptor}
          </AppText>
        ) : null}
        <AppText variant={MAIN_TA_VARIANT[size]} color={mainColor} align={align} numberOfLines={numberOfLines} style={[styles.tamilMain, style]}>
          {ta.main}
        </AppText>
        {showDescriptor && ta.descriptor ? (
          <AppText variant={DESC_TA_VARIANT[size]} color={theme.colors.textMuted} align={align} numberOfLines={2} style={styles.descriptor}>
            {ta.descriptor}
          </AppText>
        ) : null}
      </View>
    );
  }

  const { main, descriptor } = splitName(t('common.appName'));
  return (
    <View style={[{ alignItems }, containerStyle]}>
      <AppText variant={MAIN_VARIANT[size]} color={mainColor} align={align} numberOfLines={numberOfLines} style={style}>
        {main}
      </AppText>
      {showDescriptor && descriptor ? (
        <AppText variant={DESCRIPTOR_VARIANT[size]} color={theme.colors.textMuted} align={align} numberOfLines={2} style={size === 'hero' ? styles.descriptorHero : styles.descriptor}>
          {descriptor}
        </AppText>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  descriptor: {
    marginTop: 1,
    letterSpacing: 0.4,
  },
  descriptorHero: {
    marginTop: theme.spacing.xs,
    letterSpacing: 0.6,
  },
  tamilMain: {
    marginTop: 2,
    opacity: 0.95,
  },
});
