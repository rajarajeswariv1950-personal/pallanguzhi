import { Text as RNText, TextProps, TextStyle } from 'react-native';
import { theme, TypographyToken } from '@/theme';

export interface AppTextProps extends TextProps {
  variant?: TypographyToken;
  color?: string;
  align?: TextStyle['textAlign'];
  muted?: boolean;
}

/**
 * Single text primitive for the whole app. Centralises colour + typography so
 * Tamil and English render consistently and fonts can be swapped in one place.
 */
export function AppText({
  variant = 'body',
  color,
  align,
  muted,
  style,
  ...rest
}: AppTextProps) {
  return (
    <RNText
      // Tamil must never hyphen-break mid-word on Android (no-op on iOS).
      // Callers can still override via {...rest}.
      android_hyphenationFrequency="none"
      {...rest}
      style={[
        theme.typography[variant],
        { color: color ?? (muted ? theme.colors.textMuted : theme.colors.text) },
        align ? { textAlign: align } : null,
        style,
      ]}
    />
  );
}
