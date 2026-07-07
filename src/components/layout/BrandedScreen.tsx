import { ReactNode } from 'react';
import { ScrollView, StyleSheet, View, ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BrandedHeader } from '@/components/branding/BrandedHeader';
import { AppFooter } from '@/components/branding/AppFooter';
import { BackgroundDecor } from '@/components/layout/BackgroundDecor';
import { theme } from '@/theme';

export interface BrandedScreenProps {
  children: ReactNode;
  title?: string;
  showBack?: boolean;
  onBack?: () => void;
  /** Wrap content in a ScrollView (default true). */
  scroll?: boolean;
  /** Show the branded header (default true). Splash hides it. */
  header?: boolean;
  contentStyle?: ViewStyle;
  /** Sticky footer (e.g. a primary CTA) pinned above the safe-area inset. */
  footer?: ReactNode;
  /** Bilingual production credit — first language-selection screen only. */
  bilingualFooter?: boolean;
}

/**
 * The premium screen shell used by (almost) every screen. Guarantees the
 * branded header — and therefore consistent branding — is always present,
 * and keeps content elegantly centred and capped on tablet/web.
 */
export function BrandedScreen({
  children,
  title,
  showBack = true,
  onBack,
  scroll = true,
  header = true,
  contentStyle,
  footer,
  bilingualFooter = false,
}: BrandedScreenProps) {
  const insets = useSafeAreaInsets();
  // When the branded header is hidden (e.g. the language screen), the header no
  // longer consumes the top safe-area inset, so the content must add it itself —
  // otherwise the hero renders under the status bar / notch.
  const topInset = header ? 0 : insets.top;

  const content = (
    <View style={styles.centered}>
      <View style={[styles.inner, contentStyle]}>{children}</View>
    </View>
  );

  return (
    <View style={styles.root}>
      <StatusBar style="dark" />
      <LinearGradient colors={theme.gradients.wood} style={StyleSheet.absoluteFill} />
      <BackgroundDecor />
      <LinearGradient
        colors={['transparent', 'rgba(198,150,60,0.08)']}
        style={styles.vignette}
        pointerEvents="none"
      />

      {header && <BrandedHeader title={title} showBack={showBack} onBack={onBack} />}

      {scroll ? (
        <ScrollView
          style={styles.flex}
          contentContainerStyle={[
            styles.scrollContent,
            { paddingTop: theme.spacing.lg + topInset, paddingBottom: theme.spacing.xxl },
          ]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {content}
        </ScrollView>
      ) : (
        <View style={[styles.flex, styles.staticContent, { paddingTop: theme.spacing.lg + topInset }]}>
          {content}
        </View>
      )}

      {/* Persistent footer band — optional CTA above the mandatory production
          credit, which appears identically on every screen. */}
      <LinearGradient
        colors={theme.gradients.header}
        style={[styles.footerBar, { paddingBottom: insets.bottom + theme.spacing.xs }]}
      >
        <View style={styles.footerInner}>
          {footer ? <View style={styles.footerCta}>{footer}</View> : null}
          <AppFooter compact={!!footer} bilingual={bilingualFooter} />
        </View>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: theme.colors.bg,
  },
  vignette: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: '45%',
  },
  flex: { flex: 1 },
  scrollContent: {
    flexGrow: 1,
    paddingTop: theme.spacing.lg,
    paddingHorizontal: theme.layout.screenPaddingH,
  },
  staticContent: {
    paddingTop: theme.spacing.lg,
    paddingHorizontal: theme.layout.screenPaddingH,
  },
  centered: {
    flex: 1,
    width: '100%',
    alignItems: 'center',
  },
  inner: {
    width: '100%',
    maxWidth: theme.layout.maxContentWidth,
    flex: 1,
  },
  footerBar: {
    paddingHorizontal: theme.layout.screenPaddingH,
    paddingTop: theme.spacing.md,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
  footerInner: {
    width: '100%',
    maxWidth: theme.layout.maxContentWidth,
    alignSelf: 'center',
  },
  footerCta: {
    marginBottom: theme.spacing.sm,
  },
});
