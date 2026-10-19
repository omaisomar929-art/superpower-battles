import { useMemo } from 'react'
import { motion } from 'framer-motion'
import type { Hero } from '../heroes/types'
import { HeroArt } from '../heroes/HeroArt'
import { getEvilVictoryDance, type EvilDanceParams, type EvilDanceStyle } from './evilDance'

interface EvilVictoryDanceProps {
  villain: Hero
  /** Force a style (villain profile). */
  style?: EvilDanceStyle
  size?: number
  compact?: boolean
  className?: string
  showName?: boolean
}

function trailOffsets(seed: number, count: number): number[] {
  const out: number[] = []
  let s = seed || 1
  for (let i = 0; i < count; i += 1) {
    s = (Math.imul(s, 1664525) + 1013904223) >>> 0
    out.push((s % 1000) / 1000)
  }
  return out
}

function evilAnimate(params: EvilDanceParams): Record<string, number | number[]> {
  const { style, bouncePx, spinDeg, intensity } = params
  const y = bouncePx
  const scalePeak = 1 + intensity * 0.2

  switch (style) {
    case 'sink':
      return {
        y: [0, y * 0.35, y * 0.15, y * 0.55, 0],
        scale: [1, 0.88, 0.95, 0.82, 1],
        rotate: [0, 4, -4, 6, 0],
        opacity: [1, 0.75, 0.9, 0.7, 1],
      }
    case 'cackle':
      return {
        x: [0, -8 * intensity, 10 * intensity, -6, 7, 0],
        y: [0, -y * 0.25, 0, -y * 0.4, 0],
        rotate: [0, -14, 16, -10, 8, 0],
        scale: [1, 1.06, 0.97, 1.1, 1],
      }
    case 'eclipse':
      return {
        scale: [1, scalePeak * 1.15, 0.9, scalePeak, 1],
        opacity: [1, 0.55, 1, 0.65, 1],
        rotate: [0, -8, 8, 0],
        y: [0, -y * 0.2, 0],
      }
    case 'crush':
      return {
        y: [0, -y * 0.5, y * 0.4, -y * 0.2, 0],
        scaleY: [1, 0.85, 1.2, 0.9, 1],
        scaleX: [1, 1.12, 0.88, 1.08, 1],
        rotate: [0, -3, 3, 0],
      }
    case 'spiral':
      return {
        rotate: [0, -spinDeg * 0.4, spinDeg * 0.25, -spinDeg * 0.15, 0],
        y: [0, -y * 0.55, -y * 0.2, -y * 0.5, 0],
        scale: [1, scalePeak, 1.02, scalePeak * 0.92, 1],
        x: [0, 10 * intensity, -8 * intensity, 0],
      }
    case 'loom':
      return {
        scale: [1, 1.08, scalePeak * 1.2, 1.1, 1],
        y: [0, -y * 0.15, -y * 0.7, -y * 0.25, 0],
        rotate: [0, 2, -2, 0],
      }
    case 'shatter':
      return {
        x: [0, -12 * intensity, 14 * intensity, -9, 11, -4, 0],
        y: [0, -y * 0.3, y * 0.1, -y * 0.45, 0],
        rotate: [0, -18, 22, -12, 8, 0],
        scale: [1, 1.12, 0.9, 1.15, 0.95, 1],
      }
    case 'drain':
      return {
        scale: [1, 0.78, 1.05, 0.85, 1],
        y: [0, y * 0.2, -y * 0.35, y * 0.1, 0],
        opacity: [1, 0.6, 1, 0.7, 1],
        rotate: [0, 10, -10, 0],
      }
    default:
      return { y: [0, y * 0.3, 0], scale: [1, 0.9, 1] }
  }
}

/**
 * Dark counterpart to VictoryDance — seeded evil celebration when a villain wins.
 */
