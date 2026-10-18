import { describe, expect, it } from 'vitest'
import { HEROES } from '../heroes/data'
import { resolveBattle } from '../battleEngine'
import {
  applyAnswer,
  createRun,
  generateCompareQuestion,
  generateIdentifyQuestion,
  generatePredictQuestion,
  generateQuestion,
  gradeLabel,
} from './questionEngine'

describe('questionEngine', () => {
  const champion = HEROES[10]!

  it('creates a run with zero score', () => {
    const run = createRun(champion)
    expect(run.score).toBe(0)
    expect(run.streak).toBe(0)
    expect(run.round).toBe(1)
  })

  it('compare questions mark the stronger expression correct', () => {
    const q = generateCompareQuestion()
    expect(q.type).toBe('compare')
    expect(q.options).toHaveLength(2)
    const battle = resolveBattle(q.clashA, q.clashB)
    expect(q.battle.winner).toBe(battle.winner)
    if (battle.winner === 'a') {
      expect(q.correctOptionIds).toEqual(['left'])
    } else if (battle.winner === 'b') {
      expect(q.correctOptionIds).toEqual(['right'])
    } else {
      expect(q.correctOptionIds).toEqual(['left', 'right'])
    }
  })

  it('identify questions have one correct expression for the subject', () => {
    const q = generateIdentifyQuestion(champion)
    expect(q.type).toBe('identify')
    expect(q.options.length).toBeGreaterThanOrEqual(2)
    expect(q.correctOptionIds).toEqual(['correct'])
    const correct = q.options.find((o) => o.id === 'correct')
    expect(correct?.label).toMatch(/[⁰¹²³⁴⁵⁶⁷⁸⁹]/)
  })

  it('predict questions match battle outcome', () => {
    const q = generatePredictQuestion()
    expect(q.type).toBe('predict')
    expect(q.options).toHaveLength(3)
    const expected =
      q.battle.winner === 'draw' ? 'draw' : q.battle.winner === 'a' ? 'a' : 'b'
    expect(q.correctOptionIds).toEqual([expected])
  })

  it('cycles question types by round', () => {
    let state = createRun(champion)
    expect(generateQuestion(state).type).toBe('compare')
    state = { ...state, round: 2 }
    expect(generateQuestion(state).type).toBe('identify')
    state = { ...state, round: 3 }
    expect(generateQuestion(state).type).toBe('predict')
  })

  it('awards streak points on correct answers and resets on miss', () => {
    const q = generateCompareQuestion()
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
    if (wrongId === correctId) {
      // draw-style compare where both are correct — skip miss branch
      expect(result.outcome.correct).toBe(true)
    } else {
      expect(result.outcome.correct).toBe(false)
      expect(result.outcome.chargedSide).toBe('rival')
      expect(result.state.streak).toBe(0)
    }
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
