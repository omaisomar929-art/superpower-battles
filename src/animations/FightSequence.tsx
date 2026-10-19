import { useEffect, useMemo, useState, type CSSProperties } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import type { BattleResult } from '../battleEngine'
import type { Hero } from '../heroes/types'
import { HeroArt } from '../heroes/HeroArt'
import { MathExpression } from '../components/MathExpression'
import { playFightCue, playVictoryStinger } from '../audio/soundEngine'
import { getAbilityFx } from './abilityFx'
import { AbilityVfx, ArenaCombatParticles } from './AbilityVfx'
import { DualPunchVfx } from './DualPunchVfx'
import { VictoryDance } from './VictoryDance'
import { getVictoryDance } from './victoryDance'
import type { FightPhase } from './fightPhases'

export type { FightPhase } from './fightPhases'

interface FightSequenceProps {
  fighterA: Hero
  fighterB: Hero
  result: BattleResult
  arena: string
  autoStart?: boolean
  /** Shorter phase timings for quiz / question feedback loops. */
  compact?: boolean
  /** Hide the built-in replay button (parent owns next-step CTAs). */
  hideReplay?: boolean
  /** Bigger, higher-contrast base^exponent labels (Question / Villain Mode). */
  largeMath?: boolean
  /**
   * When true with largeMath, also show computed = power under fighters / compare box.
   * Question Mode keeps this false so kids see only e.g. 3⁴.
   */
  showPowerValues?: boolean
  onComplete?: () => void
}

const PHASE_MS: Record<Exclude<FightPhase, 'idle' | 'done'>, number> = {
  introA: 1200,
  introB: 1200,
  battle: 2800,
  compare: 1800,
  clash: 2200,
  reveal: 2200,
}

const COMPACT_PHASE_MS: Record<Exclude<FightPhase, 'idle' | 'done'>, number> = {
  introA: 550,
  introB: 550,
  battle: 1200,
  compare: 900,
  clash: 1100,
  reveal: 1400,
}

