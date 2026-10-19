import type { Hero } from '../heroes/types'
import type { EvilDanceStyle } from './evilDanceStyles'
import { EVIL_DANCE_STYLES } from './evilDanceStyles'

export type { EvilDanceStyle } from './evilDanceStyles'

/** Motion recipe for a seeded evil victory dance — stable per villain. */
export interface EvilDanceParams {
  style: EvilDanceStyle
  intensity: number
  bouncePx: number
  spinDeg: number
  auraScale: number
  trailCount: number
  duration: number
  trailColors: [string, string, string]
  seed: number
  /** Darker label shown under the dance. */
  caption: string
}

function hashId(id: string): number {
  let h = 2166136261
  for (let i = 0; i < id.length; i += 1) {
    h ^= id.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return h >>> 0
}

const STYLE_CAPTIONS: Record<EvilDanceStyle, string> = {
  sink: 'Void sink',
  cackle: 'Cackle shake',
  eclipse: 'Eclipse pulse',
  crush: 'Crush quake',
  spiral: 'Dark spiral',
  loom: 'Abyss loom',
  shatter: 'Hex shatter',
  drain: 'Power drain',
}

/**
 * Seed-stable evil victory dance. Prefer an explicit style (per villain profile);
 * otherwise derive from villain id so each boss stays distinct.
 */
export function getEvilVictoryDance(
  villain: Hero,
  preferredStyle?: EvilDanceStyle,
): EvilDanceParams {
  const seed =
    (hashId(villain.id) ^ Math.imul(villain.base + 3, 2654435761) ^ (villain.exponent * 131)) >>> 0
  const style =
    preferredStyle ??
    EVIL_DANCE_STYLES[seed % EVIL_DANCE_STYLES.length]!

  // Villains are low/zero power — keep intensity cinematic via seed, not power.
  const intensity = 1.05 + ((seed % 40) / 100)
  const bouncePx = Math.round(14 + intensity * 18 + (seed % 10))
  const spinDeg = 100 + (seed % 200) + Math.round(intensity * 50)
  const auraScale = 1.25 + intensity * 0.4 + ((seed % 15) / 100)
  const trailCount = Math.min(18, Math.round(7 + intensity * 4 + (seed % 5)))
  const duration = Math.max(0.5, 0.72 + ((seed % 20) / 100))

  return {
    style,
    intensity,
    bouncePx,
    spinDeg,
    auraScale,
    trailCount,
    duration,
    trailColors: [villain.mainColor, villain.secondaryColor, villain.accentColor],
    seed,
    caption: STYLE_CAPTIONS[style],
  }
}
