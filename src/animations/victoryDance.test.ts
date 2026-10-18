import { describe, expect, it } from 'vitest'
import { HEROES } from '../heroes'
import { getVictoryDance, powerToIntensity } from './victoryDance'
import { getVictoryStingerProfile } from '../audio/soundEngine'

describe('victory dance', () => {
  it('is stable for the same hero', () => {
    const hero = HEROES[20]!
    const a = getVictoryDance(hero)
    const b = getVictoryDance(hero)
    expect(a).toEqual(b)
  })

  it('differs across heroes', () => {
    const samples = HEROES.slice(0, 40).map((h) => {
      const d = getVictoryDance(h)
      return `${d.style}:${d.bouncePx}:${d.spinDeg}:${d.trailCount}:${d.seed}`
    })
    const unique = new Set(samples)
    expect(unique.size).toBeGreaterThan(25)
  })

  it('scales intensity with power', () => {
    expect(powerToIntensity(0)).toBeLessThan(powerToIntensity(100))
    expect(powerToIntensity(100)).toBeLessThan(powerToIntensity(100000))
    const low = HEROES.find((h) => h.power <= 1)!
    const high = HEROES.find((h) => h.power >= 10000)!
    expect(getVictoryDance(high).intensity).toBeGreaterThan(getVictoryDance(low).intensity)
    expect(getVictoryDance(high).bouncePx).toBeGreaterThan(getVictoryDance(low).bouncePx)
  })
})

describe('victory stinger profile', () => {
  it('is stable and family-aware', () => {
    const hero = HEROES.find((h) => h.visuals.aura === 'fire') ?? HEROES[30]!
    const a = getVictoryStingerProfile(hero)
    const b = getVictoryStingerProfile(hero)
    expect(a).toEqual(b)
    expect(a.bpm).toBeGreaterThanOrEqual(72)
    expect(a.bpm).toBeLessThanOrEqual(168)
    expect(a.noteCount).toBeGreaterThanOrEqual(4)
    expect(a.durationSec).toBeGreaterThan(1)
  })

  it('gives void heroes darker slower-ish profiles than bright fire', () => {
    const voidHero = HEROES.find((h) => h.power === 0 || h.visuals.aura === 'void')!
    const fireHero =
      HEROES.find((h) => h.visuals.aura === 'fire' && h.power > 100) ??
      HEROES.find((h) => h.visuals.aura === 'fire')!
    const v = getVictoryStingerProfile(voidHero)
    const f = getVictoryStingerProfile(fireHero)
    expect(v.family).toBe('void')
    expect(f.family).toBe('fire')
    expect(v.mode === 'chromatic-dark' || v.mode === 'minor').toBe(true)
    expect(f.rootHz).toBeGreaterThan(v.rootHz * 0.8)
  })

  it('high-power heroes get longer richer fanfares', () => {
    const low = HEROES.find((h) => h.power > 0 && h.power <= 10)!
    const high = HEROES.find((h) => h.power >= 10000)!
    const lp = getVictoryStingerProfile(low)
    const hp = getVictoryStingerProfile(high)
    expect(hp.noteCount + hp.durationSec).toBeGreaterThan(lp.noteCount + lp.durationSec)
  })
})
