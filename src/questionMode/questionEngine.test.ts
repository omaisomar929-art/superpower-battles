import { describe, expect, it } from 'vitest'
import { HEROES } from '../heroes/data'
import { resolveTrueBattle } from '../battleEngine'
import { calculatePower, calculateTruePower } from '../mathEngine'
import {
  applyAnswer,
  createRun,
  generateCompareQuestion,
  generateEvaluateQuestion,
  generateQuestion,
  generateStrongerQuestion,
  generateWeakerQuestion,
  gradeLabel,
  pickEqualTruePowerPair,
} from './questionEngine'

describe('questionEngine', () => {
  const champion = HEROES[10]!

  it('creates a run with zero score', () => {
    const run = createRun(champion)
    expect(run.score).toBe(0)
    expect(run.streak).toBe(0)
    expect(run.round).toBe(1)
  })

  it('stronger questions pick unequal powers and mark the stronger hero', () => {
    for (let i = 0; i < 20; i += 1) {
      const q = generateStrongerQuestion()
      expect(q.type).toBe('stronger')
      expect(q.options).toHaveLength(2)
      expect(q.options.some((o) => o.id === 'equal')).toBe(false)
      expect(q.battle.winner).not.toBe('draw')
      expect(calculateTruePower(q.clashA.base, q.clashA.exponent)).not.toBe(
        calculateTruePower(q.clashB.base, q.clashB.exponent),
      )
      const battle = resolveTrueBattle(q.clashA, q.clashB)
      expect(q.battle.winner).toBe(battle.winner)
      if (battle.winner === 'a') {
        expect(q.correctOptionIds).toEqual(['left'])
      } else {
        expect(q.correctOptionIds).toEqual(['right'])
      }
    }
  })

  it('weaker questions pick unequal powers and mark the weaker hero', () => {
    for (let i = 0; i < 20; i += 1) {
      const q = generateWeakerQuestion()
      expect(q.type).toBe('weaker')
      expect(q.options).toHaveLength(2)
      expect(q.battle.winner).not.toBe('draw')
      const battle = resolveTrueBattle(q.clashA, q.clashB)
      if (battle.winner === 'a') {
        expect(q.correctOptionIds).toEqual(['right'])
      } else {
        expect(q.correctOptionIds).toEqual(['left'])
      }
    }
  })

  it('generateCompareQuestion aliases stronger (no equal pairs)', () => {
    const q = generateCompareQuestion(true)
    expect(q.type).toBe('stronger')
    expect(q.battle.winner).not.toBe('draw')
    expect(q.options).toHaveLength(2)
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

  it('can pick equal true-power hero pairs (for math checks, not quiz gen)', () => {
    const pair = pickEqualTruePowerPair()
    expect(pair).not.toBeNull()
    const [a, b] = pair!
    expect(a.id).not.toBe(b.id)
    expect(calculateTruePower(a.base, a.exponent)).toBe(calculateTruePower(b.base, b.exponent))
  })

  it('cycles only stronger → weaker → evaluate', () => {
    let state = createRun(champion)
    expect(generateQuestion(state).type).toBe('stronger')
    state = { ...state, round: 2 }
    expect(generateQuestion(state).type).toBe('weaker')
    state = { ...state, round: 3 }
    expect(generateQuestion(state).type).toBe('evaluate')
    state = { ...state, round: 4 }
    expect(generateQuestion(state).type).toBe('stronger')
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

  it('awards streak points on correct answers and resets on miss', () => {
    const q = generateStrongerQuestion()
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
