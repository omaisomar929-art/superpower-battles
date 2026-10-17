/** Shared hold-to-ascend flight for versus arena (P1 + P2). */

export const FLY_SPEED = 240
export const GRAVITY = 980

export type FlightBody = {
  y: number
  vy: number
  flying: boolean
}

/**
 * Hold ascend → upward thrust; release → gravity (no sticky hover).
 * Hold descend → downward thrust while airborne / to leave hover.
 * Landing clears the flying flag unless still holding ascend.
 */
export function applyHoldToAscendFlight(
  f: FlightBody,
  input: { ascend: boolean; descend: boolean },
  dt: number,
  groundY: number,
) {
  if (input.ascend) {
    f.flying = true
    f.vy = -FLY_SPEED
  } else if (input.descend) {
    f.flying = true
    f.vy = FLY_SPEED
  } else {
    // Not holding up/down: always fall — never keep last upward vy.
    f.vy += GRAVITY * dt
  }

  if (f.y >= groundY - 0.5) {
    f.y = groundY
    if (!input.ascend) {
      f.vy = 0
      f.flying = false
    }
  }
}
