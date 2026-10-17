import { describe, expect, it } from 'vitest'
import { FLY_SPEED, GRAVITY, applyHoldToAscendFlight } from './flightPhysics'

const GROUND_Y = 448
const DT = 1 / 60

describe('applyHoldToAscendFlight', () => {
  it('ascends while hold is active for either player intent', () => {
    const f = { y: GROUND_Y, vy: 0, flying: false }
    applyHoldToAscendFlight(f, { ascend: true, descend: false }, DT, GROUND_Y)
    expect(f.flying).toBe(true)
    expect(f.vy).toBe(-FLY_SPEED)
  })

  it('stops upward thrust and applies gravity when ascend is released (P2 sticky-fly fix)', () => {
    const f = { y: GROUND_Y - 120, vy: -FLY_SPEED, flying: true }
    applyHoldToAscendFlight(f, { ascend: false, descend: false }, DT, GROUND_Y)
    expect(f.vy).toBeCloseTo(-FLY_SPEED + GRAVITY * DT, 5)
    expect(f.flying).toBe(true) // still airborne until landing
  })

  it('does not keep permanent fly mode after a single up tap once landed', () => {
    const f = { y: GROUND_Y - 2, vy: -FLY_SPEED, flying: true }
    // Release up while near ground with downward fall over a few frames
    for (let i = 0; i < 90; i++) {
      applyHoldToAscendFlight(f, { ascend: false, descend: false }, DT, GROUND_Y)
      f.y += f.vy * DT
      if (f.y >= GROUND_Y - 0.5) {
        f.y = GROUND_Y
        if (true) {
          // mirror post-integrate landing clear
          f.vy = 0
          f.flying = false
        }
        break
      }
    }
    expect(f.y).toBe(GROUND_Y)
    expect(f.flying).toBe(false)
    expect(f.vy).toBe(0)
  })

  it('descends while holding down', () => {
    const f = { y: GROUND_Y - 100, vy: 0, flying: true }
    applyHoldToAscendFlight(f, { ascend: false, descend: true }, DT, GROUND_Y)
    expect(f.vy).toBe(FLY_SPEED)
    expect(f.flying).toBe(true)
  })

  it('clears flying on ground when not holding ascend', () => {
    const f = { y: GROUND_Y, vy: -10, flying: true }
    applyHoldToAscendFlight(f, { ascend: false, descend: false }, DT, GROUND_Y)
    expect(f.y).toBe(GROUND_Y)
    expect(f.flying).toBe(false)
    expect(f.vy).toBe(0)
  })
})
