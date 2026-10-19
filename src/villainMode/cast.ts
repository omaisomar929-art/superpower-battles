import type { Hero } from '../heroes/types'
import { HEROES, getRandomHeroes } from '../heroes/data'
import { calculatePower, formatExpression } from '../mathEngine'
import type { EvilDanceStyle } from '../animations/evilDanceStyles'

export type VillainDifficulty = 'easy' | 'medium' | 'hard' | 'ultraHard'

export interface VillainProfile {
  id: string
  difficulty: VillainDifficulty
  /** UI badge, e.g. Easy / UltraHard */
  difficultyLabel: string
  blurb: string
  /** Distinct dark motion recipe for evil victory dance. */
  evilDanceStyle: EvilDanceStyle
  /** Theme tokens for selection / arena chrome. */
  theme: {
    glow: string
    border: string
    badge: string
    panel: string
  }
  hero: Hero
}

function makeVillainHero(
  partial: Omit<Hero, 'power' | 'expression'> & { power?: number },
): Hero {
  const power = partial.power ?? calculatePower(partial.base, partial.exponent)
  return {
    ...partial,
    power,
    expression: formatExpression(partial.base, partial.exponent),
  }
}

/** Easy — soft slate drain, beginner gauntlet. */
export const GLOOM_GLYPH: Hero = makeVillainHero({
  id: 'gloom-glyph',
  name: 'Gloom Glyph',
  base: 0,
  exponent: 0,
  power: 0,
  mainColor: '#94a3b8',
  secondaryColor: '#334155',
  accentColor: '#0f172a',
  costume: 'Ink-stained cloak with floating slate runes',
  signatureAttack: 'Soft Drain',
  defensiveAbility: 'Mist Glyph',
  fightingStyle: 'mystic',
  victoryAnimation: 'scrawls a fading zero that swallows the light',
  defeatAnimation: 'runes smudge and the mist clears',
  visualEffect: 'drifting ash numerals',
  visuals: {
    silhouette: 'cloak',
    weapon: 'staff',
    mask: 'half',
    cape: true,
    horns: false,
    aura: 'shadow',
  },
  tagline: 'A shy void scribe who scribbles powers down — gently.',
})

/** Medium — toxic hex void. */
export const HEX_HOLLOW: Hero = makeVillainHero({
  id: 'hex-hollow',
  name: 'Hex Hollow',
  base: 0,
  exponent: 0,
  power: 0,
  mainColor: '#86efac',
  secondaryColor: '#14532d',
  accentColor: '#022c22',
  costume: 'Cracked hex-plate armor leaking green voidlight',
  signatureAttack: 'Hex Siphon',
  defensiveAbility: 'Hollow Lattice',
  fightingStyle: 'assassin',
  victoryAnimation: 'locks the arena in a sickly green hex',
  defeatAnimation: 'hex plates shatter into harmless sparks',
  visualEffect: 'toxic lattice ripples',
  visuals: {
    silhouette: 'armor',
    weapon: 'blade',
    mask: 'visor',
    cape: false,
    horns: true,
    aura: 'void',
  },
  tagline: 'Cracks every digit into a hollow hex — then drinks the gap.',
})

/** Hard — classic violet void boss (kept from original Villain Mode). */
export const NULL_OVERLORD: Hero = makeVillainHero({
  id: 'null-overlord',
  name: 'Null Overlord',
  base: 0,
  exponent: 0,
  power: 0,
  mainColor: '#c4b5fd',
  secondaryColor: '#312e81',
  accentColor: '#020617',
  costume: 'Void-crown armor with a hollow zero crest',
  signatureAttack: 'Null Drain',
  defensiveAbility: 'Void Shield',
  fightingStyle: 'mystic',
  victoryAnimation: 'folds the arena into a gentle empty circle',
  defeatAnimation: 'crown cracks and light returns to the digits',
  visualEffect: 'soft void ripples',
  visuals: {
    silhouette: 'robe',
    weapon: 'orb',
    mask: 'hood',
    cape: true,
    horns: true,
    aura: 'void',
  },
  tagline: 'The overlord who drains every power toward zero — until math fights back.',
})

