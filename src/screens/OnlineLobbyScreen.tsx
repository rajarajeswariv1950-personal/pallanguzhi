import { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { BrandedScreen, OptionCard, Card, Input, AppText, Button, Divider } from '@/components';
import { OnlineConnectDemo } from '@/features/tutorial/OnlineConnectDemo';
import { PremiumLockCard } from '@/features/premium/PremiumLockCard';
import { usePremium } from '@/features/premium/usePremium';
import { useAppTranslation } from '@/hooks/useAppTranslation';
import { useProfileStore } from '@/store/profileStore';
import type { Difficulty } from '@/features/game/types';
import type { RootStackScreenProps } from '@/navigation/types';
import { theme } from '@/theme';

const LEVELS: readonly Difficulty[] = ['easy', 'medium', 'hard'];

export function OnlineLobbyScreen({ navigation }: RootStackScreenProps<'OnlineLobby'>) {
  const { t } = useAppTranslation();
  // STRICT premium gate: online multiplayer — including ALL three levels
  // (easy/medium/hard) — unlocks only via one-time purchase or friend code.
  // Belt-and-braces: ModeSelect already flags locked users, but the lobby is
  // the enforcement point so stale navigation/back-stack entries can't reach
  // create/join. Decision is the local entitlement only — no network/Redis.
  const { isOnlineLocked } = usePremium();
  const profileName = useProfileStore((s) => s.name);
  const [name, setName] = useState(profileName);
  // Host-chosen match level; travels in the room document so the guest plays
  // the identical rule set. Medium is the classic 6-seed game.
  const [level, setLevel] = useState<Difficulty>('medium');
  const displayName = name.trim();

  if (isOnlineLocked) {
    return (
      <BrandedScreen title={t('online.title')}>
        <View style={styles.container}>
          <AppText variant="caption" muted align="center" style={styles.note}>
            {t('premium.onlineLockedBody')}
          </AppText>
          {/* Same friend-code redemption card used on the difficulty screen. */}
          <PremiumLockCard />
        </View>
      </BrandedScreen>
    );
  }

  return (
    <BrandedScreen title={t('online.title')}>
      <View style={styles.container}>
        {/* Name entry — carried into the room so the opponent sees your name. */}
        <Card>
          <Input
            label={t('online.yourName')}
            value={name}
            onChangeText={setName}
            placeholder={t('online.namePlaceholder')}
            maxLength={20}
            returnKeyType="done"
          />
        </Card>

        {/* Match level — applies to rooms YOU create (Create Room / Quick
            Match). Joining a friend's room inherits the host's level. */}
        <Card>
          <AppText variant="overline" color={theme.colors.textMuted}>
            {t('online.levelTitle')}
          </AppText>
          <View style={styles.levelRow}>
            {LEVELS.map((d) => (
              <Button
                key={d}
                label={t(`difficulty.${d}`)}
                size="md"
                fullWidth={false}
                variant={level === d ? 'primary' : 'secondary'}
                onPress={() => setLevel(d)}
              />
            ))}
          </View>
          <AppText variant="small" muted style={styles.levelHint}>
            {t(`difficulty.twoPlayer${level === 'easy' ? 'Easy' : level === 'medium' ? 'Medium' : 'Hard'}Desc`)}
          </AppText>
        </Card>

        <OptionCard
          icon="add-circle"
          title={t('online.create')}
          subtitle={t('online.createDesc')}
          onPress={() =>
            navigation.navigate('CreateRoom', { name: displayName, difficulty: level })
          }
        />
        <OptionCard
          icon="enter"
          title={t('online.join')}
          subtitle={t('online.joinDesc')}
          onPress={() => navigation.navigate('JoinRoom', { name: displayName })}
        />
        <OptionCard
          icon="flash"
          title={t('online.quickMatch')}
          subtitle={t('online.quickMatchDesc')}
          onPress={() =>
            navigation.navigate('CreateRoom', { name: displayName, quick: true, difficulty: level })
          }
        />

        <AppText variant="caption" muted align="center" style={styles.note}>
          {t('online.twoPlayerNote')}
        </AppText>

        {/* Step-through demo of connecting two phones — same transport as the
            Watch-a-Move lesson in How to Play. */}
        <Card>
          <AppText variant="h3">{t('tutorial.onlineDemoTitle')}</AppText>
          <AppText variant="caption" muted style={styles.demoIntro}>
            {t('tutorial.onlineDemoIntro')}
          </AppText>
          <Divider style={styles.demoDivider} />
          <OnlineConnectDemo />
        </Card>
      </View>
    </BrandedScreen>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: theme.spacing.lg,
    paddingTop: theme.spacing.md,
  },
  note: { marginTop: theme.spacing.xs },
  demoIntro: { marginTop: theme.spacing.xs },
  demoDivider: { marginVertical: theme.spacing.md },
  levelRow: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
    marginTop: theme.spacing.sm,
  },
  levelHint: { marginTop: theme.spacing.sm },
});
