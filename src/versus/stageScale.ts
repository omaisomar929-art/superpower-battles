/** Logical arena size used by physics + sprite layout. */
export const ARENA_W = 960
export const ARENA_H = 520

/** Cap so smart boards grow, but sprites stay crisp enough. */
export const MAX_STAGE_SCALE = 1.75

/**
 * Fit the logical arena inside a viewport slot (contain).
 * Allows upscaling on large / smart-board displays.
 * Never exceeds the slot — short landscape phones stay unclipped.
 */
export function computeStageScale(
  slotWidth: number,
  slotHeight: number,
  arenaW = ARENA_W,
  arenaH = ARENA_H,
  maxScale = MAX_STAGE_SCALE,
): number {
  if (slotWidth <= 0 || slotHeight <= 0) return 1
  const fit = Math.min(slotWidth / arenaW, slotHeight / arenaH)
  return Math.min(maxScale, Math.max(0.01, fit))
}
