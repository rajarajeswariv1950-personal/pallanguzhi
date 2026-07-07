import { DarkTheme, Theme } from '@react-navigation/native';
import { theme } from '@/theme';

/** React Navigation theme aligned to the royal teal / antique-gold palette. */
export const navigationTheme: Theme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    primary: theme.colors.primary,
    background: theme.colors.bg,
    card: theme.colors.bg,
    text: theme.colors.text,
    border: theme.colors.border,
    notification: theme.colors.accent,
  },
};
