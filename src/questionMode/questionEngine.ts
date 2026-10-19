import type { Hero } from '../heroes/types'
import { HEROES, getHeroByPowerPair, getRandomHeroes } from '../heroes/data'
import { resolveTrueBattle, type BattleResult } from '../battleEngine'
import {
  calculateTruePower,
  formatExpression,
  formatPowerExpansion,
  raiseToPower,
} from '../mathEngine'

/** Only these three kinds appear in Question Mode. */
export type QuestionType = 'stronger' | 'weaker' | 'evaluate'

export interface QuestionOption {
  id: string
  label: string
  /** Optional hero tied to this choice (for art / clash casting). */
  heroId?: string
}

export interface Question {
  id: string
  type: QuestionType
  prompt: string
  hint: string
  options: QuestionOption[]
  /** Option id(s) that are correct. */
  correctOptionIds: string[]
  /** Heroes that clash after the answer (left vs right). */
  clashA: Hero
  clashB: Hero
  /** Precomputed math outcome for the clash (true mathematical powers). */
  battle: BattleResult
  /** Short teaching line revealed after answer. */
  teach: string
}

export interface RoundOutcome {
  question: Question
  selectedOptionId: string
  correct: boolean
  /** Champion gained the charge for the next attack. */
  chargedSide: 'player' | 'rival'
}

export interface QuestionRunState {
  champion: Hero
  score: number
  streak: number
  bestStreak: number
  round: number
  answered: number
  correctCount: number
}

export function createRun(champion: Hero): QuestionRunState {
  return {
    champion,
    score: 0,
    streak: 0,
    bestStreak: 0,
    round: 1,
    answered: 0,
    correctCount: 0,
  }
}

export function applyAnswer(
  state: QuestionRunState,
  question: Question,
  selectedOptionId: string,
): { state: QuestionRunState; outcome: RoundOutcome } {
  const correct = question.correctOptionIds.includes(selectedOptionId)
  const streak = correct ? state.streak + 1 : 0
  const points = correct ? 100 + streak * 25 : 0
  const next: QuestionRunState = {
    ...state,
    score: state.score + points,
    streak,
    bestStreak: Math.max(state.bestStreak, streak),
    answered: state.answered + 1,
    correctCount: state.correctCount + (correct ? 1 : 0),
    round: state.round + 1,
  }
  return {
    state: next,
    outcome: {
      question,
      selectedOptionId,
      correct,
      chargedSide: correct ? 'player' : 'rival',
    },
  }
}

function shuffle<T>(items: T[]): T[] {
  const copy = [...items]
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[copy[i], copy[j]] = [copy[j], copy[i]]
  }
  return copy
}

function truePowerOf(hero: Hero): number {
  return calculateTruePower(hero.base, hero.exponent)
}

/**
 * Pick two heroes with different true mathematical powers (n⁰ = 1).
 * Stronger/weaker questions never use equal pairs so the answer is unambiguous.
 */
function pickUnequalPair(): [Hero, Hero] {
  for (let attempt = 0; attempt < 60; attempt += 1) {
    const [a, b] = getRandomHeroes(2)
    if (!a || !b) break
    if (truePowerOf(a) !== truePowerOf(b)) return [a, b]
  }

  // Deterministic fallback: walk shuffled roster for first unequal pair
  const pool = shuffle(HEROES)
  for (let i = 0; i < pool.length; i += 1) {
    for (let j = i + 1; j < pool.length; j += 1) {
      const a = pool[i]!
      const b = pool[j]!
      if (truePowerOf(a) !== truePowerOf(b)) return [a, b]
    }
  }

  return [pool[0]!, pool[1]!]
}

/** Find two different expressions that share the same true mathematical value. */
export function pickEqualTruePowerPair(): [Hero, Hero] | null {
  const byPower = new Map<number, Hero[]>()
  for (const hero of HEROES) {
    const p = truePowerOf(hero)
    const list = byPower.get(p) ?? []
    list.push(hero)
    byPower.set(p, list)
  }
  const candidates = [...byPower.values()].filter((group) => group.length >= 2)
  if (candidates.length === 0) return null
  const group = shuffle(candidates)[0]!
  const picked = shuffle(group)
  return [picked[0]!, picked[1]!]
}

/** Who is stronger? Unequal true powers only — no Equal choice. */
export function generateStrongerQuestion(): Question {
  const [left, right] = pickUnequalPair()
  const battle = resolveTrueBattle(left, right)
  const leftOpt: QuestionOption = {
    id: 'left',
    label: left.name,
    heroId: left.id,
  }
  const rightOpt: QuestionOption = {
    id: 'right',
    label: right.name,
    heroId: right.id,
  }
  const options = shuffle([leftOpt, rightOpt])
  const correctOptionIds = battle.winner === 'a' ? [leftOpt.id] : [rightOpt.id]

  return {
    id: `stronger-${left.id}-${right.id}-${Date.now()}`,
    type: 'stronger',
    prompt: 'Who is stronger?',
    hint: 'True math: n⁰ = 1. Compare the values under each hero.',
    options,
    correctOptionIds,
    clashA: left,
    clashB: right,
    battle,
    teach: battle.explanation,
  }
}

