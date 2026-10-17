import { describe, expect, it } from 'vitest'
import {
  HEROES,
  CLASSIC_HERO_COUNT,
  ZERO_HERO_COUNT,
  NULL_BASE_HERO_COUNT,
  POWER_ZERO_HERO_COUNT,
  TOTAL_HERO_COUNT,
  isPowerZeroVoid,
} from '../heroes/data'
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
  it('has 50 classic + 5 null-base + 11 power-zero void heroes', () => {
    expect(HEROES).toHaveLength(TOTAL_HERO_COUNT)
    expect(CLASSIC_HERO_COUNT).toBe(50)
    expect(NULL_BASE_HERO_COUNT).toBe(5)
    expect(POWER_ZERO_HERO_COUNT).toBe(11)
    expect(ZERO_HERO_COUNT).toBe(16)
    expect(TOTAL_HERO_COUNT).toBe(66)

    const classic = HEROES.filter((h) => h.base >= 1 && h.exponent >= 1)
    const nullBase = HEROES.filter((h) => h.base === 0 && h.exponent >= 1)
    const powerZero = HEROES.filter((h) => h.exponent === 0)
    expect(classic).toHaveLength(50)
    expect(nullBase).toHaveLength(5)
    expect(powerZero).toHaveLength(11)

    const keys = new Set(HEROES.map((h) => `${h.base}^${h.exponent}`))
    expect(keys.size).toBe(66)
  })

  it('uses bases 0-10 and exponents 0-5', () => {
    for (const hero of HEROES) {
      expect(hero.base).toBeGreaterThanOrEqual(0)
      expect(hero.base).toBeLessThanOrEqual(10)
      expect(hero.exponent).toBeGreaterThanOrEqual(0)
      expect(hero.exponent).toBeLessThanOrEqual(5)
    }
  })

  it('calculates powers correctly (with exponent-0 game override)', () => {
    for (const hero of HEROES) {
      expect(hero.power).toBe(calculatePower(hero.base, hero.exponent))
      if (hero.exponent === 0) {
        expect(hero.power).toBe(0)
      } else {
        expect(hero.power).toBe(hero.base ** hero.exponent)
      }
    }
  })

  it('includes 0⁰ through 5⁰ and all missing bases through 10⁰', () => {
    for (let base = 0; base <= 10; base += 1) {
      const hero = HEROES.find((h) => h.base === base && h.exponent === 0)
      expect(hero).toBeDefined()
      expect(hero!.power).toBe(0)
      expect(isPowerZeroVoid(hero!)).toBe(true)
      expect(hero!.expression).toBe(formatExpression(base, 0))
    }
  })

  it('zero-power heroes all have power 0', () => {
    const zeros = HEROES.filter((h) => h.power === 0)
    // 5 null-base (0¹–0⁵) + 11 exponent-0 (0⁰–10⁰)
    expect(zeros).toHaveLength(16)
    for (const hero of zeros) {
      expect(hero.power).toBe(0)
    }
  })

  it('has unique ids and names', () => {
    expect(new Set(HEROES.map((h) => h.id)).size).toBe(66)
    expect(new Set(HEROES.map((h) => h.name)).size).toBe(66)
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

  it('power-zero void (n⁰) loses to any positive power', () => {
    const void3 = HEROES.find((h) => h.base === 3 && h.exponent === 0)!
    const unit = HEROES.find((h) => h.base === 1 && h.exponent === 1)!
    expect(void3.power).toBe(0)
    const result = resolveBattle(void3, unit)
    expect(result.winner).toBe('b')
  })

  it('two zero-power heroes draw', () => {
    const a = HEROES.find((h) => h.base === 0 && h.exponent === 1)!
    const b = HEROES.find((h) => h.base === 0 && h.exponent === 5)!
    const result = resolveBattle(a, b)
    expect(result.winner).toBe('draw')
    expect(result.winnerHero).toBeNull()
  })

  it('two power-zero void heroes draw', () => {
    const a = HEROES.find((h) => h.base === 2 && h.exponent === 0)!
    const b = HEROES.find((h) => h.base === 7 && h.exponent === 0)!
    expect(a.power).toBe(0)
    expect(b.power).toBe(0)
    const result = resolveBattle(a, b)
    expect(result.winner).toBe('draw')
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
    expect(toSuperscript(0)).toBe('⁰')
    expect(formatExpression(3, 4)).toBe('3⁴')
    expect(formatExpression(3, 0)).toBe('3⁰')
    expect(formatExpression(0, 0)).toBe('0⁰')
    expect(formatExpressionAscii(3, 4)).toBe('3^4')
    expect(formatExpression(0, 2)).toBe('0²')
    expect(explainComparison(3, 4, 4, 3)).toBe('3⁴=81 > 4³=64')
    expect(explainComparison(3, 0, 1, 1)).toBe('1¹=1 > 3⁰=0')
    expect(comparePowers(81, 64)).toBe(1)
    expect(comparePowers(16, 16)).toBe(0)
    expect(comparePowers(0, 1)).toBe(-1)
  })

  it('allows base 0 and exponent 0 in calculatePower', () => {
    expect(calculatePower(0, 1)).toBe(0)
    expect(calculatePower(0, 5)).toBe(0)
    expect(calculatePower(0, 0)).toBe(0)
    expect(calculatePower(5, 0)).toBe(0)
    expect(calculatePower(10, 0)).toBe(0)
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
