export type FightingStyle =
  | 'striker'
  | 'ranger'
  | 'tank'
  | 'acrobat'
  | 'mystic'
  | 'berserker'
  | 'guardian'
  | 'assassin'

export type ElementTheme =
  | 'fire'
  | 'ice'
  | 'lightning'
  | 'shadow'
  | 'light'
  | 'earth'
  | 'wind'
  | 'void'
  | 'plasma'
  | 'crystal'

export interface HeroVisuals {
  silhouette: 'cape' | 'armor' | 'cloak' | 'wings' | 'mech' | 'robe' | 'nimble' | 'beast'
  weapon: 'fists' | 'blade' | 'staff' | 'bow' | 'gauntlets' | 'orb' | 'spear' | 'shield'
  mask: 'none' | 'half' | 'full' | 'visor' | 'hood'
  cape: boolean
  horns: boolean
  aura: ElementTheme
}

export interface Hero {
  id: string
  name: string
  base: number
  exponent: number
  power: number
  expression: string
  mainColor: string
  secondaryColor: string
  accentColor: string
  costume: string
  signatureAttack: string
  defensiveAbility: string
  fightingStyle: FightingStyle
  victoryAnimation: string
  defeatAnimation: string
  visualEffect: string
  visuals: HeroVisuals
  tagline: string
}
