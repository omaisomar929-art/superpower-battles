import { useMemo } from 'react'
import { motion } from 'framer-motion'
import type { Hero } from '../heroes/types'
import { HeroArt } from '../heroes/HeroArt'
import { getVictoryDance, type VictoryDanceParams } from './victoryDance'

interface VictoryDanceProps {
  hero: Hero
  /** Portrait size in px. */
  size?: number
  /** Compact layout for versus overlay / mobile. */
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

function danceAnimate(params: VictoryDanceParams): Record<string, number | number[]> {
  const { style, bouncePx, spinDeg, intensity } = params
  const y = bouncePx
  const scalePeak = 1 + intensity * 0.18

  switch (style) {
    case 'bounce':
      return { y: [0, -y, 0, -y * 0.55, 0], scale: [1, scalePeak, 1, 1.05, 1], rotate: [0, -6, 4, -3, 0] }
    case 'spin':
      return { y: [0, -y * 0.4, 0], rotate: [0, spinDeg / 2, spinDeg], scale: [1, scalePeak, 1] }
    case 'pulse':
      return { scale: [1, scalePeak * 1.08, 0.96, scalePeak, 1], y: [0, -y * 0.25, 0], rotate: [0, 3, -3, 0] }
    case 'hop':
      return {
        y: [0, -y * 1.15, 0, -y * 0.7, 0],
        x: [0, 8 * intensity, -6 * intensity, 4, 0],
        rotate: [0, -12, 10, -6, 0],
        scale: [1, 1.08, 1, 1.05, 1],
      }
    case 'swirl':
      return {
        rotate: [0, spinDeg * 0.35, -spinDeg * 0.2, spinDeg * 0.15, 0],
        y: [0, -y * 0.5, -y * 0.2, -y * 0.45, 0],
        scale: [1, scalePeak, 1.02, scalePeak * 0.95, 1],
      }
    case 'flex':
      return {
        scaleX: [1, 1.12 + intensity * 0.08, 0.92, 1.08, 1],
        scaleY: [1, 0.92, 1.1, 0.96, 1],
        y: [0, -y * 0.35, 0],
        rotate: [0, -4, 4, 0],
      }
    case 'orbit':
      return {
        x: [0, 14 * intensity, 0, -14 * intensity, 0],
        y: [0, -y * 0.6, -y * 0.9, -y * 0.6, 0],
        rotate: [0, 25, 0, -25, 0],
        scale: [1, scalePeak, 1.04, scalePeak, 1],
      }
    case 'quake':
      return {
        x: [0, -6 * intensity, 6 * intensity, -4, 4, 0],
        y: [0, -y * 0.3, 0, -y * 0.5, 0],
        scale: [1, scalePeak * 1.05, 1, scalePeak, 1],
        rotate: [0, -3, 3, -2, 0],
      }
    default:
      return { y: [0, -y, 0], scale: [1, scalePeak, 1] }
  }
}

/**
 * Animated victory pose/dance for a winning hero — bounce, spin, aura pulse, color trails.
 * Motion is seeded from hero identity so each fighter feels distinct and consistent.
 */
export function VictoryDance({
  hero,
  size = 140,
  compact = false,
  className = '',
  showName = true,
}: VictoryDanceProps) {
  const params = useMemo(() => getVictoryDance(hero), [hero])
  const trails = useMemo(
    () => trailOffsets(params.seed, params.trailCount),
    [params.seed, params.trailCount],
  )
  const animate = danceAnimate(params)
  const artSize = compact ? Math.min(size, 96) : size

  return (
    <div className={`relative flex flex-col items-center justify-center ${className}`} aria-live="polite">
      {/* Soft victory glow plane */}
      <motion.div
        className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full blur-2xl"
        style={{
          width: artSize * 1.6,
          height: artSize * 1.6,
          background: `radial-gradient(circle, ${params.trailColors[1]}66, ${params.trailColors[0]}33, transparent 70%)`,
        }}
        animate={{
          opacity: [0.35, 0.75, 0.4],
          scale: [0.85, params.auraScale, 0.9],
        }}
        transition={{ duration: params.duration * 1.2, repeat: Infinity, ease: 'easeInOut' }}
      />

      {/* Color trails */}
      <div className="pointer-events-none absolute inset-0 overflow-visible" aria-hidden>
        {trails.map((r, i) => {
          const color = params.trailColors[i % 3]!
          const angle = (i / trails.length) * Math.PI * 2 + (params.seed % 7) * 0.2
          const radius = (artSize * 0.35 + r * artSize * 0.35) * params.intensity
          return (
            <motion.span
              key={`trail-${params.seed}-${i}`}
              className="absolute left-1/2 top-1/2 rounded-full"
              style={{
                width: 4 + (r > 0.5 ? 3 : 0) * params.intensity,
                height: 4 + (r > 0.5 ? 3 : 0) * params.intensity,
                background: color,
                boxShadow: `0 0 10px ${color}`,
                marginLeft: -3,
                marginTop: -3,
              }}
              animate={{
                x: [
                  Math.cos(angle) * radius * 0.3,
                  Math.cos(angle + 1.2) * radius,
                  Math.cos(angle + 2.4) * radius * 0.5,
                ],
                y: [
                  Math.sin(angle) * radius * 0.3 - 8,
                  Math.sin(angle + 1.2) * radius - 16 * params.intensity,
                  Math.sin(angle + 2.4) * radius * 0.4,
                ],
                opacity: [0, 0.95, 0],
                scale: [0.4, 1.2, 0.3],
              }}
              transition={{
                duration: params.duration * (1.1 + r * 0.4),
                repeat: Infinity,
                delay: i * 0.06,
                ease: 'easeOut',
              }}
            />
          )
        })}
      </div>

      {/* Aura ring */}
      <motion.div
        className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full border-2"
        style={{
          width: artSize * 1.15,
          height: artSize * 1.15,
          borderColor: `${params.trailColors[2]}99`,
          boxShadow: `0 0 24px ${params.trailColors[1]}66, inset 0 0 20px ${params.trailColors[0]}33`,
        }}
        animate={{
          scale: [0.92, params.auraScale, 0.95],
          opacity: [0.4, 0.9, 0.45],
          rotate: params.style === 'spin' || params.style === 'swirl' || params.style === 'orbit' ? [0, 180, 360] : 0,
        }}
        transition={{ duration: params.duration * 1.4, repeat: Infinity, ease: 'easeInOut' }}
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
        <HeroArt hero={hero} size={artSize} animated />
      </motion.div>

      {showName && (
        <motion.div
          className="relative z-10 mt-2 text-center"
          animate={{ opacity: [0.7, 1, 0.75], y: [0, -2, 0] }}
          transition={{ duration: params.duration * 1.1, repeat: Infinity }}
        >
          <div
            className={`font-display tracking-wide ${compact ? 'text-sm' : 'text-base sm:text-lg'}`}
            style={{ color: hero.mainColor, textShadow: `0 0 14px ${hero.secondaryColor}` }}
          >
            {hero.name}
          </div>
          <div className="text-[10px] uppercase tracking-[0.25em] text-amber-300/90">Victory dance</div>
        </motion.div>
      )}
    </div>
  )
}
