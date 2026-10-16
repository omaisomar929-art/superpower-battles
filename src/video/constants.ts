export const VIDEO_FPS = 30
export const VIDEO_DURATION_SECONDS = 30
export const VIDEO_DURATION_FRAMES = VIDEO_FPS * VIDEO_DURATION_SECONDS

export type AspectRatio = '16:9' | '9:16' | '1:1'

export const ASPECT_DIMENSIONS: Record<AspectRatio, { width: number; height: number }> = {
  '16:9': { width: 1920, height: 1080 },
  '9:16': { width: 1080, height: 1920 },
  '1:1': { width: 1080, height: 1080 },
}

/** Timeline in frames (always totals 900) */
export const TIMELINE = {
  intro: { start: 0, end: 90 }, // 0–3s
  battle1: { start: 90, end: 270 }, // 3–9s
  battle2: { start: 270, end: 450 }, // 9–15s
  battle3: { start: 450, end: 630 }, // 15–21s
  battle4: { start: 630, end: 810 }, // 21–27s
  outro: { start: 810, end: 900 }, // 27–30s
} as const

export type VideoTheme = 'neon' | 'inferno' | 'arctic' | 'void'
export type Intensity = 'low' | 'medium' | 'high'
export type BattleSpeed = 'slow' | 'normal' | 'fast'

export interface VideoSettings {
  aspect: AspectRatio
  theme: VideoTheme
  intensity: Intensity
  speed: BattleSpeed
  arena: string
  showMath: boolean
  mathTiming: 'early' | 'mid' | 'late'
  audioEnabled: boolean
}
