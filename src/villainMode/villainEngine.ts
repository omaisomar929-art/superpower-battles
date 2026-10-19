import type { Hero } from '../heroes/types'
import { HEROES, getHeroByPowerPair, getRandomHeroes } from '../heroes/data'
import { resolveBattle, resolveTrueBattle, type BattleResult } from '../battleEngine'
import {
  calculateTruePower,
  formatExpression,
  formatPowerExpansion,
  raiseToPower,
  toExpandedForm,
  toSuperscript,
} from '../mathEngine'
import { NULL_OVERLORD, pickMinion } from './cast'

export type VillainWaveKind = 'expand' | 'squareCube' | 'strongerWeaker'

export interface VillainOption {
  id: string
  label: string
}

export interface VillainQuestion {
  id: string
  wave: 1 | 2 | 3
  kind: VillainWaveKind
  title: string
  prompt: string
  hint: string
  /** Optional display of the cursed / wrong form for wave 1. */
  curseDisplay?: string
  options: VillainOption[]
  correctOptionIds: string[]
  teach: string
  /** Heroes shown on the quiz panel (wave 3 compare pair). Defaults to clash fighters. */
  displayA?: Hero
  displayB?: Hero
  /** Heroes for the post-answer fight. */
  clashA: Hero
  clashB: Hero
  battle: BattleResult
}

export interface VillainRunState {
  champion: Hero
  score: number
  streak: number
  bestStreak: number
  wave: 1 | 2 | 3
  answered: number
  correctCount: number
  minionIds: string[]
  complete: boolean
  victory: boolean
}

export interface VillainRoundOutcome {
  question: VillainQuestion
  selectedOptionId: string
  correct: boolean
}

const EXPAND_POOL = [27, 45, 78, 106, 245, 306, 409, 520, 708, 1024, 1503, 2048] as const

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

function pickUnequalPair(exclude: string[] = []): [Hero, Hero] {
  for (let attempt = 0; attempt < 60; attempt += 1) {
    const [a, b] = getRandomHeroes(2, exclude)
    if (!a || !b) break
    if (truePowerOf(a) !== truePowerOf(b)) return [a, b]
  }
  const pool = shuffle(HEROES.filter((h) => !exclude.includes(h.id)))
  for (let i = 0; i < pool.length; i += 1) {
    for (let j = i + 1; j < pool.length; j += 1) {
      const a = pool[i]!
      const b = pool[j]!
      if (truePowerOf(a) !== truePowerOf(b)) return [a, b]
    }
  }
  return [pool[0]!, pool[1]!]
}

/** Build plausible wrong expanded forms for grade-6 place-value practice. */
export function buildWrongExpandedForms(value: number, correct: string): string[] {
  const digits = String(value)
  const wrong = new Set<string>()

  // Include zero digits (common mistake)
  if (value > 9) {
    const withZeros: string[] = []
    for (let i = 0; i < digits.length; i += 1) {
      const digit = Number(digits[i])
      const place = digits.length - 1 - i
      withZeros.push(`${digit}×10${toSuperscript(place)}`)
    }
    const z = withZeros.join(' + ')
    if (z !== correct) wrong.add(z)
  }

  // Swap two non-zero place coefficients
  const terms: { digit: number; place: number }[] = []
  for (let i = 0; i < digits.length; i += 1) {
    const digit = Number(digits[i])
    if (digit === 0) continue
    terms.push({ digit, place: digits.length - 1 - i })
  }
  if (terms.length >= 2) {
    const swapped = [...terms]
    ;[swapped[0]!, swapped[1]!] = [
      { digit: swapped[1]!.digit, place: swapped[0]!.place },
      { digit: swapped[0]!.digit, place: swapped[1]!.place },
    ]
    wrong.add(swapped.map((t) => `${t.digit}×10${toSuperscript(t.place)}`).join(' + '))
  }

  // Drop the ones / last term
  if (terms.length >= 2) {
    wrong.add(
      terms
        .slice(0, -1)
        .map((t) => `${t.digit}×10${toSuperscript(t.place)}`)
        .join(' + '),
    )
  }

  // Off-by-one place on the leading digit
  if (terms[0] && terms[0].place > 0) {
    const bad = terms.map((t, i) =>
      i === 0
        ? `${t.digit}×10${toSuperscript(t.place - 1)}`
        : `${t.digit}×10${toSuperscript(t.place)}`,
    )
    wrong.add(bad.join(' + '))
  }

  // Digit×10^n with n = digit length (ignore place)
  if (terms[0]) {
    wrong.add(`${terms[0].digit}×10${toSuperscript(digits.length)}`)
  }

  wrong.delete(correct)
  const list = [...wrong].filter((w) => w.length > 0)
  while (list.length < 3) {
    list.push(`${value}×10${toSuperscript(list.length)}`)
  }
  return list.slice(0, 3)
}

