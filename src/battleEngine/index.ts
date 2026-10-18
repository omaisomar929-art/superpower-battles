import type { Hero } from '../heroes/types'
import {
  calculateTruePower,
  explainComparison,
  explainTrueComparison,
} from '../mathEngine'

export type BattleOutcome = 'a' | 'b' | 'draw'

export interface BattleResult {
  fighterA: Hero
  fighterB: Hero
  winner: BattleOutcome
  winnerHero: Hero | null
  loserHero: Hero | null
  explanation: string
  powerA: number
  powerB: number
  expressionA: string
  expressionB: string
}

function buildBattleResult(
  fighterA: Hero,
  fighterB: Hero,
  powerA: number,
  powerB: number,
  explanation: string,
): BattleResult {
  if (powerA > powerB) {
    return {
      fighterA,
      fighterB,
      winner: 'a',
      winnerHero: fighterA,
      loserHero: fighterB,
      explanation,
      powerA,
      powerB,
      expressionA: fighterA.expression,
      expressionB: fighterB.expression,
    }
  }

  if (powerB > powerA) {
    return {
      fighterA,
      fighterB,
      winner: 'b',
      winnerHero: fighterB,
      loserHero: fighterA,
      explanation,
      powerA,
      powerB,
      expressionA: fighterA.expression,
      expressionB: fighterB.expression,
    }
  }

  return {
    fighterA,
    fighterB,
    winner: 'draw',
    winnerHero: null,
    loserHero: null,
    explanation,
    powerA,
    powerB,
    expressionA: fighterA.expression,
    expressionB: fighterB.expression,
  }
}

/** Arena / Versus: uses stored hero.power (void n⁰ → game 0). */
export function resolveBattle(fighterA: Hero, fighterB: Hero): BattleResult {
  const powerA = fighterA.power
  const powerB = fighterB.power
  const explanation = explainComparison(
    fighterA.base,
    fighterA.exponent,
    fighterB.base,
    fighterB.exponent,
  )
  return buildBattleResult(fighterA, fighterB, powerA, powerB, explanation)
}

/**
 * Question Mode: compare with true mathematical base^exponent
 * (n⁰ = 1), ignoring the void combat override.
 */
export function resolveTrueBattle(fighterA: Hero, fighterB: Hero): BattleResult {
  const powerA = calculateTruePower(fighterA.base, fighterA.exponent)
  const powerB = calculateTruePower(fighterB.base, fighterB.exponent)
  const explanation = explainTrueComparison(
    fighterA.base,
    fighterA.exponent,
    fighterB.base,
    fighterB.exponent,
  )
  return buildBattleResult(fighterA, fighterB, powerA, powerB, explanation)
}

export function canFight(fighterA: Hero | null, fighterB: Hero | null, mirrorMode = false): boolean {
  if (!fighterA || !fighterB) return false
  if (!mirrorMode && fighterA.id === fighterB.id) return false
  return true
}
