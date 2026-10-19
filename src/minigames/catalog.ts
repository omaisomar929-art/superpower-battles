import type { MiniGameId, MiniGameMeta } from './types'

export const MINI_GAMES: MiniGameMeta[] = [
  {
    id: 'meteor',
    title: 'Power Meteor Shower',
    tagline: 'Tap the stronger',
    blurb: 'Expressions rain from the sky. Tap the stronger power before impact — miss and the city takes a hit.',
    accent: '#38bdf8',
    accentSoft: 'rgba(56,189,248,0.18)',
  },
  {
    id: 'cube-comets',
    title: 'Cube Comets',
    tagline: 'Squares & cubes',
    blurb: 'A rain of values. The wave prompt tells you: tap only true squares, or only true cubes.',
    accent: '#a78bfa',
    accentSoft: 'rgba(167,139,250,0.18)',
  },
  {
    id: 'expand-asteroids',
    title: 'Expand Asteroids',
    tagline: 'Expanded form',
    blurb: 'A number appears. Smash the asteroid shard with the correct place-value expanded form before timeout.',
    accent: '#fbbf24',
    accentSoft: 'rgba(251,191,36,0.16)',
  },
  {
    id: 'void-pull',
    title: 'Void Black-Hole Pull',
    tagline: 'Save the target',
    blurb: 'Numbers spiral toward the void. Rescue only those that equal the target power (e.g. = 64).',
    accent: '#f472b6',
    accentSoft: 'rgba(244,114,182,0.16)',
  },
  {
    id: 'laser-lattice',
    title: 'Laser Lattice',
    tagline: 'Beam duel',
    blurb: 'Two power beams race to collide. Pick which expression wins before they smash.',
    accent: '#34d399',
    accentSoft: 'rgba(52,211,153,0.16)',
  },
  {
    id: 'thunder',
    title: 'Thunder Round',
    tagline: 'Blitz high score',
    blurb: 'Timed stronger / weaker blitz. Answer fast — chain streak for a thunder score.',
    accent: '#fb923c',
    accentSoft: 'rgba(251,146,60,0.16)',
  },
]

export function getMiniGame(id: string | undefined): MiniGameMeta | undefined {
  return MINI_GAMES.find((g) => g.id === id)
}

export function isMiniGameId(id: string): id is MiniGameId {
  return MINI_GAMES.some((g) => g.id === id)
}
