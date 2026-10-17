import type { ElementTheme, Hero } from '../heroes/types'
import { isPowerZeroVoid } from '../heroes/data'

/** Visual family for signature ability VFX (original names — no trademarked moves). */
export type AbilityFamily =
  | 'fire'
  | 'void'
  | 'ice'
  | 'lightning'
  | 'cosmic'
  | 'shadow'
  | 'earth'
  | 'wind'
  | 'plasma'
  | 'crystal'

export type AbilityShape =
  | 'stream'
  | 'cone'
  | 'beam'
  | 'orb'
  | 'spiral'
  | 'burst'
  | 'shards'
  | 'bolts'
  | 'wave'
  | 'ribbon'

export type AbilityCue =
  | 'ability-fire'
  | 'ability-void'
  | 'ability-ice'
  | 'ability-lightning'
  | 'ability-cosmic'
  | 'ability-shadow'
  | 'ability-earth'
  | 'ability-wind'
  | 'ability-plasma'
  | 'ability-crystal'

export interface AbilityFx {
  family: AbilityFamily
  /** Original display name derived from signatureAttack / theme */
  label: string
  primary: string
  secondary: string
  accent: string
  shape: AbilityShape
  particleCount: number
  beamWidth: number
  spiralTightness: number
  dashIntensity: number
  windupScale: number
  seed: number
  cue: AbilityCue
}

const FAMILY_CUE: Record<AbilityFamily, AbilityCue> = {
  fire: 'ability-fire',
  void: 'ability-void',
  ice: 'ability-ice',
  lightning: 'ability-lightning',
  cosmic: 'ability-cosmic',
  shadow: 'ability-shadow',
  earth: 'ability-earth',
  wind: 'ability-wind',
  plasma: 'ability-plasma',
  crystal: 'ability-crystal',
}

const AURA_FAMILY: Record<ElementTheme, AbilityFamily> = {
  fire: 'fire',
  ice: 'ice',
  lightning: 'lightning',
  shadow: 'shadow',
  light: 'cosmic',
  earth: 'earth',
  wind: 'wind',
  void: 'void',
  plasma: 'plasma',
  crystal: 'crystal',
}

const FALLBACK_LABELS: Record<AbilityFamily, string[]> = {
  fire: ['Ember Stream', 'Flame Breath', 'Cinder Lance', 'Inferno Fan'],
  void: ['Null Spiral', 'Void Swirl', 'Black Orbit', 'Axiom Collapse'],
  ice: ['Frost Beam', 'Shard Volley', 'Glacier Spike', 'Rime Arc'],
  lightning: ['Arc Bolt', 'Storm Needle', 'Volt Cascade', 'Spark Fork'],
  cosmic: ['Nova Wave', 'Solar Crest', 'Star Lance', 'Aurora Pulse'],
  shadow: ['Umbral Ribbon', 'Night Slash', 'Shade Coil', 'Dusk Fang'],
  earth: ['Quake Burst', 'Stone Halo', 'Fault Spike', 'Granite Crash'],
  wind: ['Gale Slash', 'Zephyr Cut', 'Cyclone Edge', 'Draft Spiral'],
  plasma: ['Plasma Lance', 'Ion Ribbon', 'Fusion Arc', 'Chromatic Jet'],
  crystal: ['Prism Shards', 'Facet Beam', 'Lattice Burst', 'Crystal Fan'],
}

const SHAPES_BY_FAMILY: Record<AbilityFamily, AbilityShape[]> = {
  fire: ['stream', 'cone', 'wave', 'burst'],
  void: ['spiral', 'orb', 'ribbon', 'burst'],
  ice: ['shards', 'beam', 'cone', 'burst'],
  lightning: ['bolts', 'beam', 'ribbon', 'burst'],
  cosmic: ['beam', 'wave', 'orb', 'burst'],
  shadow: ['ribbon', 'spiral', 'stream', 'burst'],
  earth: ['burst', 'orb', 'wave', 'shards'],
  wind: ['stream', 'spiral', 'ribbon', 'wave'],
  plasma: ['beam', 'stream', 'orb', 'wave'],
  crystal: ['shards', 'beam', 'burst', 'cone'],
}

