import { motion } from 'framer-motion'
import type { AbilityFx } from './abilityFx'
import type { FightPhase } from './fightPhases'

/**
 * Symmetric hand/punch trails for both fighters during battle + clash.
 * Keeps cinematic fights from looking like a one-sided beatdown.
 */
export function DualPunchVfx({
  fxA,
  fxB,
  phase,
  flash,
}: {
  fxA: AbilityFx
  fxB: AbilityFx
  phase: FightPhase
  flash: number
}) {
  const active = phase === 'battle' || phase === 'clash' || phase === 'compare'
  if (!active) return null

  const heavy = phase === 'clash'
  // Alternate which side "leads" a punch so both stay readable
  const leftLeads = flash % 2 === 0

  return (
    <div className="pointer-events-none absolute inset-0 z-[16] overflow-hidden" aria-hidden>
      <PunchBurst
        side="left"
        fx={fxA}
        lead={leftLeads}
        heavy={heavy}
        flash={flash}
      />
      <PunchBurst
        side="right"
        fx={fxB}
        lead={!leftLeads}
        heavy={heavy}
        flash={flash}
      />
    </div>
  )
}

function PunchBurst({
  side,
  fx,
  lead,
  heavy,
  flash,
}: {
  side: 'left' | 'right'
  fx: AbilityFx
  lead: boolean
  heavy: boolean
  flash: number
}) {
  const dir = side === 'left' ? 1 : -1
  const origin = side === 'left' ? '22%' : '78%'
  const intensity = lead ? 1 : 0.85

  return (
    <>
      {/* Fist / gauntlet streak */}
      <motion.div
        key={`fist-${side}-${flash}`}
        className="absolute top-[44%] h-5 w-5 -translate-y-1/2 rounded-md"
        style={{
          left: origin,
          background: `linear-gradient(${dir === 1 ? 90 : 270}deg, ${fx.primary}, ${fx.accent})`,
          boxShadow: `0 0 14px ${fx.secondary}, 0 0 4px #fff8`,
        }}
        initial={{ x: 0, opacity: 0, scale: 0.6 }}
        animate={{
          x: dir * (heavy ? 110 : 72) * intensity,
          y: [0, -6, 2, 0],
          opacity: [0, 1, 0.9, 0],
          rotate: dir * (lead ? 18 : -12),
          scale: [0.6, 1.15, 1],
        }}
        transition={{ duration: heavy ? 0.28 : 0.36, ease: 'easeOut' }}
      />
      {/* Knuckle impact trail */}
      <motion.div
        className="absolute top-[44%] h-2 -translate-y-1/2 rounded-full"
        style={{
          left: origin,
          width: heavy ? '28%' : '22%',
          background: `linear-gradient(${dir === 1 ? 90 : 270}deg, ${fx.accent}cc, transparent)`,
          transform: `translateY(-50%) ${dir === -1 ? 'translateX(-100%)' : ''}`,
          opacity: intensity * 0.9,
        }}
        animate={{
          scaleX: [0.3, 1.1, 0.5],
          opacity: [0.2, 0.85 * intensity, 0.15],
        }}
        transition={{ duration: 0.4, repeat: Infinity, delay: side === 'right' ? 0.12 : 0 }}
      />
      {/* Secondary jab (always both sides) */}
      <motion.span
        className="absolute top-[48%] h-2.5 w-2.5 -translate-y-1/2 rounded-full"
        style={{
          left: origin,
          background: fx.secondary,
          boxShadow: `0 0 10px ${fx.accent}`,
        }}
        animate={{
          x: [0, dir * (heavy ? 90 : 55), dir * (heavy ? 130 : 80)],
          y: [4, -2, 6],
          opacity: [0, 0.95, 0],
          scale: [0.5, 1.2, 0.4],
        }}
        transition={{
          duration: 0.48,
          repeat: Infinity,
          delay: side === 'left' ? 0.18 : 0.02,
          ease: 'easeOut',
        }}
      />
    </>
  )
}
