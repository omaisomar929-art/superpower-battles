import { HEROES, getRandomHeroes } from '../heroes/data'
import type { Hero } from '../heroes/types'
import { resolveBattle, type BattleResult } from '../battleEngine'

export type BracketSize = 4 | 8 | 16 | 32

export interface TournamentMatch {
  id: string
  round: number
  slot: number
  fighterA: Hero | null
  fighterB: Hero | null
  bye: boolean
  result: BattleResult | null
  winner: Hero | null
}

export interface TournamentState {
  size: BracketSize
  participants: Hero[]
  matches: TournamentMatch[]
  champion: Hero | null
  drawRule: 'replay' | 'shared'
}

function nextPowerOfTwo(n: number): BracketSize {
  if (n <= 4) return 4
  if (n <= 8) return 8
  if (n <= 16) return 16
  return 32
}

export function createTournament(
  selected: Hero[],
  options?: { size?: BracketSize; randomFill?: boolean; drawRule?: 'replay' | 'shared' },
): TournamentState {
  const drawRule = options?.drawRule ?? 'replay'
  let participants = [...selected]

  if (options?.randomFill || participants.length === 0) {
    const needed = options?.size ?? 8
    const existing = new Set(participants.map((h) => h.id))
    const fillers = getRandomHeroes(needed, [...existing]).slice(0, Math.max(0, needed - participants.length))
    participants = [...participants, ...fillers].slice(0, needed)
  }

  const size = options?.size ?? nextPowerOfTwo(Math.max(participants.length, 4))
  participants = participants.slice(0, size)

  while (participants.length < size) {
    const fillers = getRandomHeroes(1, participants.map((h) => h.id))
    if (fillers[0]) participants.push(fillers[0])
    else break
  }

  const matches: TournamentMatch[] = []
  const roundCount = Math.log2(size)
  let previousWinners: (Hero | null)[] = participants

  for (let round = 1; round <= roundCount; round += 1) {
    const roundMatches: TournamentMatch[] = []
    for (let slot = 0; slot < previousWinners.length / 2; slot += 1) {
      const fighterA = previousWinners[slot * 2] ?? null
      const fighterB = previousWinners[slot * 2 + 1] ?? null
      const bye = Boolean(fighterA && !fighterB) || Boolean(!fighterA && fighterB)
      let winner: Hero | null = null
      let result: BattleResult | null = null

      if (bye) {
        winner = fighterA ?? fighterB
      } else if (fighterA && fighterB) {
        result = resolveBattle(fighterA, fighterB)
        if (result.winner === 'draw') {
          winner = drawRule === 'shared' ? fighterA : resolveReplay(fighterA, fighterB)
          if (drawRule === 'replay' && winner) {
            result = resolveBattle(fighterA, fighterB)
            // After replay still draw → higher base then higher exponent
            if (result.winner === 'draw') {
              winner = tieBreak(fighterA, fighterB)
            } else {
              winner = result.winnerHero
            }
          }
        } else {
          winner = result.winnerHero
        }
      }

      roundMatches.push({
        id: `r${round}-s${slot}`,
        round,
        slot,
        fighterA,
        fighterB,
        bye,
        result,
        winner,
      })
    }
    matches.push(...roundMatches)
    previousWinners = roundMatches.map((m) => m.winner)
  }

  const champion = matches.filter((m) => m.round === roundCount).at(-1)?.winner ?? null

  return { size, participants, matches, champion, drawRule }
}

function resolveReplay(a: Hero, b: Hero): Hero {
  // Deterministic "replay" preference: higher base, then higher exponent
  return tieBreak(a, b)
}

function tieBreak(a: Hero, b: Hero): Hero {
  if (a.base !== b.base) return a.base > b.base ? a : b
  if (a.exponent !== b.exponent) return a.exponent > b.exponent ? a : b
  return a.id < b.id ? a : b
}

export function fullRosterTournament(size: BracketSize = 32): TournamentState {
  return createTournament(HEROES.slice(0, size), { size, drawRule: 'replay' })
}

export function getRoundMatches(state: TournamentState, round: number): TournamentMatch[] {
  return state.matches.filter((m) => m.round === round)
}
