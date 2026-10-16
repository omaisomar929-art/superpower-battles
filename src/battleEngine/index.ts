import type { Hero } from '../heroes/types'
import { explainComparison } from '../mathEngine'

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

export function resolveBattle(fighterA: Hero, fighterB: Hero): BattleResult {
  const powerA = fighterA.power
  const powerB = fighterB.power
  const explanation = explainComparison(
    fighterA.base,
    fighterA.exponent,
    fighterB.base,
    fighterB.exponent,
  )

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

export function canFight(fighterA: Hero | null, fighterB: Hero | null, mirrorMode = false): boolean {
  if (!fighterA || !fighterB) return false
  if (!mirrorMode && fighterA.id === fighterB.id) return false
  return true
}
