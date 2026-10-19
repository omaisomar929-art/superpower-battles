import type { Hero } from '../heroes/types'
import { HEROES, getHeroByPowerPair, getRandomHeroes } from '../heroes/data'
import { resolveTrueBattle, type BattleOutcome, type BattleResult } from '../battleEngine'
import {
  calculateTruePower,
  formatExpression,
  formatPowerExpansion,
  raiseToPower,
} from '../mathEngine'

export type QuestionType =
  | 'compare'
  | 'identify'
  | 'predict'
  | 'evaluate'
  | 'squareCubeCompare'
  | 'identifyValue'

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

/** Pick two heroes; optionally prefer different or equal true mathematical powers. */
function pickDistinctPair(mode: 'any' | 'different' | 'equal' = 'different'): [Hero, Hero] {
  if (mode === 'equal') {
    const equal = pickEqualTruePowerPair()
    if (equal) return equal
  }

  for (let attempt = 0; attempt < 40; attempt += 1) {
    const [a, b] = getRandomHeroes(2)
    if (!a || !b) break
    if (mode === 'any') return [a, b]
    const same = truePowerOf(a) === truePowerOf(b)
    if (mode === 'different' && !same) return [a, b]
    if (mode === 'equal' && same) return [a, b]
  }

  if (mode === 'equal') {
    const fallback = pickEqualTruePowerPair()
    if (fallback) return fallback
  }

  const pool = shuffle(HEROES)
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

function decoyExpressions(hero: Hero, count: number): string[] {
  const seen = new Set<string>([hero.expression])
  const out: string[] = []
  const pool = shuffle(HEROES)
  for (const candidate of pool) {
    if (seen.has(candidate.expression)) continue
    seen.add(candidate.expression)
    out.push(candidate.expression)
    if (out.length >= count) break
  }
  return out
}

function outcomeLabel(winner: BattleOutcome, a: Hero, b: Hero): string {
  if (winner === 'draw') return 'Draw — equal power'
  if (winner === 'a') return a.name
  return b.name
}

/**
 * Compare uses true math (n⁰ = 1). Includes an Equal option so void-vs-unit
 * pairs like 5⁰ vs 1⁵ grade as equal — not “void is weaker.”
 */
export function generateCompareQuestion(forceEqual = false): Question {
  const wantEqual = forceEqual || Math.random() < 0.28
  const [left, right] = pickDistinctPair(wantEqual ? 'equal' : 'different')
  const battle = resolveTrueBattle(left, right)
  const leftOpt: QuestionOption = {
    id: 'left',
    label: left.expression,
    heroId: left.id,
  }
  const rightOpt: QuestionOption = {
    id: 'right',
    label: right.expression,
    heroId: right.id,
  }
  const equalOpt: QuestionOption = {
    id: 'equal',
    label: 'Equal',
  }
  const options = shuffle([leftOpt, rightOpt, equalOpt])
  const correctOptionIds =
    battle.winner === 'draw'
      ? ['equal']
      : battle.winner === 'a'
        ? [leftOpt.id]
        : [rightOpt.id]

  return {
    id: `compare-${left.id}-${right.id}-${Date.now()}`,
    type: 'compare',
    prompt: 'Which power is stronger?',
    hint: 'Use real math: n⁰ = 1. Equal values → pick Equal.',
    options,
    correctOptionIds,
    clashA: left,
    clashB: right,
    battle,
    teach: battle.explanation,
  }
}

export function generateIdentifyQuestion(champion: Hero): Question {
  const subjectPool = shuffle(HEROES.filter((h) => h.id !== champion.id))
  const subject = subjectPool[0] ?? champion
  const rival = subjectPool[1] ?? getRandomHeroes(1, [subject.id])[0]!
  const battle = resolveTrueBattle(champion, rival)

  const correct: QuestionOption = {
    id: 'correct',
    label: subject.expression,
    heroId: subject.id,
  }
  const decoys = decoyExpressions(subject, 3).map((expr, i) => ({
    id: `decoy-${i}`,
    label: expr,
  }))
  const options = shuffle([correct, ...decoys])

  return {
    id: `identify-${subject.id}-${Date.now()}`,
    type: 'identify',
    prompt: `What is ${subject.name}'s power expression?`,
    hint: `${subject.name} fights as base^exponent. Pick the matching notation.`,
    options,
    correctOptionIds: [correct.id],
    clashA: champion,
    clashB: rival,
    battle,
    teach: `${subject.name} is ${formatExpression(subject.base, subject.exponent)} = ${truePowerOf(subject).toLocaleString('en-US')} (true math).`,
  }
}

export function generatePredictQuestion(forceEqual = false): Question {
  const wantEqual = forceEqual || Math.random() < 0.22
  const [left, right] = pickDistinctPair(wantEqual ? 'equal' : 'any')
  const battle = resolveTrueBattle(left, right)
  const options: QuestionOption[] = shuffle([
    { id: 'a', label: left.name, heroId: left.id },
    { id: 'b', label: right.name, heroId: right.id },
    { id: 'draw', label: 'Draw' },
  ])
  const correctId = battle.winner === 'draw' ? 'draw' : battle.winner === 'a' ? 'a' : 'b'

  return {
    id: `predict-${left.id}-${right.id}-${Date.now()}`,
    type: 'predict',
    prompt: 'Who wins this matchup?',
    hint: 'Predict from true math (n⁰ = 1) before the clash reveals the truth.',
    options,
    correctOptionIds: [correctId],
    clashA: left,
    clashB: right,
    battle,
    teach: `${battle.explanation} → ${outcomeLabel(battle.winner, left, right)}`,
  }
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

/** Which is larger: a² or b³? (or Equal). */
export function generateSquareCubeCompareQuestion(): Question {
  const leftExp = Math.random() < 0.5 ? 2 : 3
  const rightExp = leftExp === 2 ? 3 : 2
  const leftBase = leftExp === 2 ? [2, 3, 4, 5, 6, 7, 8][Math.floor(Math.random() * 7)]! : [2, 3, 4, 5][Math.floor(Math.random() * 4)]!
  const rightBase =
    rightExp === 2
      ? [2, 3, 4, 5, 6, 7, 8][Math.floor(Math.random() * 7)]!
      : [2, 3, 4, 5][Math.floor(Math.random() * 4)]!

  const leftVal = raiseToPower(leftBase, leftExp)
  const rightVal = raiseToPower(rightBase, rightExp)
  const leftExpr = formatExpression(leftBase, leftExp)
  const rightExpr = formatExpression(rightBase, rightExp)

  const leftHero =
    getHeroByPowerPair(leftBase, leftExp) ??
    HEROES.find((h) => h.exponent === leftExp)!
  const rightHero =
    getHeroByPowerPair(rightBase, rightExp) ??
    HEROES.find((h) => h.exponent === rightExp && h.id !== leftHero.id) ??
    getRandomHeroes(1, [leftHero.id])[0]!
  const battle = resolveTrueBattle(leftHero, rightHero)

  const leftOpt: QuestionOption = { id: 'left', label: leftExpr, heroId: leftHero.id }
  const rightOpt: QuestionOption = { id: 'right', label: rightExpr, heroId: rightHero.id }
  const equalOpt: QuestionOption = { id: 'equal', label: 'Equal' }
  const options = shuffle([leftOpt, rightOpt, equalOpt])

  let correctOptionIds: string[]
  let teach: string
  if (leftVal > rightVal) {
    correctOptionIds = ['left']
    teach = `${leftExpr}=${leftVal} > ${rightExpr}=${rightVal}`
  } else if (rightVal > leftVal) {
    correctOptionIds = ['right']
    teach = `${rightExpr}=${rightVal} > ${leftExpr}=${leftVal}`
  } else {
    correctOptionIds = ['equal']
    teach = `${leftExpr}=${leftVal} = ${rightExpr}=${rightVal}`
  }

  return {
    id: `sqcube-${leftBase}-${leftExp}-${rightBase}-${rightExp}-${Date.now()}`,
    type: 'squareCubeCompare',
    prompt: `Which is larger: ${leftExpr} or ${rightExpr}?`,
    hint: 'Evaluate each square/cube, then compare. Equal values → pick Equal.',
    options,
    correctOptionIds,
    clashA: leftHero,
    clashB: rightHero,
    battle,
    teach,
  }
}

/** Identify which expression equals a square or cube value (e.g. 64). */
export function generateIdentifyValueQuestion(): Question {
  const exponent = Math.random() < 0.5 ? 2 : 3
  const basePool = exponent === 2 ? [2, 3, 4, 5, 6, 7, 8, 9, 10] : [2, 3, 4, 5]
  const base = basePool[Math.floor(Math.random() * basePool.length)]!
  const value = raiseToPower(base, exponent)
  const correctExpr = formatExpression(base, exponent)

  const decoys: string[] = []
  const seen = new Set([correctExpr])
  const candidates = shuffle(
    HEROES.filter((h) => h.exponent === 2 || h.exponent === 3).map((h) =>
      formatExpression(h.base, h.exponent),
    ),
  )
  for (const expr of candidates) {
    if (seen.has(expr)) continue
    seen.add(expr)
    decoys.push(expr)
    if (decoys.length >= 3) break
  }
  while (decoys.length < 3) {
    const b = 2 + decoys.length
    const e = decoys.length % 2 === 0 ? 2 : 3
    const expr = formatExpression(b, e)
    if (!seen.has(expr)) {
      seen.add(expr)
      decoys.push(expr)
    }
  }

  const correct: QuestionOption = { id: 'correct', label: correctExpr }
  const options = shuffle([
    correct,
    ...decoys.slice(0, 3).map((label, i) => ({ id: `decoy-${i}`, label })),
  ])

  const heroA =
    getHeroByPowerPair(base, exponent) ??
    HEROES.find((h) => h.exponent === exponent)!
  const heroB = getRandomHeroes(1, [heroA.id])[0]!
  const battle = resolveTrueBattle(heroA, heroB)

  return {
    id: `idval-${base}-${exponent}-${Date.now()}`,
    type: 'identifyValue',
    prompt: `Which expression equals ${value.toLocaleString('en-US')}?`,
    hint: exponent === 2 ? 'Find the matching square.' : 'Find the matching cube.',
    options,
    correctOptionIds: ['correct'],
    clashA: heroA,
    clashB: heroB,
    battle,
    teach: formatPowerExpansion(base, exponent),
  }
}

const TYPE_CYCLE: QuestionType[] = [
  'compare',
  'identify',
  'predict',
  'evaluate',
  'squareCubeCompare',
  'identifyValue',
]

export function generateQuestion(state: QuestionRunState, type?: QuestionType): Question {
  const picked = type ?? TYPE_CYCLE[(state.round - 1) % TYPE_CYCLE.length]!
  if (picked === 'compare') return generateCompareQuestion()
  if (picked === 'identify') return generateIdentifyQuestion(state.champion)
  if (picked === 'predict') return generatePredictQuestion()
  if (picked === 'evaluate') return generateEvaluateQuestion()
  if (picked === 'squareCubeCompare') return generateSquareCubeCompareQuestion()
  return generateIdentifyValueQuestion()
}

export function gradeLabel(state: QuestionRunState): string {
  if (state.answered === 0) return 'Ready'
  const ratio = state.correctCount / state.answered
  if (ratio >= 0.9 && state.bestStreak >= 5) return 'Math Overlord'
  if (ratio >= 0.75) return 'Power Savant'
  if (ratio >= 0.5) return 'Arena Apprentice'
  return 'Keep Training'
}
