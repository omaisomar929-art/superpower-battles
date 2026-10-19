import {
  calculateTruePower,
  formatExpression,
  toExpandedForm,
  toSuperscript,
} from '../mathEngine'
import type { PowerExpr } from './types'

/** Grade-6 friendly bases/exponents (true math: n⁰ = 1). */
const BASES = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10] as const
const EXPS = [0, 1, 2, 3, 4, 5] as const

export function makeExpr(base: number, exponent: number): PowerExpr {
  return {
    base,
    exponent,
    value: calculateTruePower(base, exponent),
  }
}

export function labelExpr(expr: PowerExpr): string {
  return formatExpression(expr.base, expr.exponent)
}

export function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

export function pickRandom<T>(items: readonly T[]): T {
  return items[randomInt(0, items.length - 1)]!
}

export function shuffleInPlace<T>(items: T[]): T[] {
  for (let i = items.length - 1; i > 0; i -= 1) {
    const j = randomInt(0, i)
    ;[items[i], items[j]] = [items[j]!, items[i]!]
  }
  return items
}

/** All roster pairs as true-math expressions. */
export function allRosterExprs(): PowerExpr[] {
  const out: PowerExpr[] = []
  for (const base of BASES) {
    for (const exp of EXPS) {
      out.push(makeExpr(base, exp))
    }
  }
  return out
}

const ROSTER = allRosterExprs()

export function randomExpr(filter?: (e: PowerExpr) => boolean): PowerExpr {
  const pool = filter ? ROSTER.filter(filter) : ROSTER
  return pickRandom(pool.length ? pool : ROSTER)
}

/** Two expressions with unequal true values — for stronger/weaker. */
export function unequalPair(): { a: PowerExpr; b: PowerExpr; stronger: 'a' | 'b' } {
  for (let attempt = 0; attempt < 40; attempt += 1) {
    const a = randomExpr()
    const b = randomExpr((e) => e.base !== a.base || e.exponent !== a.exponent)
    if (a.value === b.value) continue
    return { a, b, stronger: a.value > b.value ? 'a' : 'b' }
  }
  // Guaranteed unequal fallback
  const a = makeExpr(2, 5)
  const b = makeExpr(3, 2)
  return { a, b, stronger: 'a' }
}

export function isPerfectSquare(n: number): boolean {
  if (n < 0 || !Number.isInteger(n)) return false
  const root = Math.round(Math.sqrt(n))
  return root * root === n
}

export function isPerfectCube(n: number): boolean {
  if (n < 0 || !Number.isInteger(n)) return false
  const root = Math.round(Math.cbrt(n))
  return root * root * root === n
}

/** Common grade-6 squares (0²–12²) and a few larger. */
export const SQUARE_VALUES = [0, 1, 4, 9, 16, 25, 36, 49, 64, 81, 100, 121, 144] as const

/** Common grade-6 cubes (0³–8³). */
export const CUBE_VALUES = [0, 1, 8, 27, 64, 125, 216, 343, 512] as const

export function randomSquareValue(): number {
  return pickRandom(SQUARE_VALUES)
}

export function randomCubeValue(): number {
  return pickRandom(CUBE_VALUES)
}

export function randomNonSquare(avoid: number[] = []): number {
  for (let i = 0; i < 50; i += 1) {
    const n = randomInt(2, 150)
    if (!isPerfectSquare(n) && !avoid.includes(n)) return n
  }
  return 12
}

export function randomNonCube(avoid: number[] = []): number {
  for (let i = 0; i < 50; i += 1) {
    const n = randomInt(2, 200)
    if (!isPerfectCube(n) && !avoid.includes(n)) return n
  }
  return 10
}

/** Numbers good for expanded-form practice (grade 6 place value). */
export function randomExpandNumber(): number {
  const presets = [7, 40, 100, 205, 540, 703, 1000, 2048, 3506, 10_005, 42_060]
  if (Math.random() < 0.55) return pickRandom(presets)
  // random 2–5 digit with at least one zero sometimes
  const digits = randomInt(2, 5)
  let n = randomInt(1, 9)
  for (let i = 1; i < digits; i += 1) {
    n = n * 10 + (Math.random() < 0.35 ? 0 : randomInt(0, 9))
  }
  return n
}

export function wrongExpandedForms(value: number, count = 3): string[] {
  const correct = toExpandedForm(value)
  const wrongs = new Set<string>()
  const digits = String(value)

  // Shift a place exponent
  if (value > 0) {
    const terms: string[] = []
    for (let i = 0; i < digits.length; i += 1) {
      const digit = Number(digits[i])
      if (digit === 0) continue
      const place = Math.max(0, digits.length - 1 - i + (Math.random() < 0.5 ? 1 : -1))
      terms.push(`${digit}×10${toSuperscript(place)}`)
    }
    if (terms.length) wrongs.add(terms.join(' + '))
  }

  // Include a zero term
  if (value >= 10) {
    wrongs.add(`${toExpandedForm(value)} + 0×10⁰`)
  }

  // Swap two nonzero digits' places (mangled)
  if (digits.length >= 2) {
    const mangled = [...digits]
    ;[mangled[0], mangled[mangled.length - 1]] = [mangled[mangled.length - 1]!, mangled[0]!]
    const swapped = Number(mangled.join(''))
    if (swapped !== value) wrongs.add(toExpandedForm(swapped))
  }

  // Drop ones place for multi-digit
  if (value >= 10 && value % 10 !== 0) {
    wrongs.add(toExpandedForm(Math.floor(value / 10) * 10))
  }

  // Fake full expansion with wrong digit
  wrongs.add(toExpandedForm(value + randomInt(1, 9)))
  wrongs.add(toExpandedForm(Math.max(0, value - randomInt(1, 5))))

  wrongs.delete(correct)
  const list = [...wrongs].filter(Boolean)
  shuffleInPlace(list)
  while (list.length < count) {
    list.push(toExpandedForm(value + list.length + 1))
  }
  return list.slice(0, count)
}

/** Expressions whose true value equals target (or nearby distractors). */
export function exprsMatchingValue(target: number, limit = 6): PowerExpr[] {
  return ROSTER.filter((e) => e.value === target).slice(0, limit)
}

export function exprsNotMatchingValue(target: number, count: number): PowerExpr[] {
  const pool = shuffleInPlace(ROSTER.filter((e) => e.value !== target).slice())
  return pool.slice(0, count)
}

/** Common target powers for void-pull (have multiple roster matches when possible). */
export const VOID_TARGETS = [1, 4, 8, 9, 16, 25, 27, 32, 36, 49, 64, 81, 100, 125, 243, 256, 512, 625, 1024] as const

export function pickVoidTarget(): number {
  // Prefer targets that at least one roster expr hits
  const hittable = VOID_TARGETS.filter((t) => ROSTER.some((e) => e.value === t))
  return pickRandom(hittable.length ? hittable : VOID_TARGETS)
}
