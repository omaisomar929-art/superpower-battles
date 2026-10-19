import { describe, expect, it } from 'vitest'
import { HEROES } from '../heroes/data'
import { resolveTrueBattle } from '../battleEngine'
import { calculatePower, calculateTruePower } from '../mathEngine'
import {
  applyAnswer,
  createRun,
  generateCompareQuestion,
  generateEvaluateQuestion,
  generateIdentifyQuestion,
  generateIdentifyValueQuestion,
  generatePredictQuestion,
  generateQuestion,
  generateSquareCubeCompareQuestion,
  gradeLabel,
  pickEqualTruePowerPair,
} from './questionEngine'
import { raiseToPower } from '../mathEngine'

describe('questionEngine', () => {
  const champion = HEROES[10]!

  it('creates a run with zero score', () => {
    const run = createRun(champion)
    expect(run.score).toBe(0)
    expect(run.streak).toBe(0)
    expect(run.round).toBe(1)
  })

  it('compare questions mark the stronger expression correct (true math)', () => {
    const q = generateCompareQuestion()
    expect(q.type).toBe('compare')
    expect(q.options).toHaveLength(3)
    expect(q.options.some((o) => o.id === 'equal')).toBe(true)
    const battle = resolveTrueBattle(q.clashA, q.clashB)
    expect(q.battle.winner).toBe(battle.winner)
    if (battle.winner === 'a') {
      expect(q.correctOptionIds).toEqual(['left'])
    } else if (battle.winner === 'b') {
      expect(q.correctOptionIds).toEqual(['right'])
    } else {
      expect(q.correctOptionIds).toEqual(['equal'])
    }
  })

  it('forced equal compare grades Equal — not left/right', () => {
    const q = generateCompareQuestion(true)
    expect(q.battle.winner).toBe('draw')
    expect(q.correctOptionIds).toEqual(['equal'])
    expect(q.correctOptionIds).not.toContain('left')
    expect(q.correctOptionIds).not.toContain('right')
    expect(calculateTruePower(q.clashA.base, q.clashA.exponent)).toBe(
      calculateTruePower(q.clashB.base, q.clashB.exponent),
    )
  })

  it('5⁰ vs 1⁵ are equal under true math (void game power stays 0)', () => {
    const fiveZero = HEROES.find((h) => h.base === 5 && h.exponent === 0)!
    const oneFive = HEROES.find((h) => h.base === 1 && h.exponent === 5)!
    expect(calculateTruePower(5, 0)).toBe(1)
    expect(calculateTruePower(1, 5)).toBe(1)
    expect(5 ** 0).toBe(1)
    expect(1 ** 5).toBe(1)
    expect(calculatePower(5, 0)).toBe(0)
    expect(fiveZero.power).toBe(0)
    expect(oneFive.power).toBe(1)

    const battle = resolveTrueBattle(fiveZero, oneFive)
    expect(battle.winner).toBe('draw')
    expect(battle.powerA).toBe(1)
    expect(battle.powerB).toBe(1)
    expect(battle.explanation).toContain('=')
  })

  it('identify questions have one correct expression for the subject', () => {
    const q = generateIdentifyQuestion(champion)
    expect(q.type).toBe('identify')
    expect(q.options.length).toBeGreaterThanOrEqual(2)
    expect(q.correctOptionIds).toEqual(['correct'])
    const correct = q.options.find((o) => o.id === 'correct')
    expect(correct?.label).toMatch(/[⁰¹²³⁴⁵⁶⁷⁸⁹]/)
  })

  it('predict questions match true-math battle outcome', () => {
    const q = generatePredictQuestion()
    expect(q.type).toBe('predict')
    expect(q.options).toHaveLength(3)
    const expected =
      q.battle.winner === 'draw' ? 'draw' : q.battle.winner === 'a' ? 'a' : 'b'
    expect(q.correctOptionIds).toEqual([expected])
    expect(resolveTrueBattle(q.clashA, q.clashB).winner).toBe(q.battle.winner)
  })

  it('forced equal predict marks Draw correct', () => {
    const q = generatePredictQuestion(true)
    expect(q.battle.winner).toBe('draw')
    expect(q.correctOptionIds).toEqual(['draw'])
  })

  it('can pick equal true-power hero pairs', () => {
    const pair = pickEqualTruePowerPair()
    expect(pair).not.toBeNull()
    const [a, b] = pair!
    expect(a.id).not.toBe(b.id)
    expect(calculateTruePower(a.base, a.exponent)).toBe(calculateTruePower(b.base, b.exponent))
  })

  it('cycles question types by round', () => {
    let state = createRun(champion)
    expect(generateQuestion(state).type).toBe('compare')
    state = { ...state, round: 2 }
    expect(generateQuestion(state).type).toBe('identify')
    state = { ...state, round: 3 }
    expect(generateQuestion(state).type).toBe('predict')
    state = { ...state, round: 4 }
    expect(generateQuestion(state).type).toBe('evaluate')
    state = { ...state, round: 5 }
    expect(generateQuestion(state).type).toBe('squareCubeCompare')
    state = { ...state, round: 6 }
    expect(generateQuestion(state).type).toBe('identifyValue')
  })

  it('evaluate questions ask for square or cube values', () => {
    const q = generateEvaluateQuestion()
    expect(q.type).toBe('evaluate')
    expect(q.prompt).toMatch(/What is \d+[²³]/)
    expect(q.correctOptionIds).toEqual(['correct'])
    const correct = q.options.find((o) => o.id === 'correct')
    expect(correct).toBeDefined()
    expect(Number(correct!.label)).toBeGreaterThan(0)
    expect(q.teach).toMatch(/=/)
  })

  it('square/cube compare grades the larger expression (or Equal)', () => {
    const q = generateSquareCubeCompareQuestion()
    expect(q.type).toBe('squareCubeCompare')
    expect(q.options.some((o) => o.id === 'equal')).toBe(true)
    expect(q.correctOptionIds).toHaveLength(1)
    expect(['left', 'right', 'equal']).toContain(q.correctOptionIds[0])
    // Prompt mentions both superscripts
    expect(q.prompt).toMatch(/[²³]/)
  })

  it('identifyValue picks the expression matching a square/cube number', () => {
    const q = generateIdentifyValueQuestion()
    expect(q.type).toBe('identifyValue')
    expect(q.correctOptionIds).toEqual(['correct'])
    const correct = q.options.find((o) => o.id === 'correct')!
    expect(correct.label).toMatch(/[²³]/)
    // Reconstruct value from teach expansion (ends with = N)
    const match = q.teach.match(/=\s*([\d,]+)\s*$/)
    expect(match).toBeTruthy()
    const value = Number(match![1]!.replace(/,/g, ''))
    expect(q.prompt).toContain(value.toLocaleString('en-US'))
    expect(raiseToPower(2, 2)).toBe(4)
  })

  it('awards streak points on correct answers and resets on miss', () => {
    const q = generateCompareQuestion(false)
    const correctId = q.correctOptionIds[0]!
    const wrongId = q.options.find((o) => !q.correctOptionIds.includes(o.id))?.id ?? correctId

    let state = createRun(champion)
    let result = applyAnswer(state, q, correctId)
    expect(result.outcome.correct).toBe(true)
    expect(result.outcome.chargedSide).toBe('player')
    expect(result.state.streak).toBe(1)
    expect(result.state.score).toBe(125)

    result = applyAnswer(result.state, q, correctId)
    expect(result.state.streak).toBe(2)
    expect(result.state.score).toBe(125 + 150)

    result = applyAnswer(result.state, q, wrongId)
    expect(result.outcome.correct).toBe(false)
    expect(result.outcome.chargedSide).toBe('rival')
    expect(result.state.streak).toBe(0)
  })

  it('grades runs from accuracy', () => {
    expect(gradeLabel(createRun(champion))).toBe('Ready')
    expect(
      gradeLabel({
        champion,
        score: 500,
        streak: 0,
        bestStreak: 6,
        round: 6,
        answered: 5,
        correctCount: 5,
      }),
    ).toBe('Math Overlord')
  })
})
