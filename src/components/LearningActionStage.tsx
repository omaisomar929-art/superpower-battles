import { useEffect, useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import type { Hero } from '../heroes/types'
import { HeroArt } from '../heroes/HeroArt'
import { MathExpression } from './MathExpression'
import { FightSequence } from '../animations/FightSequence'
import { VictoryDance } from '../animations/VictoryDance'
import { AbilityVfx } from '../animations/AbilityVfx'
import { getAbilityFx } from '../animations/abilityFx'
import { resolveTrueBattle } from '../battleEngine'
import { playFightCue } from '../audio/soundEngine'

type Phase = 'charge' | 'fight' | 'victory'

interface LearningActionStageProps {
  heroA: Hero
  heroB: Hero
  /** Equation / expansion shown above the stage. */
  headline: string
  /** Short teaching line under the headline. */
  teach: string
  /** Remount key when the computation changes. */
  resultKey: string
  arena?: string
  /** When false, only show idle heroes (no fight). */
  active?: boolean
}

/**
 * Shared cinematic strip for Expand Mode / Power Mode:
 * ability charge → compact FightSequence → victory dance on the stronger side.
 */
export function LearningActionStage({
  heroA,
  heroB,
  headline,
  teach,
  resultKey,
  arena = 'crystal-arena',
  active = true,
}: LearningActionStageProps) {
  const [phase, setPhase] = useState<Phase>('charge')
  const battle = useMemo(() => resolveTrueBattle(heroA, heroB), [heroA, heroB])
  const fxA = useMemo(() => getAbilityFx(heroA), [heroA])
  const fxB = useMemo(() => getAbilityFx(heroB), [heroB])
  const winner = battle.winnerHero ?? heroA

  useEffect(() => {
    if (!active) return
    setPhase('charge')
    playFightCue('blast')
    const t = window.setTimeout(() => {
      setPhase('fight')
      playFightCue('whoosh')
    }, 900)
    return () => window.clearTimeout(t)
  }, [resultKey, active])

  if (!active) return null

  return (
    <div className="mt-6 overflow-hidden rounded-2xl border border-white/10 bg-slate-950/70">
      <div className="border-b border-white/10 px-4 py-3 sm:px-5">
        <p className="text-[11px] uppercase tracking-[0.35em] text-amber-400/80">Arena proof</p>
        <p className="mt-2 font-mono text-lg text-sky-100 sm:text-xl">{headline}</p>
        <p className="mt-1 text-sm text-slate-400">{teach}</p>
      </div>

      <AnimatePresence mode="wait">
        {phase === 'charge' && (
          <motion.div
            key={`charge-${resultKey}`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="relative flex min-h-[200px] items-end justify-around px-4 pb-6 pt-8"
          >
            <AbilityVfx fx={fxA} side="left" phase="battle" intensity={1.1} />
            <AbilityVfx fx={fxB} side="right" phase="battle" intensity={1.1} />
            <div className="relative z-10 text-center">
              <HeroArt hero={heroA} size={110} animated />
              <p className="mt-1 text-xs text-slate-300">{heroA.name}</p>
              <p className="font-mono text-[11px] text-sky-300">
                <MathExpression base={heroA.base} exponent={heroA.exponent} />
              </p>
            </div>
            <motion.div
              className="relative z-10 font-display text-2xl text-rose-400"
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 0.7, repeat: Infinity }}
            >
              VS
            </motion.div>
            <div className="relative z-10 text-center">
              <HeroArt hero={heroB} size={110} animated />
              <p className="mt-1 text-xs text-slate-300">{heroB.name}</p>
              <p className="font-mono text-[11px] text-rose-300">
                <MathExpression base={heroB.base} exponent={heroB.exponent} />
              </p>
            </div>
            <p className="absolute inset-x-0 top-3 text-center text-[11px] uppercase tracking-[0.3em] text-slate-500">
              Charging abilities…
            </p>
          </motion.div>
        )}

        {phase === 'fight' && (
          <motion.div
            key={`fight-${resultKey}`}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-3 sm:p-4"
          >
            <FightSequence
              fighterA={heroA}
              fighterB={heroB}
              result={battle}
              arena={arena}
              compact
              hideReplay
              onComplete={() => {
                setPhase('victory')
                playFightCue('reveal')
              }}
            />
          </motion.div>
        )}

        {phase === 'victory' && (
          <motion.div
            key={`victory-${resultKey}`}
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center gap-3 px-4 py-6"
          >
            <p className="text-[11px] uppercase tracking-[0.3em] text-emerald-400/90">
              {battle.winner === 'draw' ? 'Equal charge' : 'Victory dance'}
            </p>
            <VictoryDance hero={winner} size={140} showName />
            <p className="max-w-md text-center font-mono text-sm text-sky-200">{battle.explanation}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
