import { describe, expect, it } from 'vitest'
import { HEROES, CLASSIC_HERO_COUNT, ZERO_HERO_COUNT, TOTAL_HERO_COUNT } from '../heroes/data'
import {
  calculatePower,
  comparePowers,
  explainComparison,
  formatExpression,
  formatExpressionAscii,
  toSuperscript,
} from './index'
import { resolveBattle } from '../battleEngine'
import { createTournament, fullRosterTournament } from '../tournament'

describe('hero roster', () => {
  it('has 50 classic + 5 zero-power heroes', () => {
    expect(HEROES).toHaveLength(TOTAL_HERO_COUNT)
    expect(CLASSIC_HERO_COUNT).toBe(50)
    expect(ZERO_HERO_COUNT).toBe(5)
    expect(TOTAL_HERO_COUNT).toBe(55)

    const classic = HEROES.filter((h) => h.base >= 1)
    const zeros = HEROES.filter((h) => h.base === 0)
    expect(classic).toHaveLength(50)
    expect(zeros).toHaveLength(5)

    const keys = new Set(HEROES.map((h) => `${h.base}^${h.exponent}`))
    expect(keys.size).toBe(55)
  })

  it('uses bases 0-10 and exponents 1-5', () => {
    for (const hero of HEROES) {
      expect(hero.base).toBeGreaterThanOrEqual(0)
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

  it('zero-power heroes all have power 0', () => {
    const zeros = HEROES.filter((h) => h.base === 0)
    expect(zeros).toHaveLength(5)
    for (const hero of zeros) {
      expect(hero.power).toBe(0)
    }
  })

  it('has unique ids and names', () => {
    expect(new Set(HEROES.map((h) => h.id)).size).toBe(55)
    expect(new Set(HEROES.map((h) => h.name)).size).toBe(55)
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

  it('zero power loses to any positive power', () => {
    const zero = HEROES.find((h) => h.base === 0 && h.exponent === 3)!
    const unit = HEROES.find((h) => h.base === 1 && h.exponent === 1)!
    expect(zero.power).toBe(0)
    expect(unit.power).toBe(1)
    const result = resolveBattle(zero, unit)
    expect(result.winner).toBe('b')
    expect(result.winnerHero?.id).toBe(unit.id)
  })

  it('two zero-power heroes draw', () => {
    const a = HEROES.find((h) => h.base === 0 && h.exponent === 1)!
    const b = HEROES.find((h) => h.base === 0 && h.exponent === 5)!
    const result = resolveBattle(a, b)
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
  it('formats expressions with Unicode superscripts', () => {
    expect(toSuperscript(3)).toBe('³')
    expect(formatExpression(3, 4)).toBe('3⁴')
    expect(formatExpressionAscii(3, 4)).toBe('3^4')
    expect(formatExpression(0, 2)).toBe('0²')
    expect(explainComparison(3, 4, 4, 3)).toBe('3⁴=81 > 4³=64')
    expect(comparePowers(81, 64)).toBe(1)
    expect(comparePowers(16, 16)).toBe(0)
    expect(comparePowers(0, 1)).toBe(-1)
  })

  it('allows base 0 in calculatePower', () => {
    expect(calculatePower(0, 1)).toBe(0)
    expect(calculatePower(0, 5)).toBe(0)
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
