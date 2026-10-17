import { useMemo } from 'react'
import { motion } from 'framer-motion'
import type { AbilityFx, AbilityShape } from './abilityFx'
import type { FightPhase } from './fightPhases'

interface AbilityVfxProps {
  fx: AbilityFx
  side: 'left' | 'right'
  phase: FightPhase
  intensity?: number
}

function seededOffsets(seed: number, count: number): number[] {
  const out: number[] = []
  let s = seed || 1
  for (let i = 0; i < count; i += 1) {
    s = (Math.imul(s, 1664525) + 1013904223) >>> 0
    out.push((s % 1000) / 1000)
  }
  return out
}

function activeForPhase(phase: FightPhase): 'idle' | 'windup' | 'fire' | 'clash' | 'victory' {
  if (phase === 'introA' || phase === 'introB') return 'windup'
  if (phase === 'battle' || phase === 'compare') return 'fire'
  if (phase === 'clash') return 'clash'
  if (phase === 'reveal' || phase === 'done') return 'victory'
  return 'idle'
}

export function AbilityVfx({ fx, side, phase, intensity = 1 }: AbilityVfxProps) {
  const mode = activeForPhase(phase)
  const dir = side === 'left' ? 1 : -1
  const originX = side === 'left' ? '18%' : '82%'
  const particles = useMemo(
    () => seededOffsets(fx.seed, fx.particleCount),
    [fx.seed, fx.particleCount],
  )

  if (mode === 'idle') return null

  const opacity =
    mode === 'windup' ? 0.45 * intensity : mode === 'clash' ? 1 * intensity : 0.85 * intensity

  return (
    <div className="pointer-events-none absolute inset-0 z-[15] overflow-hidden" aria-hidden>
      {/* Wind-up charge ring */}
      {(mode === 'windup' || mode === 'fire' || mode === 'clash') && (
        <motion.div
          className="absolute top-[42%] h-28 w-28 -translate-x-1/2 -translate-y-1/2 rounded-full"
          style={{
            left: originX,
            boxShadow: `0 0 ${28 + fx.beamWidth}px ${10 + fx.beamWidth / 2}px ${fx.accent}66`,
            background: `radial-gradient(circle, ${fx.secondary}55, transparent 70%)`,
          }}
          initial={{ scale: 0.4, opacity: 0 }}
          animate={{
            scale: mode === 'windup' ? [0.7, fx.windupScale, 0.85] : [0.9, 1.2, 0.95],
            opacity: [0.25, opacity, 0.35],
            rotate: fx.family === 'void' || fx.family === 'wind' ? [0, 180, 360] : 0,
          }}
          transition={{ duration: mode === 'windup' ? 0.9 : 0.55, repeat: Infinity, ease: 'easeInOut' }}
        />
      )}

      {/* Signature projectile / beam / aura */}
      {(mode === 'fire' || mode === 'clash') && (
        <ShapeLayer fx={fx} dir={dir} originX={originX} mode={mode} particles={particles} />
      )}

      {/* Clash: opposing streams meet at center */}
      {mode === 'clash' && (
        <motion.div
          className="absolute left-1/2 top-[42%] z-20 -translate-x-1/2 -translate-y-1/2"
          animate={{ scale: [0.8, 1.4, 1], opacity: [0.5, 1, 0.7], rotate: [0, 15, -10, 0] }}
          transition={{ duration: 0.35, repeat: Infinity }}
        >
          <div
            className="h-16 w-16 rounded-full blur-sm"
            style={{
              background: `radial-gradient(circle, #fff 0%, ${fx.accent} 35%, ${fx.secondary}88 60%, transparent 75%)`,
            }}
          />
        </motion.div>
      )}

      {/* Impact sparkles */}
      {(mode === 'fire' || mode === 'clash') &&
        particles.slice(0, Math.min(6, particles.length)).map((r, i) => (
          <motion.span
            key={`p-${fx.seed}-${i}`}
            className="absolute h-1.5 w-1.5 rounded-full"
            style={{
              left: `calc(50% + ${(r - 0.5) * 80 * dir}px)`,
              top: `${38 + r * 16}%`,
              background: i % 2 === 0 ? fx.accent : fx.primary,
              boxShadow: `0 0 8px ${fx.secondary}`,
            }}
            animate={{
              x: [0, dir * (20 + r * 40), dir * (40 + r * 20)],
              y: [0, (r - 0.5) * 30, (r - 0.4) * 50],
              opacity: [0, 1, 0],
              scale: [0.4, 1.2, 0.2],
            }}
            transition={{
              duration: 0.55 + r * 0.35,
              repeat: Infinity,
              delay: i * 0.08,
              ease: 'easeOut',
            }}
          />
        ))}

      {/* Ability name tag during fire / clash */}
      {(mode === 'fire' || mode === 'clash') && (
        <motion.div
          className="absolute top-[18%] max-w-[42%] truncate px-2 font-display text-[10px] tracking-widest sm:text-xs"
          style={{
            left: side === 'left' ? '6%' : 'auto',
            right: side === 'right' ? '6%' : 'auto',
            color: fx.primary,
            textShadow: `0 0 12px ${fx.secondary}`,
          }}
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: [0.4, 1, 0.55], y: [0, -2, 0] }}
          transition={{ duration: 1.1, repeat: Infinity }}
        >
          {fx.label.toUpperCase()}
        </motion.div>
      )}
    </div>
  )
}

