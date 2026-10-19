import type { Hero } from '../heroes/types'
import { HEROES, getHeroByPowerPair } from '../heroes/data'
import { resolveBattle, resolveTrueBattle, type BattleResult } from '../battleEngine'
import {
  calculateTruePower,
  formatExpression,
  formatPowerExpansion,
  raiseToPower,
  toExpandedForm,
  toSuperscript,
} from '../mathEngine'
import { VILLAIN_IDS, pickMinion, type VillainDifficulty, type VillainProfile } from './cast'

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
  villain: VillainProfile
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

/** Difficulty-tuned expand pools (place-value). */
const EXPAND_BY_DIFF: Record<VillainDifficulty, readonly number[]> = {
  easy: [27, 45, 56, 78, 89, 106, 120, 203],
  medium: [145, 246, 306, 409, 520, 615, 708, 812],
  hard: [1024, 1503, 2048, 2305, 3010, 4506, 5602, 7080],
  ultraHard: [2048, 3050, 4096, 5007, 6012, 7803, 9004, 10240],
}

const SQUARE_BASES: Record<VillainDifficulty, readonly number[]> = {
  easy: [2, 3, 4, 5, 6],
  medium: [4, 5, 6, 7, 8, 9],
  hard: [7, 8, 9, 10, 11, 12],
  ultraHard: [9, 10, 11, 12, 13, 14, 15],
}

const CUBE_BASES: Record<VillainDifficulty, readonly number[]> = {
  easy: [2, 3, 4],
  medium: [3, 4, 5, 6],
  hard: [5, 6, 7, 8, 9],
  ultraHard: [6, 7, 8, 9, 10, 11, 12],
}

/** Min true-power ratio (stronger/weaker) — lower = harder / closer. */
const COMPARE_MAX_RATIO: Record<VillainDifficulty, number> = {
  easy: 99,
  medium: 8,
  hard: 3.5,
  ultraHard: 2.2,
}

