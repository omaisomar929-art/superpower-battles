import { describe, expect, it } from 'vitest'
import { ARENA_H, ARENA_W, computeStageScale, MAX_STAGE_SCALE } from './stageScale'

describe('computeStageScale', () => {
  it('fits a phone portrait slot and keeps fighters tall enough', () => {
    // 390×844 phone: after HUD/pads ~390×320 remain for stage
    const scale = computeStageScale(390, 320)
    expect(scale).toBeCloseTo(Math.min(390 / ARENA_W, 320 / ARENA_H), 5)
    expect(ARENA_H * scale).toBeGreaterThan(140)
    expect(ARENA_W * scale).toBeLessThanOrEqual(390 + 0.01)
  })

  it('scales up for smart-board landscape', () => {
    const scale = computeStageScale(1600, 700)
    expect(scale).toBeGreaterThan(1)
    expect(scale).toBeLessThanOrEqual(MAX_STAGE_SCALE)
  })

  it('never exceeds a short landscape slot', () => {
    const scale = computeStageScale(844, 140)
    expect(ARENA_W * scale).toBeLessThanOrEqual(844 + 0.01)
    expect(ARENA_H * scale).toBeLessThanOrEqual(140 + 0.01)
  })

  it('returns 1 for empty measurements', () => {
    expect(computeStageScale(0, 500)).toBe(1)
    expect(computeStageScale(500, 0)).toBe(1)
  })
})
