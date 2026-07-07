import { ImageSourcePropType } from 'react-native';

/**
 * Central registry for the brand assets. Relative requires (not path-aliased)
 * are used for maximum reliability with the Metro asset resolver across web,
 * iOS, and Android.
 *
 * All brand *text* (app name, studio name, production credit) lives in the
 * centralized translations (`common.appName`, `brand.studio`,
 * `brand.footerCredit`) so it follows the selected language — never hardcode it.
 */
export const brandAssets = {
  /**
   * Primary brand image — the full, edge-to-edge Pallanguzhi carved-board key art
   * used everywhere the app logo appears (hero, header, language-select centre,
   * home centre, pause), so the branding is visually identical across the whole
   * app. This is the true full-bleed board scene (hand, board, shells, lamps,
   * journal, brand plate) with NO white padding — a landscape 16:9 photo
   * (PNG, 1920 x 1080) that fills its framed container elegantly. It is NOT the
   * Phoenix emblem and NOT the white-margined native splash/icon square.
   */
  primaryLogo: require('../../assets/brand/pallanguzhi-logo.png') as ImageSourcePropType,
  /** Phoenix Neumed emblem (optimized 256px) — the compact secondary brand mark. */
  emblem: require('../../assets/brand/phoenix-emblem-256.png') as ImageSourcePropType,
  /**
   * Neutral local placeholder block shown in the About-screen credit card.
   * Intended to be swapped later — replace `assets/brand/credit-placeholder.png`
   * with the final credit artwork; no code change needed.
   */
  creditPlaceholder: require('../../assets/brand/credit-placeholder.png') as ImageSourcePropType,
};

export const APP_VERSION = '1.0.0';
