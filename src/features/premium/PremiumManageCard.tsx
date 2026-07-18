import { useState } from 'react';
import { StyleSheet, View, Alert, Platform } from 'react-native';
import { AppText, Badge, Button, Card, Divider, Icon, Input } from '@/components';
import { useEntitlementStore } from '@/store/entitlementStore';
import { usePremium } from './usePremium';
import { useAppTranslation } from '@/hooks/useAppTranslation';
import { feedback, haptic, tapFeedback } from '@/services/feedback';
import { theme } from '@/theme';

// Android: the badge sits on its own line under the title so the Tamil
// title ("பிரீமியம் அணுகல்") keeps the full row width and wraps only at
// word boundaries — side-by-side it got squeezed and broke mid-word.
// iOS keeps the original single-row header (renders fine there).
const STACK_BADGE = Platform.OS === 'android';

/**
 * Premium management card (Settings) — for users who ALREADY unlocked.
 *
 * Covers the device-handover story: the owner unlocked this device with the
 * owner code but wants to pass the device to a friend, so they
 *  1. enter a DIFFERENT code (e.g. an issued friend code) — on success the
 *     device's unlock simply switches to that code, or
 *  2. remove the unlock from this device entirely (relock) so the next
 *     person redeems their own code or purchases.
 * Locked devices see the normal PremiumLockCard on the paywalled screens
 * instead; this card then just points there.
 */
export function PremiumManageCard() {
  const { t } = useAppTranslation();
  const { isPremium, source } = usePremium();
  const redeemCode = useEntitlementStore((s) => s.redeemCode);
  const relock = useEntitlementStore((s) => s.relock);

  const [changing, setChanging] = useState(false);
  const [code, setCode] = useState('');
  const [codeState, setCodeState] = useState<
    'idle' | 'checking' | 'invalid' | 'used' | 'revoked' | 'network' | 'accepted'
  >('idle');

  if (!isPremium) {
    return (
      <Card>
        <View style={styles.header}>
          <Icon name="lock-closed" size={22} color={theme.colors.primaryLight} />
          <AppText variant="title" style={styles.headerText}>
            {t('premiumManage.title')}
          </AppText>
          {!STACK_BADGE && <Badge label={t('premium.locked')} tone="neutral" />}
        </View>
        {STACK_BADGE ? (
          <Badge label={t('premium.locked')} tone="neutral" style={styles.badgeStacked} />
        ) : null}
        <AppText variant="small" muted style={styles.body}>
          {t('premiumManage.lockedHint')}
        </AppText>
      </Card>
    );
  }

  const sourceLabel =
    source === 'purchase'
      ? t('premiumManage.sourcePurchase')
      : source === 'friendCode'
        ? t('premiumManage.sourceFriendCode')
        : t('premiumManage.sourceOwner');

  const applyNewCode = async () => {
    if (!code.trim() || codeState === 'checking') return;
    setCodeState('checking');
    const result = await redeemCode(code);
    if (result === 'ok') {
      setCodeState('accepted');
      setCode('');
      feedback('win', 'success');
    } else {
      setCodeState(result);
      haptic('warning');
    }
  };

  const confirmRelock = () => {
    tapFeedback();
    Alert.alert(t('premiumManage.relockTitle'), t('premiumManage.relockConfirm'), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('premiumManage.relockAction'),
        style: 'destructive',
        onPress: () => {
          relock();
          setChanging(false);
          setCode('');
          setCodeState('idle');
        },
      },
    ]);
  };

  return (
    <Card>
      <View style={styles.header}>
        <Icon name="ribbon" size={22} color={theme.colors.primaryLight} />
        <AppText variant="title" style={styles.headerText}>
          {t('premiumManage.title')}
        </AppText>
        {!STACK_BADGE && <Badge label={t('premiumManage.unlocked')} tone="gold" />}
      </View>
      {STACK_BADGE ? (
        <Badge label={t('premiumManage.unlocked')} tone="gold" style={styles.badgeStacked} />
      ) : null}
      <AppText variant="small" muted style={styles.body}>
        {t('premiumManage.status', { source: sourceLabel })}
      </AppText>

      <Divider style={styles.divider} />

      {changing ? (
        <View>
          <AppText variant="caption" muted style={styles.body}>
            {t('premiumManage.changeHint')}
          </AppText>
          <View style={styles.codeRow}>
            <View style={styles.codeInput}>
              <Input
                value={code}
                onChangeText={(v) => {
                  setCode(v);
                  if (codeState !== 'idle') setCodeState('idle');
                }}
                placeholder={t('premium.codePlaceholder')}
                autoCapitalize="characters"
                autoCorrect={false}
                returnKeyType="done"
                onSubmitEditing={applyNewCode}
              />
            </View>
            <Button
              label={codeState === 'checking' ? t('premium.codeChecking') : t('premium.codeApply')}
              size="md"
              fullWidth={false}
              variant="secondary"
              disabled={!code.trim() || codeState === 'checking'}
              onPress={applyNewCode}
            />
          </View>
          {codeState === 'invalid' || codeState === 'used' || codeState === 'revoked' ? (
            <AppText variant="small" align="center" color={theme.colors.danger} style={styles.note}>
              {codeState === 'used'
                ? t('premium.codeUsed')
                : codeState === 'revoked'
                  ? t('premium.codeRevoked')
                  : t('premium.codeInvalid')}
            </AppText>
          ) : null}
          {codeState === 'network' ? (
            <AppText variant="small" align="center" color={theme.colors.danger} style={styles.note}>
              {t('premium.codeNetwork')}
            </AppText>
          ) : null}
          {codeState === 'accepted' ? (
            <AppText variant="small" align="center" color={theme.colors.primaryLight} style={styles.note}>
              {t('premiumManage.changeAccepted')}
            </AppText>
          ) : null}
          <Button
            label={t('common.cancel')}
            variant="ghost"
            onPress={() => {
              setChanging(false);
              setCode('');
              setCodeState('idle');
            }}
          />
        </View>
      ) : (
        <View style={styles.actions}>
          <Button
            label={t('premiumManage.changeCode')}
            icon="key"
            variant="secondary"
            onPress={() => setChanging(true)}
          />
          <Button
            label={t('premiumManage.relockAction')}
            icon="lock-closed"
            variant="ghost"
            onPress={confirmRelock}
          />
        </View>
      )}
    </Card>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
  },
  headerText: { flex: 1 },
  // Aligned with the title text (icon 22 + header gap) on its own line.
  badgeStacked: {
    marginTop: theme.spacing.sm,
    marginLeft: 22 + theme.spacing.md,
  },
  body: { marginTop: theme.spacing.sm },
  divider: { marginVertical: theme.spacing.md },
  actions: { gap: theme.spacing.sm },
  codeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    marginVertical: theme.spacing.sm,
  },
  codeInput: { flex: 1 },
  note: { marginBottom: theme.spacing.sm },
});
