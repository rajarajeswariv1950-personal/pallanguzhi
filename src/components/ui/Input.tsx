import { StyleSheet, TextInput, TextInputProps, View } from 'react-native';
import { AppText } from './Text';
import { theme } from '@/theme';

export interface InputProps extends TextInputProps {
  label?: string;
  centered?: boolean;
}

export function Input({ label, centered, style, ...rest }: InputProps) {
  return (
    <View style={styles.wrap}>
      {label ? (
        <AppText variant="caption" muted style={styles.label}>
          {label}
        </AppText>
      ) : null}
      <TextInput
        placeholderTextColor={theme.colors.textMuted}
        selectionColor={theme.colors.primary}
        style={[styles.input, centered && styles.centered, style]}
        {...rest}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: theme.spacing.xs },
  label: { marginLeft: theme.spacing.xs },
  input: {
    height: 52,
    borderRadius: theme.radii.md,
    borderWidth: 1.5,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surfaceRaised,
    paddingHorizontal: theme.spacing.lg,
    color: theme.colors.text,
    fontSize: theme.fontSizes.lg,
  },
  centered: {
    textAlign: 'center',
    letterSpacing: 2,
  },
});