export function createVillainRun(champion: Hero): VillainRunState {
  return {
    champion,
    score: 0,
    streak: 0,
    bestStreak: 0,
    wave: 1,
    answered: 0,
    correctCount: 0,
    minionIds: [],
    complete: false,
    victory: false,
  }
}

export function applyVillainAnswer(
  state: VillainRunState,
  question: VillainQuestion,
  selectedOptionId: string,
): { state: VillainRunState; outcome: VillainRoundOutcome } {
  const correct = question.correctOptionIds.includes(selectedOptionId)
  const streak = correct ? state.streak + 1 : 0
  const points = correct ? 150 + streak * 40 + question.wave * 50 : 0
  const advancedWave = correct && state.wave < 3 ? ((state.wave + 1) as 1 | 2 | 3) : state.wave
  const complete = correct && state.wave === 3
  const next: VillainRunState = {
    ...state,
    score: state.score + points,
    streak,
    bestStreak: Math.max(state.bestStreak, streak),
    answered: state.answered + 1,
    correctCount: state.correctCount + (correct ? 1 : 0),
    wave: complete ? 3 : advancedWave,
    complete,
    victory: complete,
    minionIds:
      correct && question.clashB.id !== NULL_OVERLORD.id
        ? [...state.minionIds, question.clashB.id]
        : state.minionIds,
  }
  return {
    state: next,
    outcome: { question, selectedOptionId, correct },
  }
}

/** Wave 1 — Expand the Curse: fix the wrong expanded form. */
export function generateExpandCurseQuestion(champion: Hero, excludeMinions: string[]): VillainQuestion {
  const value = EXPAND_POOL[Math.floor(Math.random() * EXPAND_POOL.length)]!
  const correct = toExpandedForm(value)
  const wrongs = buildWrongExpandedForms(value, correct)
  const cursed = wrongs[0]!
  const correctOpt: VillainOption = { id: 'correct', label: correct }
  const decoys = wrongs.slice(0, 3).map((label, i) => ({ id: `wrong-${i}`, label }))
  // Ensure cursed form is among options as a decoy if not already the first
  const options = shuffle([correctOpt, ...decoys])

  const minion = pickMinion([champion.id, ...excludeMinions])
  // Correct answers charge the champion — resolve with game powers so hero can win the skirmish
  const battle = resolveBattle(champion, minion)

  return {
    id: `expand-${value}-${Date.now()}`,
    wave: 1,
    kind: 'expand',
    title: 'Expand the Curse',
    prompt: `Null Overlord cursed ${value} with a wrong expanded form. Which expansion breaks the shield?`,
    hint: 'Place value: each digit × a power of ten. Skip zero digits.',
    curseDisplay: `${value} ≠ ${cursed}`,
    options,
    correctOptionIds: ['correct'],
    teach: `${value} = ${correct}`,
    clashA: champion,
    clashB: minion,
    battle,
  }
}