/** UltraHard — deepest crimson abyss challenge. */
export const ABYSS_ARCHITECT: Hero = makeVillainHero({
  id: 'abyss-architect',
  name: 'Abyss Architect',
  base: 0,
  exponent: 0,
  power: 0,
  mainColor: '#fda4af',
  secondaryColor: '#7f1d1d',
  accentColor: '#1c1917',
  costume: 'Obsidian blueprint cloak with crimson zero compasses',
  signatureAttack: 'Blueprint Void',
  defensiveAbility: 'Abyss Vault',
  fightingStyle: 'guardian',
  victoryAnimation: 'redraws the arena as a collapsing blue-print of nothing',
  defeatAnimation: 'compasses spin wild then freeze into stars',
  visualEffect: 'crimson draft lines tearing into the void',
  visuals: {
    silhouette: 'robe',
    weapon: 'orb',
    mask: 'full',
    cape: true,
    horns: true,
    aura: 'plasma',
  },
  tagline: 'Drafts the hardest voids — grade-6 stretch math that still plays fair.',
})

export const VILLAINS: VillainProfile[] = [
  {
    id: 'gloom-glyph',
    difficulty: 'easy',
    difficultyLabel: 'Easy',
    blurb: 'Simpler expanded forms, small squares & cubes, clear stronger/weaker.',
    evilDanceStyle: 'sink',
    theme: {
      glow: 'rgba(148,163,184,0.28)',
      border: 'border-slate-400/35',
      badge: 'bg-slate-500/30 text-slate-100',
      panel: 'from-slate-900/80 to-slate-950/90',
    },
    hero: GLOOM_GLYPH,
  },
  {
    id: 'hex-hollow',
    difficulty: 'medium',
    difficultyLabel: 'Medium',
    blurb: 'Trickier numbers, messier compares, mid-range powers.',
    evilDanceStyle: 'shatter',
    theme: {
      glow: 'rgba(134,239,172,0.22)',
      border: 'border-emerald-400/35',
      badge: 'bg-emerald-600/35 text-emerald-100',
      panel: 'from-emerald-950/80 to-slate-950/90',
    },
    hero: HEX_HOLLOW,
  },
  {
    id: 'null-overlord',
    difficulty: 'hard',
    difficultyLabel: 'Hard',
    blurb: 'Larger powers, multi-step thinking, closer values.',
    evilDanceStyle: 'eclipse',
    theme: {
      glow: 'rgba(196,181,253,0.28)',
      border: 'border-violet-400/35',
      badge: 'bg-violet-600/35 text-violet-100',
      panel: 'from-violet-950/80 to-slate-950/90',
    },
    hero: NULL_OVERLORD,
  },
  {
    id: 'abyss-architect',
    difficulty: 'ultraHard',
    difficultyLabel: 'UltraHard',
    blurb: 'Toughest grade-6 stretch — still fair, never impossible.',
    evilDanceStyle: 'loom',
    theme: {
      glow: 'rgba(253,164,175,0.25)',
      border: 'border-rose-400/40',
      badge: 'bg-rose-700/40 text-rose-100',
      panel: 'from-rose-950/85 to-stone-950/95',
    },
    hero: ABYSS_ARCHITECT,
  },
]

export function getVillainById(id: string): VillainProfile | undefined {
  return VILLAINS.find((v) => v.id === id)
}

export function getVillainByDifficulty(difficulty: VillainDifficulty): VillainProfile {
  return VILLAINS.find((v) => v.difficulty === difficulty) ?? VILLAINS[0]!
}

/** All synthetic boss ids — exclude from minion / champion pools. */
export const VILLAIN_IDS = VILLAINS.map((v) => v.id)

/** Low-power void / weak minions for early waves. */
export function pickMinion(excludeIds: string[] = []): Hero {
  const banned = new Set([...excludeIds, ...VILLAIN_IDS])
  const voidPool = HEROES.filter(
    (h) => (h.power <= 8 || h.visuals.aura === 'void') && !banned.has(h.id),
  )
  const pool = voidPool.length >= 2 ? voidPool : HEROES.filter((h) => !banned.has(h.id))
  const shuffled = [...pool].sort(() => Math.random() - 0.5)
  return shuffled[0] ?? HEROES[0]!
}

export function pickChampionPool(count = 8): Hero[] {
  return getRandomHeroes(count, VILLAIN_IDS)
}

/** Ensure champion beats the chosen villain on stored game power when possible. */
export function ensureChampionCanClash(champion: Hero, villain: Hero = NULL_OVERLORD): Hero {
  if (champion.power > villain.power) return champion
  const strong =
    HEROES.find((h) => h.power >= 16 && h.base >= 2 && h.exponent >= 2) ??
    HEROES.find((h) => calculatePower(h.base, h.exponent) > villain.power) ??
    champion
  return strong
}
