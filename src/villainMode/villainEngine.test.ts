import { describe, expect, it } from 'vitest'
import { HEROES } from '../heroes/data'
import { toExpandedForm } from '../mathEngine'
import { NULL_OVERLORD, VILLAINS, getVillainByDifficulty } from './cast'
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
  const hard = getVillainByDifficulty('hard')

  it('exposes four unique villains with distinct difficulties', () => {
    expect(VILLAINS).toHaveLength(4)
    const diffs = new Set(VILLAINS.map((v) => v.difficulty))
    expect(diffs.size).toBe(4)
    const names = new Set(VILLAINS.map((v) => v.hero.name))
    expect(names.size).toBe(4)
    expect(names.has('Null Overlord')).toBe(true)
  })

  it('creates a run at wave 1 with the chosen villain', () => {
    const run = createVillainRun(champion, hard)
    expect(run.wave).toBe(1)
    expect(run.score).toBe(0)
    expect(run.complete).toBe(false)
    expect(run.villain.id).toBe(hard.id)
  })

  it('buildWrongExpandedForms never equals the correct form', () => {
    for (const value of [27, 245, 306, 1024, 7, 5007]) {
      const correct = toExpandedForm(value)
      const wrongs = buildWrongExpandedForms(value, correct)
      expect(wrongs.length).toBeGreaterThanOrEqual(3)
      for (const w of wrongs) {
        expect(w).not.toBe(correct)
      }
    }
  })

  it('wave 1 expand question marks the true expanded form', () => {
    for (const villain of VILLAINS) {
      for (let i = 0; i < 5; i += 1) {
        const q = generateExpandCurseQuestion(champion, villain, [])
        expect(q.wave).toBe(1)
        expect(q.kind).toBe('expand')
        expect(q.correctOptionIds).toEqual(['correct'])
        expect(q.options.some((o) => o.id === 'correct')).toBe(true)
        expect(q.clashA.id).toBe(champion.id)
        expect(q.clashB.id).not.toBe(champion.id)
        expect(q.curseDisplay).toBeTruthy()
        expect(q.prompt).toContain(villain.hero.name)
      }
    }
  })

  it('wave 2 square/cube scales bases by difficulty', () => {
    const easy = getVillainByDifficulty('easy')
    const ultra = getVillainByDifficulty('ultraHard')

    for (let i = 0; i < 15; i += 1) {
      const q = generateSquareCubeTrapQuestion(champion, easy, [])
      expect(q.wave).toBe(2)
      expect(q.kind).toBe('squareCube')
      const correct = q.options.find((o) => o.id === 'correct')!
      const n = Number(correct.label)
      expect(Number.isFinite(n)).toBe(true)
      expect(q.prompt).toMatch(/[²³]/)
      // Easy stays in smaller result band
      expect(n).toBeLessThanOrEqual(1000)
    }

    let sawLarge = false
    for (let i = 0; i < 25; i += 1) {
      const q = generateSquareCubeTrapQuestion(champion, ultra, [])
      const correct = q.options.find((o) => o.id === 'correct')!
      const n = Number(correct.label)
      if (n >= 1000) sawLarge = true
      expect(q.correctOptionIds).toEqual(['correct'])
    }
    expect(sawLarge).toBe(true)
  })

  it('wave 3 stronger/weaker bosses the chosen villain', () => {
    for (const villain of VILLAINS) {
      for (let i = 0; i < 8; i += 1) {
        const q = generateStrongerWeakerDuelQuestion(champion, villain)
        expect(q.wave).toBe(3)
        expect(q.kind).toBe('strongerWeaker')
        expect(q.options).toHaveLength(2)
        expect(q.clashB.id).toBe(villain.hero.id)
        expect(q.battle.winner).not.toBe('draw')
        expect(q.teach.length).toBeGreaterThan(0)
      }
    }
  })

  it('hard Null Overlord remains the classic boss id', () => {
    expect(hard.hero.id).toBe(NULL_OVERLORD.id)
  })

  it('correct answers advance waves and complete on wave 3', () => {
    let state = createVillainRun(champion, hard)
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
    let state = createVillainRun(champion, hard)
    state = { ...state, streak: 2, score: 100 }
    const q = generateExpandCurseQuestion(champion, hard, [])
    const wrongId = q.options.find((o) => o.id !== 'correct')!.id
    const { state: next, outcome } = applyVillainAnswer(state, q, wrongId)
    expect(outcome.correct).toBe(false)
    expect(next.streak).toBe(0)
    expect(next.wave).toBe(1)
    expect(next.score).toBe(100)
    expect(next.complete).toBe(false)
  })

  it('ultraHard scoring awards a difficulty bonus on correct answers', () => {
    const ultra = getVillainByDifficulty('ultraHard')
    const state = createVillainRun(champion, ultra)
    const q = generateExpandCurseQuestion(champion, ultra, [])
    const { state: next } = applyVillainAnswer(state, q, 'correct')
    const hardState = createVillainRun(champion, hard)
    const hq = generateExpandCurseQuestion(champion, hard, [])
    const { state: hardNext } = applyVillainAnswer(hardState, hq, 'correct')
    expect(next.score).toBeGreaterThan(hardNext.score)
  })
})
