import { Modal, StyleSheet, View } from 'react-native';
import { Card } from './Card';
import { AppText } from './Text';
import { Button } from './Button';
import { theme } from '@/theme';

export interface ConfirmDialogProps {
  visible: boolean;
  title: string;
  message?: string;
  confirmLabel: string;
  cancelLabel?: string;
  /** Renders the confirm action in the maroon danger style. */
  destructive?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

/**
 * Themed in-app confirm dialog.
 *
 * Used instead of the native Alert on Android, where long Tamil button
 * labels get truncated ("செயலியிலிருந்து வெளி…") and become unreliable to
 * tap. Full-width stacked buttons give every label a whole line, so Tamil
 * text wraps only at word boundaries and never breaks mid-word — and the
 * dialog matches the app's premium card styling instead of the plain
 * system sheet.
 */
export function ConfirmDialog({
  visible,
  title,
  message,
  confirmLabel,
  cancelLabel,
  destructive,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={onCancel}
    >
      <View style={styles.overlay}>
        <Card style={styles.panel}>
          <AppText variant="h3" align="center">
            {title}
          </AppText>
          {message ? (
            <AppText variant="body" align="center" muted style={styles.message}>
              {message}
            </AppText>
          ) : null}
          <View style={styles.actions}>
            <Button
              label={confirmLabel}
              variant={destructive ? 'danger' : 'primary'}
              onPress={onConfirm}
            />
            {cancelLabel ? <Button label={cancelLabel} variant="ghost" onPress={onCancel} /> : null}
          </View>
        </Card>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: theme.spacing.xl,
    // Warm ink scrim so the dialog reads as part of the premium palette.
    backgroundColor: 'rgba(42,30,18,0.55)',
  },
  panel: {
    width: '100%',
    maxWidth: 420,
  },
  message: {
    marginTop: theme.spacing.md,
  },
  actions: {
    marginTop: theme.spacing.xl,
    gap: theme.spacing.sm,
  },
});
