import { describe, expect, it } from 'vitest'
import { HEROES } from '../heroes/data'
import { getAbilityFx, type AbilityFamily } from './abilityFx'

const FAMILIES: AbilityFamily[] = [
  'fire',
  'void',
  'ice',
  'lightning',
  'cosmic',
  'shadow',
  'earth',
  'wind',
  'plasma',
  'crystal',
]

describe('getAbilityFx', () => {
  it('assigns a stable profile for every hero', () => {
    expect(HEROES.length).toBeGreaterThanOrEqual(66)
    for (const hero of HEROES) {
      const a = getAbilityFx(hero)
      const b = getAbilityFx(hero)
      expect(a.family).toBe(b.family)
      expect(a.shape).toBe(b.shape)
      expect(a.seed).toBe(b.seed)
      expect(a.label).toBeTruthy()
      expect(FAMILIES).toContain(a.family)
      expect(a.cue).toBe(`ability-${a.family}`)
    }
  })

  it('maps power-zero and null-power heroes to void', () => {
    const voids = HEROES.filter((h) => h.exponent === 0 || h.power === 0 || h.base === 0)
    expect(voids.length).toBeGreaterThan(10)
    for (const hero of voids) {
      expect(getAbilityFx(hero).family).toBe('void')
    }
  })

  it('varies shape/seed across the roster', () => {
    const keys = new Set(HEROES.map((h) => `${getAbilityFx(h).family}:${getAbilityFx(h).shape}:${getAbilityFx(h).seed}`))
    expect(keys.size).toBe(HEROES.length)
  })
})
