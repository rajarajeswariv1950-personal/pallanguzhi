/**
 * Maps the engine's linear 14-pit array to the two visual rows of the board.
 * Bottom row = player 0 (indices 0..6, left→right).
 * Top row = player 1 (indices 13..7, left→right) so the loop reads anti-clockwise.
 */
export const BOTTOM_INDICES = [0, 1, 2, 3, 4, 5, 6] as const;
export const TOP_INDICES = [13, 12, 11, 10, 9, 8, 7] as const;

export function toRows(pits: number[]): { topRow: number[]; bottomRow: number[] } {
  return {
    bottomRow: BOTTOM_INDICES.map((i) => pits[i] ?? 0),
    topRow: TOP_INDICES.map((i) => pits[i] ?? 0),
  };
}

export function boardIndexFor(row: 'top' | 'bottom', displayIndex: number): number {
  return row === 'bottom' ? BOTTOM_INDICES[displayIndex] : TOP_INDICES[displayIndex];
}
