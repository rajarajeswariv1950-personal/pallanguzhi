import { useCallback, useMemo, useRef } from 'react';

/**
 * Measured pit geometry, in the game board container's coordinate space.
 * Consumed by board overlays (the sowing-hand animation) that need to travel
 * between pits; purely observational — nothing here affects layout.
 */
export interface PitCenter {
  /** Center X within the board container. */
  x: number;
  /** Center Y within the board container. */
  y: number;
  /** Pit diameter (min of the measured width/height). */
  size: number;
}

export interface PitCenterRegistry {
  /** Record or update a pit's measured center (called from pit onLayout). */
  register: (boardIndex: number, center: PitCenter) => void;
  /** Latest measured center for a pit, if it has reported yet. */
  get: (boardIndex: number) => PitCenter | undefined;
  /** True once every pit in `indices` has reported a measurement. */
  ready: (indices: readonly number[]) => boolean;
}

/**
 * Mutable registry of pit centers. Stored in a ref (not state) on purpose:
 * measurements arrive during layout and must never trigger re-renders of the
 * board — overlays read the registry lazily when an animation starts.
 */
export function usePitCenters(): PitCenterRegistry {
  const centers = useRef(new Map<number, PitCenter>());

  const register = useCallback((boardIndex: number, center: PitCenter) => {
    centers.current.set(boardIndex, center);
  }, []);
  const get = useCallback((boardIndex: number) => centers.current.get(boardIndex), []);
  const ready = useCallback(
    (indices: readonly number[]) => indices.every((i) => centers.current.has(i)),
    [],
  );

  return useMemo(() => ({ register, get, ready }), [register, get, ready]);
}
