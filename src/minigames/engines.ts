import { toExpandedForm } from '../mathEngine'
import {
  exprsMatchingValue,
  exprsNotMatchingValue,
  isPerfectCube,
  isPerfectSquare,
  labelExpr,
  pickVoidTarget,
  randomCubeValue,
  randomExpandNumber,
  randomExpr,
  randomInt,
  randomNonCube,
  randomNonSquare,
  randomSquareValue,
  shuffleInPlace,
  unequalPair,
  wrongExpandedForms,
} from './expressions'
import type { PowerExpr } from './types'

// re-export helper used by UI
export { labelExpr }

export interface MeteorRound {
  id: string
  left: PowerExpr
  right: PowerExpr
  stronger: 'left' | 'right'
  /** ms until city impact */
  fallMs: number
}

export function createMeteorRound(difficulty = 1): MeteorRound {
  const { a, b, stronger } = unequalPair()
  const fallMs = Math.max(2200, 5200 - difficulty * 280)
  return {
    id: `m-${Date.now()}-${randomInt(0, 9999)}`,
    left: a,
    right: b,
    stronger: stronger === 'a' ? 'left' : 'right',
    fallMs,
  }
}

export type CometMode = 'squares' | 'cubes'

export interface CometItem {
  id: string
  value: number
  correct: boolean
  xPct: number
  fallMs: number
}

export interface CometWave {
  mode: CometMode
  items: CometItem[]
}

export function createCometWave(difficulty = 1): CometWave {
  const mode: CometMode = Math.random() < 0.5 ? 'squares' : 'cubes'
  const count = Math.min(8, 4 + Math.floor(difficulty / 2))
  const correctCount = Math.max(1, Math.floor(count / 2))
  const values: { value: number; correct: boolean }[] = []

  for (let i = 0; i < correctCount; i += 1) {
    const value = mode === 'squares' ? randomSquareValue() : randomCubeValue()
    values.push({ value, correct: true })
  }
  while (values.length < count) {
    const value =
      mode === 'squares'
        ? randomNonSquare(values.map((v) => v.value))
        : randomNonCube(values.map((v) => v.value))
    values.push({ value, correct: false })
  }
  shuffleInPlace(values)

  const fallMs = Math.max(2800, 6500 - difficulty * 300)
  const items: CometItem[] = values.map((v, i) => ({
    id: `c-${Date.now()}-${i}-${randomInt(0, 999)}`,
    value: v.value,
    correct: v.correct,
    xPct: 8 + (i / Math.max(1, count - 1)) * 84,
    fallMs: fallMs + randomInt(-400, 600),
  }))

  return { mode, items }
}

export function cometHitOk(mode: CometMode, value: number): boolean {
  return mode === 'squares' ? isPerfectSquare(value) : isPerfectCube(value)
}

export interface ExpandRound {
  id: string
  value: number
  choices: { id: string; label: string; correct: boolean }[]
  timeoutMs: number
}

export function createExpandRound(difficulty = 1): ExpandRound {
  const value = randomExpandNumber()
  const correct = toExpandedForm(value)
  const wrongs = wrongExpandedForms(value, 3)
  const choices = shuffleInPlace([
    { id: 'ok', label: correct, correct: true },
    ...wrongs.map((label, i) => ({ id: `w${i}`, label, correct: false })),
  ])
  return {
    id: `e-${Date.now()}-${randomInt(0, 999)}`,
    value,
    choices,
    timeoutMs: Math.max(3500, 9000 - difficulty * 400),
  }
}

export interface VoidItem {
  id: string
  expr: PowerExpr
  label: string
  correct: boolean
  xPct: number
  fallMs: number
}

export interface VoidRound {
  target: number
  items: VoidItem[]
}

export function createVoidRound(difficulty = 1): VoidRound {
  const target = pickVoidTarget()
  let matches = exprsMatchingValue(target, 4)
  if (matches.length === 0) {
    // show the value itself as a plain number via n¹ when possible
    matches = [randomExpr((e) => e.value === target)]
    if (!matches[0] || matches[0].value !== target) {
      matches = [{ base: target, exponent: 1, value: target }]
    }
  }
  const distractors = exprsNotMatchingValue(target, Math.max(3, 5 - matches.length))
  const combined = shuffleInPlace([
    ...matches.map((expr) => ({ expr, correct: true })),
    ...distractors.map((expr) => ({ expr, correct: false })),
  ]).slice(0, Math.min(7, 4 + Math.floor(difficulty / 2)))

  const fallMs = Math.max(3000, 7000 - difficulty * 320)
  return {
    target,
    items: combined.map((row, i) => ({
      id: `v-${Date.now()}-${i}`,
      expr: row.expr,
      label: labelExpr(row.expr),
      correct: row.correct,
      xPct: 10 + (i / Math.max(1, combined.length - 1)) * 80,
      fallMs: fallMs + randomInt(-500, 700),
    })),
  }
}

export interface LaserRound {
  id: string
  left: PowerExpr
  right: PowerExpr
  winner: 'left' | 'right'
  collideMs: number
}

export function createLaserRound(difficulty = 1): LaserRound {
  const { a, b, stronger } = unequalPair()
  return {
    id: `l-${Date.now()}-${randomInt(0, 999)}`,
    left: a,
    right: b,
    winner: stronger === 'a' ? 'left' : 'right',
    collideMs: Math.max(1800, 4500 - difficulty * 220),
  }
}

export type ThunderKind = 'stronger' | 'weaker'

export interface ThunderPrompt {
  id: string
  kind: ThunderKind
  left: PowerExpr
  right: PowerExpr
  answer: 'left' | 'right'
}

export function createThunderPrompt(): ThunderPrompt {
  const { a, b, stronger } = unequalPair()
  const kind: ThunderKind = Math.random() < 0.5 ? 'stronger' : 'weaker'
  const answer: 'left' | 'right' =
    kind === 'stronger'
      ? stronger === 'a'
        ? 'left'
        : 'right'
      : stronger === 'a'
        ? 'right'
        : 'left'
  return {
    id: `t-${Date.now()}-${randomInt(0, 999)}`,
    kind,
    left: a,
    right: b,
    answer,
  }
}

export const THUNDER_DURATION_MS = 45_000