function hashId(id: string): number {
  let h = 2166136261
  for (let i = 0; i < id.length; i += 1) {
    h ^= id.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return h >>> 0
}

function pick<T>(list: T[], seed: number, salt: number): T {
  return list[(seed + salt * 17) % list.length]!
}

function isGoldCosmic(hero: Hero): boolean {
  const colors = `${hero.mainColor}${hero.secondaryColor}${hero.accentColor}`.toLowerCase()
  return /fbbf24|f59e0b|eab308|fde047|ffd700|amber|gold|#fef/.test(colors) || hero.visuals.aura === 'light'
}

function familyFromAttack(text: string): AbilityFamily | null {
  const t = text.toLowerCase()
  // Strong elemental cues only (avoid weak words stealing themes)
  if (/void|null.?spiral|undefined|vacuum|axiom.?null|black.?orbit/.test(t)) return 'void'
  if (/fire|flame|ember|inferno|cinder|blaze|burn|magma|lava/.test(t)) return 'fire'
  if (/ice|frost|rime|glacier|freeze|snow|cold/.test(t)) return 'ice'
  if (/volt|bolt|thunder|storm|spark|shock|lightning/.test(t)) return 'lightning'
  if (/nova|solar|star.?lance|cosmic|aurora|radiant|supernova/.test(t)) return 'cosmic'
  if (/shadow|night|dusk|umbral|shade|phantom/.test(t)) return 'shadow'
  if (/quake|stone|fault|granite|boulder|tectonic/.test(t)) return 'earth'
  if (/gale|zephyr|cyclone|gust|wind.?slash/.test(t)) return 'wind'
  if (/plasma|ion|fusion|chromatic/.test(t)) return 'plasma'
  if (/prism|crystal|facet|lattice|quartz/.test(t)) return 'crystal'
  if (/shard/.test(t)) return 'ice'
  if (/beam|wave|pulse/.test(t)) return 'cosmic'
  return null
}

function resolveFamily(hero: Hero): AbilityFamily {
  // Power-0 / null / void heroes always get void swirl / black-hole feel
  if (isPowerZeroVoid(hero) || hero.base === 0 || hero.power === 0 || hero.visuals.aura === 'void') {
    return 'void'
  }

  const aura = hero.visuals.aura
  const fromAttack = familyFromAttack(`${hero.signatureAttack} ${hero.visualEffect}`)

  // Strong attack element can override aura (signature move identity)
  if (
    fromAttack &&
    (fromAttack === 'fire' || fromAttack === 'ice' || fromAttack === 'lightning' || fromAttack === 'void') &&
    fromAttack !== AURA_FAMILY[aura]
  ) {
    return fromAttack
  }

  if (aura === 'light' || (isGoldCosmic(hero) && (aura === 'plasma' || hero.exponent >= 4))) {
    return 'cosmic'
  }

  if (fromAttack) return fromAttack

  return AURA_FAMILY[aura] ?? 'plasma'
}

function styleDash(style: Hero['fightingStyle']): number {
  switch (style) {
    case 'assassin':
    case 'acrobat':
      return 1.25
    case 'berserker':
    case 'striker':
      return 1.1
    case 'ranger':
      return 0.85
    case 'tank':
    case 'guardian':
      return 0.7
    default:
      return 1
  }
}

/**
 * Derive a per-hero ability FX profile from existing hero fields.
 * Same hero always yields the same seed-stable visuals.
 */
export function getAbilityFx(hero: Hero): AbilityFx {
  const seed = hashId(hero.id)
  const family = resolveFamily(hero)
  const shapes = SHAPES_BY_FAMILY[family]
  const shape = pick(shapes, seed, hero.base + hero.exponent * 3)

  const labels = FALLBACK_LABELS[family]
  const label =
    hero.signatureAttack?.trim() ||
    pick(labels, seed, 5)

  return {
    family,
    label,
    primary: hero.mainColor,
    secondary: hero.secondaryColor,
    accent: hero.accentColor,
    shape,
    particleCount: 8 + (seed % 10) + Math.min(6, hero.exponent),
    beamWidth: 10 + (seed % 14) + (hero.fightingStyle === 'ranger' ? 6 : 0),
    spiralTightness: 0.55 + ((seed % 40) / 100),
    dashIntensity: styleDash(hero.fightingStyle) * (0.9 + (seed % 20) / 100),
    windupScale: 1.05 + ((seed % 25) / 100) + (hero.exponent > 3 ? 0.08 : 0),
    seed,
    cue: FAMILY_CUE[family],
  }
}

export function abilityFamilyForHero(hero: Hero): AbilityFamily {
  return getAbilityFx(hero).family
}