/** Wave 2 — Square/Cube Trap: grade-6 friendly bases 2–12. */
export function generateSquareCubeTrapQuestion(
  champion: Hero,
  excludeMinions: string[],
): VillainQuestion {
  const exponent = Math.random() < 0.55 ? 2 : 3
  const basePool = exponent === 2 ? [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12] : [2, 3, 4, 5, 6, 7, 8, 9, 10]
  const base = basePool[Math.floor(Math.random() * basePool.length)]!
  const value = raiseToPower(base, exponent)
  const expr = formatExpression(base, exponent)

  const wrong = new Set<number>()
  const decoyFns = [
    () => raiseToPower(base, exponent === 2 ? 3 : 2),
    () => base * exponent,
    () => base + exponent,
    () => raiseToPower(Math.max(base - 1, 2), exponent),
    () => raiseToPower(Math.min(base + 1, 12), exponent),
    () => base * base + (exponent === 2 ? base : 0),
  ]
  for (const fn of decoyFns) {
    try {
      const w = fn()
      if (w !== value && Number.isSafeInteger(w) && w >= 0) wrong.add(w)
    } catch {
      /* skip */
    }
    if (wrong.size >= 3) break
  }
  while (wrong.size < 3) wrong.add(value + wrong.size + 1)

  const correct: VillainOption = { id: 'correct', label: String(value) }
  const decoys = [...wrong].slice(0, 3).map((n, i) => ({ id: `decoy-${i}`, label: String(n) }))
  const options = shuffle([correct, ...decoys])

  const trapHero = getHeroByPowerPair(Math.min(base, 10), Math.min(exponent, 5)) ?? champion
  const minion = pickMinion([champion.id, trapHero.id, ...excludeMinions])
  const battle = resolveBattle(champion, minion)

  return {
    id: `sqcube-${base}-${exponent}-${Date.now()}`,
    wave: 2,
    kind: 'squareCube',
    title: 'Square / Cube Trap',
    prompt: `What is ${expr}? Charge your hero before the minion strikes!`,
    hint: exponent === 2 ? 'Square = base × base.' : 'Cube = base × base × base.',
    options,
    correctOptionIds: ['correct'],
    teach: formatPowerExpansion(base, exponent),
    clashA: champion,
    clashB: minion,
    battle,
  }
}

/** Wave 3 — Stronger/Weaker Duel, then boss clash with Null Overlord. */
export function generateStrongerWeakerDuelQuestion(champion: Hero): VillainQuestion {
  const askStronger = Math.random() < 0.5
  const [left, right] = pickUnequalPair([champion.id, NULL_OVERLORD.id])
  const trueBattle = resolveTrueBattle(left, right)
  const leftOpt: VillainOption = { id: 'left', label: left.name }
  const rightOpt: VillainOption = { id: 'right', label: right.name }
  const options = shuffle([leftOpt, rightOpt])

  let correctOptionIds: string[]
  if (askStronger) {
    correctOptionIds = trueBattle.winner === 'a' ? ['left'] : ['right']
  } else {
    correctOptionIds = trueBattle.winner === 'a' ? ['right'] : ['left']
  }

  // Final clash: champion vs Null Overlord (game powers — void boss at 0)
  const bossBattle = resolveBattle(champion, NULL_OVERLORD)

  return {
    id: `duel-${left.id}-${right.id}-${Date.now()}`,
    wave: 3,
    kind: 'strongerWeaker',
    title: 'Stronger / Weaker Duel',
    prompt: askStronger ? 'Who is stronger?' : 'Who is weaker?',
    hint: 'True math: n⁰ = 1. Equal-power pairs are never used.',
    options,
    correctOptionIds,
    teach: `${trueBattle.explanation} · Then face Null Overlord!`,
    displayA: left,
    displayB: right,
    clashA: champion,
    clashB: NULL_OVERLORD,
    battle: bossBattle,
  }
}

export function generateWaveQuestion(state: VillainRunState): VillainQuestion {
  if (state.wave === 1) return generateExpandCurseQuestion(state.champion, state.minionIds)
  if (state.wave === 2) return generateSquareCubeTrapQuestion(state.champion, state.minionIds)
  return generateStrongerWeakerDuelQuestion(state.champion)
}

export function waveLabel(wave: 1 | 2 | 3): string {
  if (wave === 1) return 'Wave 1 · Expand the Curse'
  if (wave === 2) return 'Wave 2 · Square / Cube Trap'
  return 'Wave 3 · Stronger / Weaker Duel'
}

export function villainGradeLabel(state: VillainRunState): string {
  if (state.victory && state.correctCount === 3 && state.answered === 3) return 'Null Breaker'
  if (state.victory) return 'Overlord Foiled'
  if (state.correctCount === 0) return 'Void Apprentice'
  if (state.streak >= 2) return 'Curse Breaker'
  return 'Draining Resisted'
}