function ShapeLayer({
  fx,
  dir,
  originX,
  mode,
  particles,
}: {
  fx: AbilityFx
  dir: number
  originX: string
  mode: 'fire' | 'clash'
  particles: number[]
}) {
  const reach = mode === 'clash' ? '38%' : '46%'

  switch (fx.shape as AbilityShape) {
    case 'stream':
    case 'cone':
      return (
        <motion.div
          className="absolute rounded-full blur-[2px]"
          style={{
            left: originX,
            top: '42%',
            width: reach,
            height: fx.beamWidth + (fx.shape === 'cone' ? 18 : 0),
            background:
              fx.family === 'fire'
                ? `linear-gradient(${dir === 1 ? 90 : 270}deg, ${fx.accent}, ${fx.secondary}, transparent)`
                : `linear-gradient(${dir === 1 ? 90 : 270}deg, ${fx.primary}, ${fx.secondary}cc, transparent)`,
            clipPath:
              fx.shape === 'cone'
                ? dir === 1
                  ? 'polygon(0 40%, 100% 0, 100% 100%, 0 60%)'
                  : 'polygon(0 0, 100% 40%, 100% 60%, 0 100%)'
                : undefined,
            transform: `translateY(-50%) ${dir === -1 ? 'translateX(-100%)' : ''}`,
            transformOrigin: dir === 1 ? 'left center' : 'right center',
            opacity: 0.9,
          }}
          animate={{
            scaleX: [0.55, 1.05, 0.85],
            opacity: [0.45, 0.95, 0.55],
            filter: ['brightness(1)', 'brightness(1.35)', 'brightness(1)'],
          }}
          transition={{ duration: 0.45, repeat: Infinity }}
        />
      )

    case 'beam':
    case 'wave':
      return (
        <>
          <motion.div
            className="absolute -translate-y-1/2 rounded-full"
            style={{
              left: originX,
              top: '42%',
              width: reach,
              height: Math.max(6, fx.beamWidth * 0.45),
              background: `linear-gradient(${dir === 1 ? 90 : 270}deg, ${fx.accent}, ${fx.primary}, ${fx.secondary}00)`,
              boxShadow: `0 0 18px ${fx.secondary}, 0 0 40px ${fx.accent}88`,
              transform: `translateY(-50%) ${dir === -1 ? 'translateX(-100%)' : ''}`,
            }}
            animate={{ opacity: [0.5, 1, 0.6], scaleY: [0.8, 1.4, 0.9] }}
            transition={{ duration: 0.32, repeat: Infinity }}
          />
          {fx.shape === 'wave' &&
            [0, 1, 2].map((i) => (
              <motion.div
                key={`wave-${i}`}
                className="absolute h-16 w-16 -translate-y-1/2 rounded-full border-2"
                style={{
                  left: originX,
                  top: '42%',
                  borderColor: `${fx.primary}88`,
                  boxShadow: `0 0 12px ${fx.secondary}`,
                }}
                animate={{
                  x: dir === 1 ? [0, 120 + i * 30] : [0, -(120 + i * 30)],
                  scale: [0.3, 1.4],
                  opacity: [0.8, 0],
                }}
                transition={{ duration: 0.7, repeat: Infinity, delay: i * 0.18 }}
              />
            ))}
        </>
      )

    case 'orb':
    case 'spiral':
      return (
        <motion.div
          className="absolute -translate-x-1/2 -translate-y-1/2"
          style={{ left: originX, top: '42%' }}
          animate={{
            x: dir === 1 ? [0, 90, 140] : [0, -90, -140],
            rotate: fx.shape === 'spiral' ? [0, 360] : [0, 40, -20],
            scale: [0.6, 1.15, 0.9],
          }}
          transition={{ duration: mode === 'clash' ? 0.55 : 0.75, repeat: Infinity, ease: 'easeInOut' }}
        >
          <div
            className="relative h-20 w-20 rounded-full"
            style={{
              background:
                fx.family === 'void'
                  ? `radial-gradient(circle at 40% 40%, #1e1b4b 0%, #020617 45%, ${fx.secondary} 70%, transparent 75%)`
                  : `radial-gradient(circle at 35% 35%, #fff8, ${fx.primary}, ${fx.secondary}, transparent 72%)`,
              boxShadow:
                fx.family === 'void'
                  ? `0 0 30px #000, 0 0 50px ${fx.accent}, inset 0 0 20px #000`
                  : `0 0 28px ${fx.accent}`,
            }}
          >
            {fx.shape === 'spiral' && (
              <motion.div
                className="absolute inset-2 rounded-full border-2 border-dashed"
                style={{ borderColor: fx.accent }}
                animate={{ rotate: [0, -360] }}
                transition={{ duration: 1.2 * fx.spiralTightness, repeat: Infinity, ease: 'linear' }}
              />
            )}
          </div>
        </motion.div>
      )

    case 'shards':
      return (
        <>
          {particles.slice(0, 8).map((r, i) => (
            <motion.div
              key={`shard-${i}`}
              className="absolute h-3 w-1.5 -translate-y-1/2"
              style={{
                left: originX,
                top: `${36 + r * 20}%`,
                background: `linear-gradient(${fx.primary}, ${fx.accent})`,
                clipPath: 'polygon(50% 0, 100% 100%, 0 100%)',
                boxShadow: `0 0 8px ${fx.secondary}`,
              }}
              animate={{
                x: dir === 1 ? [0, 100 + r * 60] : [0, -(100 + r * 60)],
                y: [(r - 0.5) * 10, (r - 0.5) * 40],
                rotate: [0, dir * (40 + r * 80)],
                opacity: [0, 1, 0.2],
              }}
              transition={{ duration: 0.55 + r * 0.2, repeat: Infinity, delay: i * 0.05 }}
            />
          ))}
        </>
      )

    case 'bolts':
      return (
        <>
          {particles.slice(0, 5).map((r, i) => (
            <motion.svg
              key={`bolt-${i}`}
              className="absolute -translate-y-1/2"
              width={160}
              height={40}
              style={{
                left: originX,
                top: `${40 + (r - 0.5) * 18}%`,
                transform: dir === -1 ? 'translate(-100%, -50%) scaleX(-1)' : 'translateY(-50%)',
              }}
              animate={{ opacity: [0.2, 1, 0.15], x: [0, dir * 8, 0] }}
              transition={{ duration: 0.28 + r * 0.15, repeat: Infinity, delay: i * 0.07 }}
            >
              <polyline
                points={`0,20 30,8 50,24 80,6 110,22 140,12 160,20`}
                fill="none"
                stroke={i % 2 ? fx.accent : fx.primary}
                strokeWidth={2 + (r > 0.5 ? 1 : 0)}
                strokeLinecap="round"
                style={{ filter: `drop-shadow(0 0 6px ${fx.secondary})` }}
              />
            </motion.svg>
          ))}
        </>
      )

    case 'ribbon':
      return (
        <>
          {[0, 1, 2].map((i) => (
            <motion.div
              key={`ribbon-${i}`}
              className="absolute h-2 -translate-y-1/2 rounded-full"
              style={{
                left: originX,
                top: `${40 + i * 4}%`,
                width: reach,
                background: `linear-gradient(${dir === 1 ? 90 : 270}deg, ${fx.secondary}, ${fx.primary}00)`,
                transform: `translateY(-50%) ${dir === -1 ? 'translateX(-100%)' : ''} rotate(${(i - 1) * 8}deg)`,
                opacity: 0.75,
              }}
              animate={{
                scaleX: [0.4, 1.1, 0.7],
                opacity: [0.3, 0.9, 0.4],
                y: [0, (i - 1) * 8, 0],
              }}
              transition={{ duration: 0.5 + i * 0.1, repeat: Infinity }}
            />
          ))}
        </>
      )

    case 'burst':
    default:
      return (
        <motion.div
          className="absolute -translate-x-1/2 -translate-y-1/2"
          style={{ left: originX, top: '42%' }}
          animate={{ scale: [0.5, 1.35, 0.8], opacity: [0.4, 0.9, 0.35] }}
          transition={{ duration: 0.5, repeat: Infinity }}
        >
          <div
            className="h-24 w-24 rounded-full"
            style={{
              background: `radial-gradient(circle, ${fx.accent}cc, ${fx.secondary}66, transparent 70%)`,
              boxShadow: `0 0 40px ${fx.primary}`,
            }}
          />
          {particles.slice(0, 6).map((r, i) => (
            <motion.span
              key={`burst-p-${i}`}
              className="absolute left-1/2 top-1/2 h-2 w-2 -translate-x-1/2 -translate-y-1/2 rounded-sm"
              style={{ background: fx.primary }}
              animate={{
                x: Math.cos((i / 6) * Math.PI * 2) * (30 + r * 40) * dir,
                y: Math.sin((i / 6) * Math.PI * 2) * (20 + r * 30),
                opacity: [1, 0],
                scale: [1, 0.2],
              }}
              transition={{ duration: 0.55, repeat: Infinity, delay: i * 0.04 }}
            />
          ))}
        </motion.div>
      )
  }
}

/** Lightweight arena particle rain tinted by both fighters during battle/clash. */
export function ArenaCombatParticles({
  colorA,
  colorB,
  active,
  heavy,
}: {
  colorA: string
  colorB: string
  active: boolean
  heavy?: boolean
}) {
  if (!active) return null
  const count = heavy ? 18 : 10
  const bits = seededOffsets(42, count)

  return (
    <div className="pointer-events-none absolute inset-0 z-[12] overflow-hidden" aria-hidden>
      {bits.map((r, i) => (
        <motion.span
          key={`dust-${i}`}
          className="absolute h-1 w-1 rounded-full"
          style={{
            left: `${r * 100}%`,
            top: `${(bits[(i + 3) % bits.length] ?? 0.5) * 70 + 10}%`,
            background: i % 2 === 0 ? colorA : colorB,
          }}
          animate={{
            y: [0, heavy ? 40 : 20, 0],
            x: [(r - 0.5) * 10, (r - 0.5) * 30],
            opacity: [0, 0.85, 0],
            scale: [0.5, 1.2, 0.4],
          }}
          transition={{
            duration: heavy ? 0.4 : 0.7,
            repeat: Infinity,
            delay: i * 0.05,
          }}
        />
      ))}
    </div>
  )
}