/** Who is weaker? Unequal true powers only — no Equal choice. */
export function generateWeakerQuestion(): Question {
  const [left, right] = pickUnequalPair()
  const battle = resolveTrueBattle(left, right)
  const leftOpt: QuestionOption = {
    id: 'left',
    label: left.name,
    heroId: left.id,
  }
  const rightOpt: QuestionOption = {
    id: 'right',
    label: right.name,
    heroId: right.id,
  }
  const options = shuffle([leftOpt, rightOpt])
  // Weaker = the non-winner when powers differ (never draw by construction)
  const correctOptionIds = battle.winner === 'a' ? [rightOpt.id] : [leftOpt.id]

  return {
    id: `weaker-${left.id}-${right.id}-${Date.now()}`,
    type: 'weaker',
    prompt: 'Who is weaker?',
    hint: 'True math: n⁰ = 1. The smaller value is weaker.',
    options,
    correctOptionIds,
    clashA: left,
    clashB: right,
    battle,
    teach: battle.explanation,
  }
}

/** @deprecated Use generateStrongerQuestion — kept as alias for older imports. */
export function generateCompareQuestion(_forceEqual = false): Question {
  return generateStrongerQuestion()
}

/** What is n² / n³? Numeric multiple choice with true math. */
export function generateEvaluateQuestion(): Question {
  const exponent = Math.random() < 0.55 ? 2 : 3
  const basePool = exponent === 2 ? [2, 3, 4, 5, 6, 7, 8, 9, 10] : [2, 3, 4, 5, 6]
  const base = basePool[Math.floor(Math.random() * basePool.length)]!
  const value = raiseToPower(base, exponent)
  const expr = formatExpression(base, exponent)

  const wrong = new Set<number>()
  const decoyFns = [
    () => raiseToPower(base, exponent === 2 ? 3 : 2),
    () => base * exponent,
    () => base + exponent,
    () => raiseToPower(Math.max(base - 1, 1), exponent),
    () => raiseToPower(base + 1, exponent),
    () => base * base + (exponent === 2 ? base : 0),
  ]
  for (const fn of decoyFns) {
    try {
      const w = fn()
      if (w !== value && Number.isSafeInteger(w) && w >= 0) wrong.add(w)
    } catch {
      /* skip overflow */
    }
    if (wrong.size >= 3) break
  }
  while (wrong.size < 3) {
    wrong.add(value + wrong.size + 1)
  }

  const correct: QuestionOption = { id: 'correct', label: String(value) }
  const decoys = [...wrong].slice(0, 3).map((n, i) => ({
    id: `decoy-${i}`,
    label: String(n),
  }))
  const options = shuffle([correct, ...decoys])

  const heroA =
    getHeroByPowerPair(base, exponent) ??
    HEROES.find((h) => h.exponent === exponent) ??
    HEROES[10]!
  const heroB = getRandomHeroes(1, [heroA.id])[0]!
  const battle = resolveTrueBattle(heroA, heroB)

  return {
    id: `evaluate-${base}-${exponent}-${Date.now()}`,
    type: 'evaluate',
    prompt: `What is ${expr}?`,
    hint: exponent === 2 ? 'Square means multiply the base by itself.' : 'Cube means base × base × base.',
    options,
    correctOptionIds: ['correct'],
    clashA: heroA,
    clashB: heroB,
    battle,
    teach: formatPowerExpansion(base, exponent),
  }
}

const TYPE_CYCLE: QuestionType[] = ['stronger', 'weaker', 'evaluate']

export function generateQuestion(state: QuestionRunState, type?: QuestionType): Question {
  const picked = type ?? TYPE_CYCLE[(state.round - 1) % TYPE_CYCLE.length]!
  if (picked === 'stronger') return generateStrongerQuestion()
  if (picked === 'weaker') return generateWeakerQuestion()
  return generateEvaluateQuestion()
}

export function gradeLabel(state: QuestionRunState): string {
  if (state.answered === 0) return 'Ready'
  const ratio = state.correctCount / state.answered
  if (ratio >= 0.9 && state.bestStreak >= 5) return 'Math Overlord'
  if (ratio >= 0.75) return 'Power Savant'
  if (ratio >= 0.5) return 'Arena Apprentice'
  return 'Keep Training'
}