export function EvilVictoryDance({
  villain,
  style,
  size = 140,
  compact = false,
  className = '',
  showName = true,
}: EvilVictoryDanceProps) {
  const params = useMemo(() => getEvilVictoryDance(villain, style), [villain, style])
  const trails = useMemo(
    () => trailOffsets(params.seed, params.trailCount),
    [params.seed, params.trailCount],
  )
  const animate = evilAnimate(params)
  const artSize = compact ? Math.min(size, 96) : size

  return (
    <div className={`relative flex flex-col items-center justify-center ${className}`} aria-live="polite">
      <motion.div
        className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full blur-2xl"
        style={{
          width: artSize * 1.75,
          height: artSize * 1.75,
          background: `radial-gradient(circle, ${params.trailColors[1]}88, ${params.trailColors[2]}aa, transparent 72%)`,
        }}
        animate={{
          opacity: [0.45, 0.85, 0.4],
          scale: [0.8, params.auraScale, 0.88],
        }}
        transition={{ duration: params.duration * 1.25, repeat: Infinity, ease: 'easeInOut' }}
      />

      <div className="pointer-events-none absolute inset-0 overflow-visible" aria-hidden>
        {trails.map((r, i) => {
          const color = params.trailColors[i % 3]!
          const angle = (i / trails.length) * Math.PI * 2 + (params.seed % 11) * 0.15
          const radius = (artSize * 0.4 + r * artSize * 0.4) * params.intensity
          return (
            <motion.span
              key={`evil-trail-${params.seed}-${i}`}
              className="absolute left-1/2 top-1/2 rounded-sm"
              style={{
                width: 3 + (r > 0.5 ? 4 : 1) * params.intensity,
                height: 3 + (r > 0.5 ? 4 : 1) * params.intensity,
                background: color,
                boxShadow: `0 0 12px ${color}`,
                marginLeft: -2,
                marginTop: -2,
              }}
              animate={{
                x: [
                  Math.cos(angle) * radius,
                  Math.cos(angle + 2) * radius * 0.2,
                  Math.cos(angle + 4) * radius * 0.7,
                ],
                y: [
                  Math.sin(angle) * radius - 4,
                  Math.sin(angle + 2) * radius * 0.3 + 10 * params.intensity,
                  Math.sin(angle + 4) * radius * 0.5,
                ],
                opacity: [0.9, 0.15, 0],
                scale: [1.1, 0.4, 0.2],
              }}
              transition={{
                duration: params.duration * (1.2 + r * 0.5),
                repeat: Infinity,
                delay: i * 0.05,
                ease: 'easeIn',
              }}
            />
          )
        })}
      </div>

      <motion.div
        className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full border"
        style={{
          width: artSize * 1.2,
          height: artSize * 1.2,
          borderColor: `${params.trailColors[0]}77`,
          boxShadow: `0 0 28px ${params.trailColors[2]}99, inset 0 0 24px ${params.trailColors[1]}44`,
        }}
        animate={{
          scale: [1.05, 0.88, params.auraScale],
          opacity: [0.55, 0.95, 0.5],
          rotate:
            params.style === 'spiral' || params.style === 'eclipse' || params.style === 'loom'
              ? [0, -180, -360]
              : [0, 12, -12, 0],
        }}
        transition={{ duration: params.duration * 1.5, repeat: Infinity, ease: 'easeInOut' }}
      />

      <motion.div
        className="relative z-10"
        animate={animate}
        transition={{
          duration: params.duration,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      >
        <HeroArt hero={villain} size={artSize} animated />
      </motion.div>

      {showName && (
        <motion.div
          className="relative z-10 mt-2 text-center"
          animate={{ opacity: [0.65, 1, 0.7], y: [0, 2, 0] }}
          transition={{ duration: params.duration * 1.15, repeat: Infinity }}
        >
          <div
            className={`font-display tracking-wide ${compact ? 'text-sm' : 'text-base sm:text-lg'}`}
            style={{ color: villain.mainColor, textShadow: `0 0 16px ${villain.secondaryColor}` }}
          >
            {villain.name}
          </div>
          <div className="text-[10px] uppercase tracking-[0.28em] text-rose-300/90">
            Evil victory · {params.caption}
          </div>
        </motion.div>
      )}
    </div>
  )
}