export function FightSequence({
  fighterA,
  fighterB,
  result,
  arena,
  autoStart = true,
  compact = false,
  hideReplay = false,
  largeMath = false,
  showPowerValues = false,
  onComplete,
}: FightSequenceProps) {
  const [phase, setPhase] = useState<FightPhase>(autoStart ? 'introA' : 'idle')
  const [hpA, setHpA] = useState(100)
  const [hpB, setHpB] = useState(100)
  const [flash, setFlash] = useState(0)

  const fxA = useMemo(() => getAbilityFx(fighterA), [fighterA])
  const fxB = useMemo(() => getAbilityFx(fighterB), [fighterB])

  useEffect(() => {
    if (phase === 'idle' || phase === 'done') return
    const ms = (compact ? COMPACT_PHASE_MS : PHASE_MS)[phase as keyof typeof PHASE_MS] ?? 1000
    const timer = window.setTimeout(() => {
      const order: FightPhase[] = ['introA', 'introB', 'battle', 'compare', 'clash', 'reveal', 'done']
      const idx = order.indexOf(phase)
      const next = order[idx + 1] ?? 'done'
      setPhase(next)
      if (next === 'done') onComplete?.()
    }, ms)
    return () => window.clearTimeout(timer)
  }, [phase, onComplete, compact])

  useEffect(() => {
    if (phase === 'introA') {
      playFightCue('intro')
      playFightCue(fxA.cue)
    }
    if (phase === 'introB') {
      playFightCue('intro')
      playFightCue(fxB.cue)
    }
    if (phase === 'battle') {
      playFightCue('whoosh')
      // Both fighters open with their signature + punches
      playFightCue(fxA.cue)
      playFightCue(fxB.cue)
      playFightCue('impact')
      let tick = 0
      const id = window.setInterval(() => {
        tick += 1
        playFightCue(tick % 2 === 0 ? 'whoosh' : 'impact')
        // Alternate ability cues so neither side goes silent
        playFightCue(tick % 2 === 0 ? fxA.cue : fxB.cue)
        setFlash((f) => f + 1)
      }, 340)
      return () => window.clearInterval(id)
    }
    if (phase === 'compare') {
      playFightCue('blast')
      playFightCue(fxA.cue)
      playFightCue(fxB.cue)
    }
    if (phase === 'clash') {
      playFightCue('clash')
      playFightCue(fxA.cue)
      playFightCue(fxB.cue)
      let tick = 0
      const id = window.setInterval(() => {
        tick += 1
        playFightCue('impact')
        playFightCue(tick % 2 === 0 ? fxB.cue : fxA.cue)
        setFlash((f) => f + 1)
      }, 240)
      return () => window.clearInterval(id)
    }
    if (phase === 'reveal') {
      if (result.winner === 'draw') {
        playFightCue('draw')
      } else if (result.winnerHero) {
        playVictoryStinger(result.winnerHero)
      } else {
        playFightCue('reveal')
      }
    }
    return undefined
  }, [phase, result.winner, result.winnerHero, fxA.cue, fxB.cue])

  useEffect(() => {
    if (phase !== 'battle' && phase !== 'clash') return
    const id = window.setInterval(() => {
      setHpA((h) => Math.max(result.winner === 'a' ? 28 : result.winner === 'draw' ? 40 : 5, h - (4 + Math.random() * 6)))
      setHpB((h) => Math.max(result.winner === 'b' ? 28 : result.winner === 'draw' ? 40 : 5, h - (4 + Math.random() * 6)))
    }, 180)
    return () => window.clearInterval(id)
  }, [phase, result.winner])

  useEffect(() => {
    setPhase(autoStart ? 'introA' : 'idle')
    setHpA(100)
    setHpB(100)
    setFlash(0)
  }, [fighterA.id, fighterB.id, autoStart])

  function replay() {
    setHpA(100)
    setHpB(100)
    setFlash(0)
    setPhase('introA')
  }

  const shake = phase === 'clash' || phase === 'battle'
  const heavyShake = phase === 'clash'
  const combatActive = phase === 'battle' || phase === 'compare' || phase === 'clash'

  return (
    <motion.div
      className="relative min-h-[280px] overflow-hidden rounded-2xl border border-white/10 bg-slate-950/70 sm:min-h-[420px] sm:rounded-3xl"
      animate={
        heavyShake
          ? { x: [0, -8, 8, -5, 5, -3, 3, 0], y: [0, 4, -4, 3, -2, 0] }
          : shake
            ? { x: [0, -3, 3, -2, 2, 0], y: [0, 1, -1, 0] }
            : { x: 0, y: 0 }
      }
      transition={{ repeat: shake ? Infinity : 0, duration: heavyShake ? 0.2 : 0.32 }}
    >
      <div className="absolute inset-0 opacity-40" style={arenaBackground(arena)} />

      <ArenaCombatParticles
        colorA={fxA.accent}
        colorB={fxB.accent}
        active={combatActive}
        heavy={phase === 'clash'}
      />

      {/* Aura beams */}
      <AnimatePresence>
        {combatActive && (
          <>
            <motion.div
              key="beam-a"
              className="pointer-events-none absolute left-[8%] top-1/2 h-40 w-40 -translate-y-1/2 rounded-full blur-3xl"
              style={{ background: fighterA.secondaryColor }}
              initial={{ opacity: 0, scale: 0.6 }}
              animate={{ opacity: [0.2, 0.55, 0.2], scale: [0.8, 1.2, 0.8] }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.8, repeat: Infinity }}
            />
            <motion.div
              key="beam-b"
              className="pointer-events-none absolute right-[8%] top-1/2 h-40 w-40 -translate-y-1/2 rounded-full blur-3xl"
              style={{ background: fighterB.secondaryColor }}
              initial={{ opacity: 0, scale: 0.6 }}
              animate={{ opacity: [0.2, 0.55, 0.2], scale: [0.8, 1.2, 0.8] }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.8, repeat: Infinity, delay: 0.15 }}
            />
          </>
        )}
      </AnimatePresence>

      {/* Per-hero signature ability VFX — both fire in battle/clash (intros stay solo) */}
      <AbilityVfx
        fx={fxA}
        side="left"
        phase={phase === 'introB' ? 'idle' : phase}
        intensity={phase === 'battle' || phase === 'clash' ? 1 : 0.95}
      />
      <AbilityVfx
        fx={fxB}
        side="right"
        phase={phase === 'introA' ? 'idle' : phase}
        intensity={phase === 'battle' || phase === 'clash' ? 1 : 0.95}
      />

      {/* Symmetric hand punches for both fighters */}
      <DualPunchVfx fxA={fxA} fxB={fxB} phase={phase} flash={flash} />

      {/* Clash flash — kept and enriched */}
      <AnimatePresence>
        {(phase === 'clash' || (phase === 'battle' && flash % 2 === 1)) && (
          <motion.div
            key={`flash-${flash}`}
            className="pointer-events-none absolute inset-0 z-20"
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, phase === 'clash' ? 0.7 : 0.45, 0] }}
            exit={{ opacity: 0 }}
            transition={{ duration: phase === 'clash' ? 0.22 : 0.25 }}
            style={{
              background:
                phase === 'clash'
                  ? `radial-gradient(circle at 50% 45%, rgba(255,255,255,0.85), ${fxA.secondary}55 28%, ${fxB.secondary}45 42%, transparent 68%)`
                  : 'radial-gradient(circle at 50% 50%, rgba(255,255,255,0.25), transparent 50%)',
            }}
          />
        )}
      </AnimatePresence>

      {/* Center clash spark — final clash stay */}
      <AnimatePresence>
        {phase === 'clash' && (
          <motion.div
            key="spark"
            className="pointer-events-none absolute left-1/2 top-[42%] z-30 -translate-x-1/2 -translate-y-1/2"
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: [0.4, 1.8, 1.1], opacity: [0, 1, 0.75], rotate: [0, 25, -15, 10] }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.45, repeat: Infinity, repeatType: 'mirror' }}
          >
            <div
              className="h-28 w-28 rounded-full blur-md"
              style={{
                background: `radial-gradient(circle, #fff, ${fxA.accent}, ${fxB.accent}, transparent 70%)`,
              }}
            />
            <motion.div
              className="absolute inset-0 rounded-full border-2"
              style={{ borderColor: `${fxA.primary}aa` }}
              animate={{ scale: [1, 1.6], opacity: [0.8, 0] }}
              transition={{ duration: 0.4, repeat: Infinity }}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Impact ring pulses during battle hits */}
      <AnimatePresence>
        {phase === 'battle' && flash > 0 && (
          <motion.div
            key={`impact-ring-${flash}`}
            className="pointer-events-none absolute left-1/2 top-[42%] z-[18] h-24 w-24 -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/40"
            initial={{ scale: 0.3, opacity: 0.7 }}
            animate={{ scale: 2.2, opacity: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.35 }}
          />
        )}
      </AnimatePresence>

      <div className="relative z-10 p-4 sm:p-6">
        <div className="flex justify-between text-xs tracking-widest text-slate-400">
          <span>{arena.replace(/-/g, ' ').toUpperCase()}</span>
          <span>{phase.toUpperCase()}</span>
        </div>

        <div className="mt-4 grid grid-cols-[1fr_auto_1fr] items-center gap-2 sm:gap-6">
          <FighterPanel
            hero={fighterA}
            fx={fxA}
            hp={hpA}
            side="left"
            phase={phase}
            highlight={phase === 'introA' || (phase === 'reveal' && result.winner === 'a')}
            dim={phase === 'reveal' && result.winner === 'b'}
            shake={shake}
            largeMath={largeMath}
            showPowerValues={showPowerValues}
            power={result.powerA}
          />
          <div className="text-center">
            <motion.div
              className="font-display text-3xl sm:text-5xl text-rose-400"
              animate={
                shake
                  ? { scale: [1, 1.4, 1], rotate: [0, -10, 10, 0], textShadow: ['0 0 0px #fff', '0 0 28px #38bdf8', '0 0 0px #fff'] }
                  : {}
              }
              transition={{ repeat: shake ? Infinity : 0, duration: 0.32 }}
            >
              VS
            </motion.div>
            {combatActive && (
              <motion.div
                className="mt-1 text-[9px] tracking-widest text-slate-500 sm:text-[10px]"
                animate={{ opacity: [0.4, 1, 0.4] }}
                transition={{ duration: 0.8, repeat: Infinity }}
              >
                {fxA.family.toUpperCase()} × {fxB.family.toUpperCase()}
              </motion.div>
            )}
          </div>
          <FighterPanel
            hero={fighterB}
            fx={fxB}
            hp={hpB}
            side="right"
            phase={phase}
            highlight={phase === 'introB' || (phase === 'reveal' && result.winner === 'b')}
            dim={phase === 'reveal' && result.winner === 'a'}
            shake={shake}
            largeMath={largeMath}
            showPowerValues={showPowerValues}
            power={result.powerB}
          />
        </div>

        <AnimatePresence mode="wait">
          {(phase === 'compare' || phase === 'clash' || phase === 'reveal' || phase === 'done') && (
            <motion.div
              key="math"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className={`mx-auto mt-6 max-w-xl rounded-2xl border border-sky-400/30 bg-black/60 text-center ${
                largeMath ? 'p-5 sm:p-6' : 'p-4'
              }`}
            >
              <div className={largeMath ? 'text-sky-100' : 'text-sky-300'}>
                <MathExpression
                  base={fighterA.base}
                  exponent={fighterA.exponent}
                  power={result.powerA}
                  showPower={!largeMath || showPowerValues}
                  size={largeMath ? 'xl' : 'md'}
                />
              </div>
              <div className={`my-1 ${largeMath ? 'text-base font-semibold text-slate-300' : 'text-slate-500'}`}>
                vs
              </div>
              <div className={largeMath ? 'text-rose-100' : 'text-rose-300'}>
                <MathExpression
                  base={fighterB.base}
                  exponent={fighterB.exponent}
                  power={result.powerB}
                  showPower={!largeMath || showPowerValues}
                  size={largeMath ? 'xl' : 'md'}
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {(phase === 'reveal' || phase === 'done') && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="mx-auto mt-6 max-w-2xl rounded-2xl border-2 border-amber-400/50 bg-black/70 px-4 py-5 text-center"
            >
              {result.winner === 'draw' ? (
                <>
                  <div className="font-display text-2xl text-amber-300">SPECTACULAR DRAW</div>
                  <p className="mt-2 text-slate-300">{result.explanation}</p>
                </>
              ) : (
                <>
                  <div className="font-display text-2xl text-amber-300">WINNER: {result.winnerHero?.name}</div>
                  {result.winnerHero && (
                    <div className="mx-auto mt-4 flex justify-center">
                      <VictoryDance hero={result.winnerHero} size={120} compact />
                    </div>
                  )}
                  <p className="mt-2 text-slate-300">{result.explanation}</p>
                  <p className="mt-2 text-xs text-slate-500 italic">{result.winnerHero?.victoryAnimation}</p>
                  {result.winnerHero && (
                    <p className="mt-1 text-xs tracking-wide" style={{ color: getAbilityFx(result.winnerHero).accent }}>
                      Finisher · {getAbilityFx(result.winnerHero).label}
                    </p>
                  )}
                </>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {!hideReplay && (phase === 'done' || phase === 'idle') && (
          <div className="mt-6 flex justify-center gap-3">
            <button type="button" className="btn-secondary text-xs" onClick={replay}>
              REPLAY
            </button>
          </div>
        )}
      </div>
    </motion.div>
  )
}

function FighterPanel({
  hero,
  fx,
  hp,
  side,
  phase,
  highlight,
  dim,
  shake,
  largeMath = false,
  showPowerValues = false,
  power,
}: {
  hero: Hero
  fx: ReturnType<typeof getAbilityFx>
  hp: number
  side: 'left' | 'right'
  phase: FightPhase
  highlight: boolean
  dim: boolean
  shake: boolean
  largeMath?: boolean
  showPowerValues?: boolean
  power?: number
}) {
  const dashAmp = 22 * fx.dashIntensity
  const dashX = side === 'left' ? [0, dashAmp, -dashAmp * 0.35, dashAmp * 0.7, 0] : [0, -dashAmp, dashAmp * 0.35, -dashAmp * 0.7, 0]
  const introX = side === 'left' ? [-40, 0] : [40, 0]
  const windup =
    (phase === 'introA' && side === 'left') || (phase === 'introB' && side === 'right')

  let animate: Record<string, number | number[]> = { x: 0, scale: 1 }
  if (phase === 'introA' && side === 'left') animate = { x: introX, scale: [0.92, fx.windupScale] }
  if (phase === 'introB' && side === 'right') animate = { x: introX, scale: [0.92, fx.windupScale] }
  if (phase === 'battle') {
    // Both sides punch / dash — mirrored so neither idles
    animate = {
      x: dashX,
      y: [0, -8 * fx.dashIntensity, 5, -3, 0],
      rotate: side === 'left' ? [0, -8, 6, -4, 0] : [0, 8, -6, 4, 0],
      scale: [1, 1.08, 0.96, 1.06, 1],
    }
  }
  if (phase === 'compare') {
    animate = {
      x: side === 'left' ? [0, 14, 10] : [0, -14, -10],
      scale: [1, fx.windupScale, 1.1],
      rotate: side === 'left' ? [0, -6, -3] : [0, 6, 3],
    }
  }
  // Clash: both fighters locked in — dual wind-up punches into the spark
  if (phase === 'clash') {
    animate = {
      x: side === 'left' ? [0, 48, 30, 46, 34] : [0, -48, -30, -46, -34],
      scale: [1, 1.14, 1.04, 1.16, 1.08],
      y: [0, -6, 3, -5, 0],
      rotate: side === 'left' ? [0, -10, 4, -8, 0] : [0, 10, -4, 8, 0],
    }
  }
  if (shake && phase !== 'clash' && phase !== 'battle' && phase !== 'compare') {
    animate = { x: side === 'left' ? [0, 8, -4, 0] : [0, -8, 4, 0] }
  }

  // Winner reveal: seed-stable victory bounce/spin on the victorious panel
  const isVictoryPose = highlight && (phase === 'reveal' || phase === 'done')
  const victoryDance = isVictoryPose ? getVictoryDance(hero) : null
  if (victoryDance) {
    const y = victoryDance.bouncePx * 0.7
    animate = {
      y: [0, -y, 0, -y * 0.5, 0],
      scale: [1, 1 + victoryDance.intensity * 0.12, 1, 1.06, 1],
      rotate:
        victoryDance.style === 'spin' || victoryDance.style === 'swirl'
          ? [0, victoryDance.spinDeg * 0.25, -victoryDance.spinDeg * 0.1, 0]
          : [0, -8, 6, -4, 0],
    }
  }

  return (
    <motion.div
      className={`relative text-center ${dim ? 'opacity-40 grayscale' : ''} ${highlight ? 'drop-shadow-[0_0_20px_rgba(56,189,248,0.6)]' : ''}`}
      animate={animate}
      transition={{
        repeat: phase === 'battle' || phase === 'clash' || isVictoryPose ? Infinity : 0,
        duration: victoryDance
          ? victoryDance.duration
          : phase === 'battle'
            ? 0.42
            : phase === 'clash'
              ? 0.3
              : 0.55,
        ease: 'easeInOut',
      }}
    >
      {(phase === 'battle' || phase === 'clash' || phase === 'compare' || highlight || windup) && (
        <motion.div
          className="pointer-events-none absolute left-1/2 top-1/2 h-36 w-36 -translate-x-1/2 -translate-y-1/2 rounded-full"
          style={{
            boxShadow: `0 0 40px 12px ${hero.accentColor}55, inset 0 0 30px ${hero.secondaryColor}44`,
          }}
          animate={{ opacity: [0.35, 0.85, 0.35], scale: [0.9, 1.18, 0.9] }}
          transition={{ duration: 0.55, repeat: Infinity }}
        />
      )}
      <HeroArt
        hero={hero}
        size={140}
        animated={highlight || shake || windup || phase === 'battle' || phase === 'clash' || phase === 'compare'}
      />
      {(phase === 'battle' || phase === 'clash') && (
        <motion.div
          className="pointer-events-none absolute left-1/2 top-[38%] z-10 h-4 w-10 -translate-x-1/2 rounded-full"
          style={{
            background: `linear-gradient(${side === 'left' ? 90 : 270}deg, ${fx.accent}, transparent)`,
            boxShadow: `0 0 12px ${fx.secondary}`,
          }}
          animate={{
            x: side === 'left' ? [0, 28, 8] : [0, -28, -8],
            opacity: [0.35, 1, 0.4],
            scaleX: [0.6, 1.2, 0.7],
          }}
          transition={{ duration: 0.35, repeat: Infinity, delay: side === 'right' ? 0.12 : 0 }}
        />
      )}
      <div className="mt-2 font-display text-sm sm:text-base" style={{ color: hero.mainColor }}>
        {hero.name}
      </div>
      <div
        className={
          largeMath
            ? side === 'left'
              ? 'mt-1 text-sky-100 drop-shadow-[0_1px_2px_rgba(0,0,0,0.9)]'
              : 'mt-1 text-rose-100 drop-shadow-[0_1px_2px_rgba(0,0,0,0.9)]'
            : 'text-xs text-slate-300'
        }
      >
        <MathExpression
          base={hero.base}
          exponent={hero.exponent}
          power={largeMath && showPowerValues ? power : undefined}
          showPower={Boolean(largeMath && showPowerValues && power !== undefined)}
          size={largeMath ? 'lg' : 'md'}
        />
      </div>
      <div className="mx-auto mt-2 h-2 max-w-[140px] overflow-hidden rounded-full bg-slate-800">
        <div
          className="h-full transition-all duration-200"
          style={{ width: `${hp}%`, background: hero.secondaryColor }}
        />
      </div>
    </motion.div>
  )
}

function arenaBackground(arena: string): CSSProperties {
  const map: Record<string, string> = {
    'neon-colosseum': 'radial-gradient(circle at 50% 80%, rgba(56,189,248,0.35), transparent 55%), linear-gradient(180deg,#0f172a,#020617)',
    'void-rift': 'radial-gradient(circle at 50% 40%, rgba(99,102,241,0.4), transparent 50%), #02010a',
    'storm-spire': 'radial-gradient(circle at 30% 20%, rgba(56,189,248,0.35), transparent 45%), #0b1220',
    'ember-crater': 'radial-gradient(circle at 50% 100%, rgba(249,115,22,0.4), transparent 50%), #1a0505',
    'crystal-arena': 'radial-gradient(circle at 70% 30%, rgba(233,213,255,0.35), transparent 45%), #0a1020',
  }
  return { background: map[arena] ?? map['neon-colosseum'] }
}