const COMPARE_MIN_RATIO: Record<VillainDifficulty, number> = {
  easy: 3,
  medium: 1.4,
  hard: 1.15,
  ultraHard: 1.05,
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

function powerRatio(a: Hero, b: Hero): number {
  const pa = truePowerOf(a)
  const pb = truePowerOf(b)
  const hi = Math.max(pa, pb)
  const lo = Math.max(1, Math.min(pa, pb))
  return hi / lo
}

function pickUnequalPair(
  difficulty: VillainDifficulty,
  exclude: string[] = [],
): [Hero, Hero] {
  const banned = new Set([...exclude, ...VILLAIN_IDS])
  const minR = COMPARE_MIN_RATIO[difficulty]
  const maxR = COMPARE_MAX_RATIO[difficulty]
  const pool = shuffle(HEROES.filter((h) => !banned.has(h.id)))

  const tryFit = (strict: boolean): [Hero, Hero] | null => {
    for (let i = 0; i < pool.length; i += 1) {
      for (let j = i + 1; j < pool.length; j += 1) {
        const a = pool[i]!
        const b = pool[j]!
        if (truePowerOf(a) === truePowerOf(b)) continue
        const r = powerRatio(a, b)
        if (strict) {
          if (r >= minR && r <= maxR) return [a, b]
        } else if (r !== 1) {
          // Prefer closer pairs on hard tiers even if outside band
          if (difficulty === 'easy' || r <= maxR * 1.5) return [a, b]
        }
      }
    }
    return null
  }

  return tryFit(true) ?? tryFit(false) ?? [pool[0]!, pool[1]!]
}

/** Build plausible wrong expanded forms for grade-6 place-value practice. */
export function buildWrongExpandedForms(value: number, correct: string): string[] {
  const digits = String(value)
  const wrong = new Set<string>()

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

  if (terms.length >= 2) {
    wrong.add(
      terms
        .slice(0, -1)
        .map((t) => `${t.digit}×10${toSuperscript(t.place)}`)
        .join(' + '),
    )
  }

  if (terms[0] && terms[0].place > 0) {
    const bad = terms.map((t, i) =>
      i === 0
        ? `${t.digit}×10${toSuperscript(t.place - 1)}`
        : `${t.digit}×10${toSuperscript(t.place)}`,
    )
    wrong.add(bad.join(' + '))
  }

  if (terms[0]) {
    wrong.add(`${terms[0].digit}×10${toSuperscript(digits.length)}`)
  }

  // UltraHard decoy: treat a zero digit as a real term with wrong place
  if (digits.includes('0') && terms[0]) {
    wrong.add(`${terms[0].digit}×10${toSuperscript(terms[0].place)} + 0×10¹`)
  }

  wrong.delete(correct)
  const list = [...wrong].filter((w) => w.length > 0)
  while (list.length < 3) {
    list.push(`${value}×10${toSuperscript(list.length)}`)
  }
  return list.slice(0, 3)
}

export function createVillainRun(champion: Hero, villain: VillainProfile): VillainRunState {
  return {
    champion,
    villain,
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
  const difficultyBonus =
    state.villain.difficulty === 'ultraHard'
      ? 80
      : state.villain.difficulty === 'hard'
        ? 50
        : state.villain.difficulty === 'medium'
          ? 25
          : 0
  const points = correct ? 150 + streak * 40 + question.wave * 50 + difficultyBonus : 0
  const advancedWave = correct && state.wave < 3 ? ((state.wave + 1) as 1 | 2 | 3) : state.wave
  const complete = correct && state.wave === 3
  const bossId = state.villain.hero.id
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
      correct && question.clashB.id !== bossId
        ? [...state.minionIds, question.clashB.id]
        : state.minionIds,
  }
  return {
    state: next,
    outcome: { question, selectedOptionId, correct },
  }
}

/** Wave 1 — Expand the Curse: fix the wrong expanded form. */
export function generateExpandCurseQuestion(
  champion: Hero,
  villain: VillainProfile,
  excludeMinions: string[],
): VillainQuestion {
  const pool = EXPAND_BY_DIFF[villain.difficulty]
  const value = pool[Math.floor(Math.random() * pool.length)]!
  const correct = toExpandedForm(value)
  const wrongs = buildWrongExpandedForms(value, correct)
  const cursed = wrongs[0]!
  const correctOpt: VillainOption = { id: 'correct', label: correct }
  const decoys = wrongs.slice(0, 3).map((label, i) => ({ id: `wrong-${i}`, label }))
  const options = shuffle([correctOpt, ...decoys])

  const minion = pickMinion([champion.id, ...excludeMinions])
  const battle = resolveBattle(champion, minion)
  const name = villain.hero.name

  return {
    id: `expand-${villain.difficulty}-${value}-${Date.now()}`,
    wave: 1,
    kind: 'expand',
    title: 'Expand the Curse',
    prompt: `${name} cursed ${value} with a wrong expanded form. Which expansion breaks the shield?`,
    hint:
      villain.difficulty === 'easy'
        ? 'Place value: each digit × a power of ten. Skip zero digits.'
        : villain.difficulty === 'ultraHard'
          ? 'Watch zeros and place swaps — skip zero digits in the true form.'
          : 'Place value: each digit × a power of ten. Skip zero digits.',
    curseDisplay: `${value} ≠ ${cursed}`,
    options,
    correctOptionIds: ['correct'],
    teach: `${value} = ${correct}`,
    clashA: champion,
    clashB: minion,
    battle,
  }
}

/** Wave 2 — Square/Cube Trap: difficulty-tuned bases. */
export function generateSquareCubeTrapQuestion(
  champion: Hero,
  villain: VillainProfile,
  excludeMinions: string[],
): VillainQuestion {
  const cubeChance =
    villain.difficulty === 'easy'
      ? 0.35
      : villain.difficulty === 'medium'
        ? 0.5
        : villain.difficulty === 'hard'
          ? 0.55
          : 0.62
  const exponent = Math.random() < cubeChance ? 3 : 2
  const basePool = exponent === 2 ? SQUARE_BASES[villain.difficulty] : CUBE_BASES[villain.difficulty]
  const base = basePool[Math.floor(Math.random() * basePool.length)]!
  const value = raiseToPower(base, exponent)
  const expr = formatExpression(base, exponent)

  const wrong = new Set<number>()
  const decoyFns = [
    () => raiseToPower(base, exponent === 2 ? 3 : 2),
    () => base * exponent,
    () => base + exponent,
    () => raiseToPower(Math.max(base - 1, 2), exponent),
    () => raiseToPower(base + 1, exponent),
    () => base * base + (exponent === 2 ? base : 0),
    () => (exponent === 3 ? base * base : base * base * base),
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
    id: `sqcube-${villain.difficulty}-${base}-${exponent}-${Date.now()}`,
    wave: 2,
    kind: 'squareCube',
    title: 'Square / Cube Trap',
    prompt: `What is ${expr}? Charge your hero before ${villain.hero.name}'s minion strikes!`,
    hint:
      exponent === 2
        ? villain.difficulty === 'ultraHard'
          ? 'Square = base × base. Watch near-miss decoys.'
          : 'Square = base × base.'
        : villain.difficulty === 'ultraHard'
          ? 'Cube = base × base × base. Not base×3.'
          : 'Cube = base × base × base.',
    options,
    correctOptionIds: ['correct'],
    teach: formatPowerExpansion(base, exponent),
    clashA: champion,
    clashB: minion,
    battle,
  }
}

/** Wave 3 — Stronger/Weaker Duel, then boss clash with the chosen villain. */
export function generateStrongerWeakerDuelQuestion(
  champion: Hero,
  villain: VillainProfile,
): VillainQuestion {
  const askStronger = Math.random() < 0.5
  const [left, right] = pickUnequalPair(villain.difficulty, [champion.id, villain.hero.id])
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

  const boss = villain.hero
  const bossBattle = resolveBattle(champion, boss)
  const closeHint =
    villain.difficulty === 'ultraHard' || villain.difficulty === 'hard'
      ? 'True math: n⁰ = 1. Values may be close — compute carefully.'
      : 'True math: n⁰ = 1. Equal-power pairs are never used.'

  return {
    id: `duel-${villain.difficulty}-${left.id}-${right.id}-${Date.now()}`,
    wave: 3,
    kind: 'strongerWeaker',
    title: 'Stronger / Weaker Duel',
    prompt: askStronger ? 'Who is stronger?' : 'Who is weaker?',
    hint: closeHint,
    options,
    correctOptionIds,
    teach: `${trueBattle.explanation} · Then face ${boss.name}!`,
    displayA: left,
    displayB: right,
    clashA: champion,
    clashB: boss,
    battle: bossBattle,
  }
}

export function generateWaveQuestion(state: VillainRunState): VillainQuestion {
  if (state.wave === 1) {
    return generateExpandCurseQuestion(state.champion, state.villain, state.minionIds)
  }
  if (state.wave === 2) {
    return generateSquareCubeTrapQuestion(state.champion, state.villain, state.minionIds)
  }
  return generateStrongerWeakerDuelQuestion(state.champion, state.villain)
}

export function waveLabel(wave: 1 | 2 | 3): string {
  if (wave === 1) return 'Wave 1 · Expand the Curse'
  if (wave === 2) return 'Wave 2 · Square / Cube Trap'
  return 'Wave 3 · Stronger / Weaker Duel'
}

export function villainGradeLabel(state: VillainRunState): string {
  const name = state.villain.hero.name
  if (state.victory && state.correctCount === 3 && state.answered === 3) {
    return `${name} Breaker`
  }
  if (state.victory) return `${name} Foiled`
  if (state.correctCount === 0) return 'Void Apprentice'
  if (state.streak >= 2) return 'Curse Breaker'
  return 'Draining Resisted'
}
