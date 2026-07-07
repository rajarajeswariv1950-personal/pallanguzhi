import { Pressable, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Icon } from './Icon';
import { useAppTranslation } from '@/hooks/useAppTranslation';
import { tapFeedback } from '@/services/feedback';
import { theme } from '@/theme';

export interface BackButtonProps {
  /** Custom handler (e.g. confirm-exit during online play). Falls back to goBack(). */
  onPress?: () => void;
  accessibilityLabel?: string;
}

export function BackButton({ onPress, accessibilityLabel }: BackButtonProps) {
  const { t } = useAppTranslation();
  const navigation = useNavigation();
  const label = accessibilityLabel ?? t('common.back');

  const handlePress = () => {
    tapFeedback();
    if (onPress) {
      onPress();
      return;
    }
    if (navigation.canGoBack()) {
      navigation.goBack();
    }
  };

  return (
    <Pressable
      onPress={handlePress}
      hitSlop={theme.layout.hitSlop}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={({ pressed }) => [styles.button, pressed && styles.pressed]}
    >
      <Icon name="chevron-back" size={24} color={theme.colors.primaryLight} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(212,163,44,0.14)',
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  pressed: {
    opacity: 0.7,
    transform: [{ scale: 0.94 }],
    backgroundColor: 'rgba(212,163,44,0.26)',
  },
});
