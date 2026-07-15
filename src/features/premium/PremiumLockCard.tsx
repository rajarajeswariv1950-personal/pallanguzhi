import { useState } from 'react';
import { Linking, StyleSheet, View } from 'react-native';
import { AppText, Badge, Button, Card, Divider, Icon, Input } from '@/components';
import { PAYMENT_LINK_URL, PREMIUM_PRICING } from './entitlements';
import { useEntitlementStore } from '@/store/entitlementStore';
import { useAppTranslation } from '@/hooks/useAppTranslation';
import { feedback, haptic } from '@/services/feedback';
import { theme } from '@/theme';

/**
 * Premium lock card — SAFE FOUNDATION ONLY (no live payments).
 * Shown beneath locked content. Contains:
 *  - honest one-time pricing (placeholder amounts) + "coming soon" CTA,
 *  - a "Premium Access" info section (what unlocks, one-time, indicative),
 *  - the owner/friend access-code field (local placeholder gifting).
 * When real purchases arrive (RevenueCat in-app purchase for store builds, or
 * Razorpay UPI/cards for web), the provider's success callback should call
 * useEntitlementStore.getState().unlock('purchase') — this card needs no
 * other change. See features/premium/entitlements.ts for the full plan.
 */
export function PremiumLockCard() {
  const { t } = useAppTranslation();
  const redeemCode = useEntitlementStore((s) => s.redeemCode);
  const [showNote, setShowNote] = useState(false);
  const [code, setCode] = useState('');
  const [codeState, setCodeState] = useState<
    'idle' | 'checking' | 'invalid' | 'used' | 'revoked' | 'network' | 'accepted'
  >('idle');

  const applyCode = async () => {
    if (!code.trim() || codeState === 'checking') return;
    setCodeState('checking');
    // Server-validated redemption — the app bundle holds no codes.
    const result = await redeemCode(code);
    if (result === 'ok') {
      setCodeState('accepted');
      feedback('win', 'success');
    } else {
      setCodeState(result);
      haptic('warning');
    }
  };

  return (
    <Card>
      <View style={styles.header}>
        <View style={styles.lockMedallion}>
          <Icon name="lock-closed" size={22} color={theme.colors.primaryLight} />
        </View>
        <View style={styles.headerText}>
          <AppText variant="title">{t('premium.title')}</AppText>
          <AppText variant="caption" muted style={styles.subtitle}>
            {t('premium.subtitle')}
          </AppText>
        </View>
        <Badge label={t('premium.lockedBadge')} tone="gold" />
      </View>

      <AppText variant="bodyStrong" align="center" color={theme.colors.primaryLight} style={styles.price}>
        {t('premium.priceLine', PREMIUM_PRICING)}
      </AppText>

      {/* Buy button: opens the owner's hosted payment link when configured
          (PAYMENT_LINK_URL in entitlements.ts — currently a placeholder);
          until then it explains that purchase is coming soon. */}
      <Button
        label={PAYMENT_LINK_URL ? t('premium.buyNow') : t('premium.cta')}
        icon="lock-open"
        variant="secondary"
        onPress={() => {
          if (PAYMENT_LINK_URL) {
            void Linking.openURL(PAYMENT_LINK_URL).catch(() => setShowNote(true));
          } else {
            setShowNote(true);
          }
        }}
      />
      {showNote ? (
        <AppText variant="small" muted align="center" style={styles.note}>
          {t('premium.ctaNote')}
        </AppText>
      ) : null}

      <Divider ornament style={styles.divider} />

      {/* Premium Access — honest, no dark patterns: what unlocks, one-time,
          and that displayed prices are placeholders until purchases go live. */}
      <AppText variant="overline" color={theme.colors.textMuted}>
        {t('premium.infoTitle')}
      </AppText>
      <View style={styles.infoList}>
        <AppText variant="small" muted>{t('premium.infoWhat')}</AppText>
        <AppText variant="small" muted>{t('premium.infoOneTime')}</AppText>
        <AppText variant="small" muted>{t('premium.infoPricing')}</AppText>
      </View>

      <Divider style={styles.divider} />

      {/* Owner / friend access code (local placeholder gifting). */}
      <AppText variant="caption" muted style={styles.codeLabel}>
        {t('premium.codeLabel')}
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
            onSubmitEditing={applyCode}
          />
        </View>
        <Button
          label={codeState === 'checking' ? t('premium.codeChecking') : t('premium.codeApply')}
          size="md"
          fullWidth={false}
          variant="secondary"
          disabled={!code.trim() || codeState === 'checking'}
          onPress={applyCode}
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
          {t('premium.codeAccepted')}
        </AppText>
      ) : null}
    </Card>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
  },
  lockMedallion: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(200,155,60,0.14)',
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  headerText: { flex: 1 },
  subtitle: { marginTop: 2 },
  price: { marginVertical: theme.spacing.md },
  note: { marginTop: theme.spacing.sm },
  divider: { marginVertical: theme.spacing.md },
  infoList: { gap: theme.spacing.xs, marginTop: theme.spacing.xs },
  codeLabel: { marginBottom: theme.spacing.xs },
  codeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  codeInput: { flex: 1 },
});
