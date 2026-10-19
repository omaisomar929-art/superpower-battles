import type { Hero } from '../heroes/types'
import { HEROES, getRandomHeroes } from '../heroes/data'
import { calculatePower, formatExpression } from '../mathEngine'

/** Synthetic boss — drains powers toward the void (kid-friendly, not graphic). */
export const NULL_OVERLORD: Hero = {
  id: 'null-overlord',
  name: 'Null Overlord',
  base: 0,
  exponent: 0,
  power: 0,
  expression: formatExpression(0, 0),
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
}

/** Low-power void / weak minions for early waves. */
export function pickMinion(excludeIds: string[] = []): Hero {
  const voidPool = HEROES.filter(
    (h) =>
      (h.power <= 8 || h.visuals.aura === 'void') &&
      h.id !== NULL_OVERLORD.id &&
      !excludeIds.includes(h.id),
  )
  const pool = voidPool.length >= 2 ? voidPool : HEROES.filter((h) => !excludeIds.includes(h.id))
  const shuffled = [...pool].sort(() => Math.random() - 0.5)
  return shuffled[0] ?? HEROES[0]!
}

export function pickChampionPool(count = 8): Hero[] {
  return getRandomHeroes(count)
}

/** Ensure champion beats Null Overlord on stored game power when possible. */
export function ensureChampionCanClash(champion: Hero): Hero {
  if (champion.power > NULL_OVERLORD.power) return champion
  // Prefer a mid-power classic hero so the final clash is winnable on game rules
  const strong =
    HEROES.find((h) => h.power >= 16 && h.base >= 2 && h.exponent >= 2) ??
    HEROES.find((h) => calculatePower(h.base, h.exponent) > 0) ??
    champion
  return strong
}
