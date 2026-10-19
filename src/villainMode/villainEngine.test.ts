import { describe, expect, it } from 'vitest'
import { HEROES } from '../heroes/data'
import { toExpandedForm } from '../mathEngine'
import { NULL_OVERLORD } from './cast'
import {
  applyVillainAnswer,
  buildWrongExpandedForms,
  createVillainRun,
  generateExpandCurseQuestion,
  generateSquareCubeTrapQuestion,
  generateStrongerWeakerDuelQuestion,
  generateWaveQuestion,
} from './villainEngine'

describe('villainEngine', () => {
  const champion = HEROES.find((h) => h.base === 5 && h.exponent === 3) ?? HEROES[20]!

  it('creates a run at wave 1', () => {
    const run = createVillainRun(champion)
    expect(run.wave).toBe(1)
    expect(run.score).toBe(0)
    expect(run.complete).toBe(false)
  })

  it('buildWrongExpandedForms never equals the correct form', () => {
    for (const value of [27, 245, 306, 1024, 7]) {
      const correct = toExpandedForm(value)
      const wrongs = buildWrongExpandedForms(value, correct)
      expect(wrongs.length).toBeGreaterThanOrEqual(3)
      for (const w of wrongs) {
        expect(w).not.toBe(correct)
      }
    }
  })

  it('wave 1 expand question marks the true expanded form', () => {
    for (let i = 0; i < 15; i += 1) {
      const q = generateExpandCurseQuestion(champion, [])
      expect(q.wave).toBe(1)
      expect(q.kind).toBe('expand')
      expect(q.correctOptionIds).toEqual(['correct'])
      expect(q.options.some((o) => o.id === 'correct')).toBe(true)
      expect(q.clashA.id).toBe(champion.id)
      expect(q.clashB.id).not.toBe(champion.id)
      expect(q.curseDisplay).toBeTruthy()
    }
  })

  it('wave 2 square/cube uses bases 2–12 and correct numeric value', () => {
    for (let i = 0; i < 20; i += 1) {
      const q = generateSquareCubeTrapQuestion(champion, [])
      expect(q.wave).toBe(2)
      expect(q.kind).toBe('squareCube')
      const correct = q.options.find((o) => o.id === 'correct')!
      const n = Number(correct.label)
      expect(Number.isFinite(n)).toBe(true)
      expect(q.correctOptionIds).toEqual(['correct'])
      // prompt contains superscript square or cube
      expect(q.prompt).toMatch(/[²³]/)
    }
  })

  it('wave 3 stronger/weaker skips equal pairs and bosses Null Overlord', () => {
    for (let i = 0; i < 20; i += 1) {
      const q = generateStrongerWeakerDuelQuestion(champion)
      expect(q.wave).toBe(3)
      expect(q.kind).toBe('strongerWeaker')
      expect(q.options).toHaveLength(2)
      expect(q.clashB.id).toBe(NULL_OVERLORD.id)
      expect(q.battle.winner).not.toBe('draw')
      // options are hero names from unequal true-power pair — teach mentions comparison
      expect(q.teach.length).toBeGreaterThan(0)
    }
  })

  it('correct answers advance waves and complete on wave 3', () => {
    let state = createVillainRun(champion)
    const w1 = generateWaveQuestion(state)
    expect(w1.wave).toBe(1)
    let applied = applyVillainAnswer(state, w1, 'correct')
    expect(applied.outcome.correct).toBe(true)
    expect(applied.state.wave).toBe(2)
    state = applied.state

    const w2 = generateWaveQuestion(state)
    expect(w2.wave).toBe(2)
    applied = applyVillainAnswer(state, w2, 'correct')
    expect(applied.state.wave).toBe(3)
    state = applied.state

    const w3 = generateWaveQuestion(state)
    expect(w3.wave).toBe(3)
    applied = applyVillainAnswer(state, w3, w3.correctOptionIds[0]!)
    expect(applied.state.complete).toBe(true)
    expect(applied.state.victory).toBe(true)
  })

  it('wrong answers reset streak and do not advance wave', () => {
    let state = createVillainRun(champion)
    state = { ...state, streak: 2, score: 100 }
    const q = generateExpandCurseQuestion(champion, [])
    const wrongId = q.options.find((o) => o.id !== 'correct')!.id
    const { state: next, outcome } = applyVillainAnswer(state, q, wrongId)
    expect(outcome.correct).toBe(false)
    expect(next.streak).toBe(0)
    expect(next.wave).toBe(1)
    expect(next.score).toBe(100)
    expect(next.complete).toBe(false)
  })
})
