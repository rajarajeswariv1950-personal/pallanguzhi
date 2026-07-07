import { playSfx } from './audio/AudioService';
import { haptic, type HapticKind } from './haptics/HapticsService';
import type { SfxName } from './audio/sounds';

export { playSfx, initAudio, syncMusic, stopMusic, disposeAudio } from './audio/AudioService';
export { haptic } from './haptics/HapticsService';
export type { SfxName } from './audio/sounds';
export type { HapticKind } from './haptics/HapticsService';

/** Standard tap feedback for buttons and tappable rows. */
export function tapFeedback(): void {
  playSfx('tap');
  haptic('selection');
}

/** Combined sound + haptic for richer events (capture, win, turn change…). */
export function feedback(sfx: SfxName, kind?: HapticKind): void {
  playSfx(sfx);
  if (kind) haptic(kind);
}
