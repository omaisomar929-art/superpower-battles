import { describe, expect, it } from 'vitest'
import { calculateTruePower, toExpandedForm } from '../mathEngine'
import {
  cometHitOk,
  createCometWave,
  createExpandRound,
  createLaserRound,
  createMeteorRound,
  createThunderPrompt,
  createVoidRound,
} from './engines'
import { isPerfectCube, isPerfectSquare, unequalPair } from './expressions'

describe('mini-game math', () => {
  it('uses true math for n⁰ = 1', () => {
    expect(calculateTruePower(5, 0)).toBe(1)
    expect(calculateTruePower(0, 0)).toBe(1)
    expect(calculateTruePower(2, 3)).toBe(8)
  })

  it('unequalPair never ties', () => {
    for (let i = 0; i < 20; i += 1) {
      const { a, b, stronger } = unequalPair()
      expect(a.value).not.toBe(b.value)
      expect(stronger === 'a' ? a.value > b.value : b.value > a.value).toBe(true)
    }
  })

  it('meteor round marks the true stronger side', () => {
    const round = createMeteorRound(1)
    const leftWins = round.left.value > round.right.value
    expect(round.stronger).toBe(leftWins ? 'left' : 'right')
  })

  it('comet wave tags only squares or only cubes as correct', () => {
    const wave = createCometWave(2)
    for (const item of wave.items) {
      const ok = wave.mode === 'squares' ? isPerfectSquare(item.value) : isPerfectCube(item.value)
      expect(item.correct).toBe(ok)
      expect(cometHitOk(wave.mode, item.value)).toBe(ok)
    }
    expect(wave.items.some((i) => i.correct)).toBe(true)
  })

  it('expand round has exactly one correct expanded form', () => {
    const round = createExpandRound(1)
    const correct = toExpandedForm(round.value)
    const hits = round.choices.filter((c) => c.correct)
    expect(hits).toHaveLength(1)
    expect(hits[0]!.label).toBe(correct)
  })

  it('void round marks only target-matching exprs correct', () => {
    const round = createVoidRound(2)
    for (const item of round.items) {
      expect(item.correct).toBe(item.expr.value === round.target)
    }
    expect(round.items.some((i) => i.correct)).toBe(true)
  })

  it('laser and thunder use true stronger/weaker', () => {
    const laser = createLaserRound(1)
    expect(laser.winner).toBe(laser.left.value > laser.right.value ? 'left' : 'right')

    const thunder = createThunderPrompt()
    if (thunder.kind === 'stronger') {
      expect(thunder.answer).toBe(thunder.left.value > thunder.right.value ? 'left' : 'right')
    } else {
      expect(thunder.answer).toBe(thunder.left.value < thunder.right.value ? 'left' : 'right')
    }
  })
})
