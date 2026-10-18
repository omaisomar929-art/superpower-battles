import type { Hero } from '../heroes/types'
import { getAbilityFx, type AbilityFamily } from './abilityFx'

/** Motion recipe for a seeded victory dance — stable per hero. */
export type DanceStyle =
  | 'bounce'
  | 'spin'
  | 'pulse'
  | 'hop'
  | 'swirl'
  | 'flex'
  | 'orbit'
  | 'quake'

export interface VictoryDanceParams {
  style: DanceStyle
  /** Overall motion amplitude (higher power → bigger dance). */
  intensity: number
  /** Bounce / hop height in px. */
  bouncePx: number
  /** Spin degrees per cycle. */
  spinDeg: number
  /** Aura pulse scale peak. */
  auraScale: number
  /** Color trail particle count. */
  trailCount: number
  /** Seconds per dance loop. */
  duration: number
  /** CSS trail colors (main → secondary → accent). */
  trailColors: [string, string, string]
  family: AbilityFamily
  seed: number
}

const STYLES: DanceStyle[] = ['bounce', 'spin', 'pulse', 'hop', 'swirl', 'flex', 'orbit', 'quake']

const FAMILY_STYLE_BIAS: Record<AbilityFamily, DanceStyle[]> = {
  fire: ['bounce', 'flex', 'pulse', 'hop'],
  void: ['swirl', 'orbit', 'pulse', 'spin'],
  ice: ['pulse', 'orbit', 'flex', 'spin'],
  lightning: ['hop', 'bounce', 'quake', 'flex'],
  cosmic: ['orbit', 'spin', 'swirl', 'pulse'],
  shadow: ['swirl', 'pulse', 'orbit', 'flex'],
  earth: ['quake', 'flex', 'bounce', 'pulse'],
  wind: ['spin', 'swirl', 'hop', 'orbit'],
  plasma: ['pulse', 'bounce', 'spin', 'flex'],
  crystal: ['orbit', 'pulse', 'flex', 'spin'],
}

function hashId(id: string): number {
  let h = 2166136261
  for (let i = 0; i < id.length; i += 1) {
    h ^= id.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return h >>> 0
}

/** Map power into a smooth 0.55–1.85 intensity band (log-ish). */
export function powerToIntensity(power: number): number {
  if (!Number.isFinite(power) || power <= 0) return 0.55
  const log = Math.log10(Math.max(1, power))
  // 0⁰→~0.55, 10⁵→~1.85
  return Math.min(1.85, 0.55 + log * 0.26)
}

/**
 * Seed-stable victory dance params from hero id, power, colors, and ability family.
 * Same hero always yields the same dance; different heroes diverge.
 */
export function getVictoryDance(hero: Hero): VictoryDanceParams {
  const fx = getAbilityFx(hero)
  const seed = (hashId(hero.id) ^ Math.imul(hero.base + 1, 2654435761) ^ (hero.exponent * 97)) >>> 0
  const intensity = powerToIntensity(hero.power)
  const familyStyles = FAMILY_STYLE_BIAS[fx.family]
  const style =
    familyStyles[(seed + Math.floor(intensity * 10)) % familyStyles.length] ??
    STYLES[seed % STYLES.length]!

  const bouncePx = Math.round(10 + intensity * 22 + (seed % 8))
  const spinDeg = 120 + (seed % 240) + Math.round(intensity * 40)
  const auraScale = 1.15 + intensity * 0.45 + ((seed % 20) / 100)
  const trailCount = Math.min(16, Math.round(5 + intensity * 5 + (seed % 4)))
  const duration = Math.max(0.45, 0.85 - intensity * 0.12 + ((seed % 15) / 100))

  return {
    style,
    intensity,
    bouncePx,
    spinDeg,
    auraScale,
    trailCount,
    duration,
    trailColors: [hero.mainColor, hero.secondaryColor, hero.accentColor],
    family: fx.family,
    seed,
  }
}
