import { describe, expect, it } from 'vitest'
import { HEROES } from '../heroes/data'
import { calculatePower, comparePowers, explainComparison, formatExpression } from './index'
import { resolveBattle } from '../battleEngine'
import { createTournament, fullRosterTournament } from '../tournament'

describe('hero roster', () => {
  it('has exactly 50 unique base^exponent combinations', () => {
    expect(HEROES).toHaveLength(50)
    const keys = new Set(HEROES.map((h) => `${h.base}^${h.exponent}`))
    expect(keys.size).toBe(50)
  })

  it('uses bases 1-10 and exponents 1-5', () => {
    for (const hero of HEROES) {
      expect(hero.base).toBeGreaterThanOrEqual(1)
      expect(hero.base).toBeLessThanOrEqual(10)
      expect(hero.exponent).toBeGreaterThanOrEqual(1)
      expect(hero.exponent).toBeLessThanOrEqual(5)
    }
  })

  it('calculates powers correctly', () => {
    for (const hero of HEROES) {
      expect(hero.power).toBe(hero.base ** hero.exponent)
      expect(calculatePower(hero.base, hero.exponent)).toBe(hero.power)
    }
  })

  it('has unique ids and names', () => {
    expect(new Set(HEROES.map((h) => h.id)).size).toBe(50)
    expect(new Set(HEROES.map((h) => h.name)).size).toBe(50)
  })
})

describe('battle engine', () => {
  it('stronger power wins', () => {
    const a = HEROES.find((h) => h.base === 3 && h.exponent === 4)!
    const b = HEROES.find((h) => h.base === 4 && h.exponent === 3)!
    const result = resolveBattle(a, b)
    expect(a.power).toBe(81)
    expect(b.power).toBe(64)
    expect(result.winner).toBe('a')
    expect(result.winnerHero?.id).toBe(a.id)
    expect(result.explanation).toContain('81')
    expect(result.explanation).toContain('64')
  })

  it('equal powers draw', () => {
    const a = HEROES.find((h) => h.base === 2 && h.exponent === 4)!
    const b = HEROES.find((h) => h.base === 4 && h.exponent === 2)!
    const result = resolveBattle(a, b)
    expect(a.power).toBe(16)
    expect(b.power).toBe(16)
    expect(result.winner).toBe('draw')
    expect(result.winnerHero).toBeNull()
  })

  it('never picks a random winner', () => {
    const a = HEROES[10]
    const b = HEROES[20]
    const first = resolveBattle(a, b)
    for (let i = 0; i < 20; i += 1) {
      expect(resolveBattle(a, b).winner).toBe(first.winner)
    }
  })
})

describe('math helpers', () => {
  it('formats expressions and comparisons', () => {
    expect(formatExpression(3, 4)).toBe('3^4')
    expect(explainComparison(3, 4, 4, 3)).toBe('3^4=81 > 4^3=64')
    expect(comparePowers(81, 64)).toBe(1)
    expect(comparePowers(16, 16)).toBe(0)
  })
})

describe('tournament', () => {
  it('produces a champion for bracket sizes', () => {
    for (const size of [4, 8, 16, 32] as const) {
      const state = createTournament([], { size, randomFill: true })
      expect(state.participants).toHaveLength(size)
      expect(state.champion).not.toBeNull()
      expect(state.matches.length).toBe(size - 1)
    }
  })

  it('full roster tournament works', () => {
    const state = fullRosterTournament(32)
    expect(state.champion).not.toBeNull()
  })
})
