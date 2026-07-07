import { useEffect, useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { BrandedScreen, Card, Input, Button, AppText, Badge } from '@/components';
import { useMultiplayerStore } from '@/features/multiplayer/store';
import { useAppTranslation } from '@/hooks/useAppTranslation';
import { useProfileStore } from '@/store/profileStore';
import type { RootStackScreenProps } from '@/navigation/types';
import { theme } from '@/theme';

export function JoinRoomScreen({ navigation, route }: RootStackScreenProps<'JoinRoom'>) {
  const { t } = useAppTranslation();
  const profileName = useProfileStore((s) => s.name);
  const displayName = (route.params?.name ?? profileName ?? '').trim();
  const [code, setCode] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const joinRoom = useMultiplayerStore((s) => s.joinRoom);
  const leave = useMultiplayerStore((s) => s.leave);
  const clearError = useMultiplayerStore((s) => s.clearError);
  const role = useMultiplayerStore((s) => s.role);
  const roomCode = useMultiplayerStore((s) => s.roomCode);
  const errorKey = useMultiplayerStore((s) => s.errorKey);

  const canJoin = code.trim().length >= 4 && !submitting;

  // Navigate once the server confirms us as a guest in a room.
  useEffect(() => {
    if (submitting && role === 'guest' && roomCode) {
      setSubmitting(false);
      navigation.replace('WaitingRoom', { roomCode, isHost: false });
    }
  }, [submitting, role, roomCode, navigation]);

  // Stop the spinner if the server rejected the join.
  useEffect(() => {
    if (submitting && errorKey) setSubmitting(false);
  }, [submitting, errorKey]);

  const join = () => {
    if (!canJoin) return;
    clearError();
    setSubmitting(true);
    joinRoom(code.trim().toUpperCase(), displayName || undefined);
  };

  const back = () => {
    leave();
    navigation.goBack();
  };

  return (
    <BrandedScreen
      title={t('joinRoom.title')}
      onBack={back}
      footer={
        <Button
          label={t('joinRoom.join')}
          icon="enter"
          loading={submitting}
          disabled={!canJoin}
          onPress={join}
        />
      }
    >
      <View style={styles.container}>
        <Card>
          <AppText variant="title" align="center" style={styles.label}>
            {t('joinRoom.enterCode')}
          </AppText>
          <Input
            value={code}
            onChangeText={(value) => {
              setCode(value.toUpperCase());
              if (errorKey) clearError();
            }}
            placeholder={t('joinRoom.codePlaceholder')}
            autoCapitalize="characters"
            autoCorrect={false}
            maxLength={6}
            centered
            returnKeyType="go"
            onSubmitEditing={join}
          />
        </Card>

        {errorKey ? (
          <View style={styles.error}>
            <Badge label={t(errorKey)} tone="danger" />
          </View>
        ) : null}
      </View>
    </BrandedScreen>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: theme.spacing.xl,
    paddingTop: theme.spacing.md,
  },
  label: { marginBottom: theme.spacing.lg },
  error: { alignItems: 'center' },
});
