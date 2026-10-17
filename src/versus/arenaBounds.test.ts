import { describe, expect, it } from 'vitest'

/** Mirrors VersusArena clampFighterToArena — keep in sync with playfield constants. */
const ARENA_W = 960
const ARENA_H = 520
const GROUND_Y = ARENA_H - 72
const FIGHTER_R = 36
const SPRITE_H = 88
const MIN_X = FIGHTER_R
const MAX_X = ARENA_W - FIGHTER_R
const MIN_Y = SPRITE_H
const MAX_Y = GROUND_Y

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n))
}

function clampFighterToArena(f: { x: number; y: number; vx: number; vy: number }) {
  f.x = clamp(f.x, MIN_X, MAX_X)
  f.y = clamp(f.y, MIN_Y, MAX_Y)
  if (f.x <= MIN_X && f.vx < 0) f.vx = 0
  if (f.x >= MAX_X && f.vx > 0) f.vx = 0
  if (f.y <= MIN_Y && f.vy < 0) f.vy = 0
  if (f.y >= MAX_Y && f.vy > 0) f.vy = 0
}

describe('clampFighterToArena', () => {
  it('keeps freefly inside top and side walls and zeros outward velocity', () => {
    const f = { x: -50, y: -20, vx: -240, vy: -240 }
    clampFighterToArena(f)
    expect(f.x).toBe(MIN_X)
    expect(f.y).toBe(MIN_Y)
    expect(f.vx).toBe(0)
    expect(f.vy).toBe(0)
  })

  it('keeps knockback from pushing past the right / floor edge', () => {
    const f = { x: ARENA_W + 40, y: GROUND_Y + 80, vx: 200, vy: 100 }
    clampFighterToArena(f)
    expect(f.x).toBe(MAX_X)
    expect(f.y).toBe(MAX_Y)
    expect(f.vx).toBe(0)
    expect(f.vy).toBe(0)
  })

  it('leaves inward velocity alone when already inside', () => {
    const f = { x: 400, y: 200, vx: -10, vy: 10 }
    clampFighterToArena(f)
    expect(f).toEqual({ x: 400, y: 200, vx: -10, vy: 10 })
  })
})
