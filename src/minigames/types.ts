export type PlayerMode = 1 | 2

export type PlayerId = 'p1' | 'p2'

export type MiniGameId =
  | 'meteor'
  | 'cube-comets'
  | 'expand-asteroids'
  | 'void-pull'
  | 'laser-lattice'
  | 'thunder'

export interface PowerExpr {
  base: number
  exponent: number
  /** True math value (n⁰ = 1). */
  value: number
}

export interface MiniGameMeta {
  id: MiniGameId
  title: string
  tagline: string
  blurb: string
  accent: string
  accentSoft: string
}
