import { useEffect, useState, type CSSProperties } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import type { BattleResult } from '../battleEngine'
import type { Hero } from '../heroes/types'
import { HeroArt } from '../heroes/HeroArt'
import { MathExpression } from '../components/MathExpression'
import { playFightCue } from '../audio/soundEngine'

export type FightPhase = 'idle' | 'introA' | 'introB' | 'battle' | 'compare' | 'clash' | 'reveal' | 'done'

interface FightSequenceProps {
  fighterA: Hero
  fighterB: Hero
  result: BattleResult
  arena: string
  autoStart?: boolean
  onComplete?: () => void
}

const PHASE_MS: Record<Exclude<FightPhase, 'idle' | 'done'>, number> = {
  introA: 1200,
  introB: 1200,
  battle: 2400,
  compare: 1800,
  clash: 1800,
  reveal: 2200,
}

export function FightSequence({ fighterA, fighterB, result, arena, autoStart = true, onComplete }: FightSequenceProps) {
  const [phase, setPhase] = useState<FightPhase>(autoStart ? 'introA' : 'idle')
  const [hpA, setHpA] = useState(100)
  const [hpB, setHpB] = useState(100)
  const [flash, setFlash] = useState(0)

  useEffect(() => {
    if (phase === 'idle' || phase === 'done') return
    const timer = window.setTimeout(() => {
      const order: FightPhase[] = ['introA', 'introB', 'battle', 'compare', 'clash', 'reveal', 'done']
      const idx = order.indexOf(phase)
      const next = order[idx + 1] ?? 'done'
      setPhase(next)
      if (next === 'done') onComplete?.()
    }, PHASE_MS[phase as keyof typeof PHASE_MS] ?? 1000)
    return () => window.clearTimeout(timer)
  }, [phase, onComplete])

  useEffect(() => {
    if (phase === 'introA' || phase === 'introB') playFightCue('intro')
    if (phase === 'battle') {
      playFightCue('whoosh')
      const id = window.setInterval(() => {
        playFightCue(Math.random() > 0.5 ? 'whoosh' : 'impact')
        setFlash((f) => f + 1)
      }, 420)
      return () => window.clearInterval(id)
    }
    if (phase === 'compare') playFightCue('blast')
    if (phase === 'clash') {
      playFightCue('clash')
      const id = window.setInterval(() => {
        playFightCue('impact')
        setFlash((f) => f + 1)
      }, 280)
      return () => window.clearInterval(id)
    }
    if (phase === 'reveal') playFightCue(result.winner === 'draw' ? 'draw' : 'reveal')
    return undefined
  }, [phase, result.winner])

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

  return (
    <motion.div
      className="relative overflow-hidden rounded-3xl border border-white/10 bg-slate-950/70 min-h-[420px]"
      animate={
        heavyShake
          ? { x: [0, -6, 6, -4, 4, 0], y: [0, 3, -3, 2, -2, 0] }
          : shake
            ? { x: [0, -2, 2, 0] }
            : { x: 0, y: 0 }
      }
      transition={{ repeat: shake ? Infinity : 0, duration: heavyShake ? 0.22 : 0.35 }}
    >
      <div className="absolute inset-0 opacity-40" style={arenaBackground(arena)} />

      {/* Aura beams */}
      <AnimatePresence>
        {(phase === 'battle' || phase === 'clash') && (
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

      {/* Clash flash */}
      <AnimatePresence>
        {(phase === 'clash' || (phase === 'battle' && flash % 2 === 1)) && (
          <motion.div
            key={`flash-${flash}`}
            className="pointer-events-none absolute inset-0 z-20"
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 0.55, 0] }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            style={{
              background:
                phase === 'clash'
                  ? 'radial-gradient(circle at 50% 45%, rgba(255,255,255,0.75), rgba(56,189,248,0.35) 35%, transparent 65%)'
                  : 'radial-gradient(circle at 50% 50%, rgba(255,255,255,0.25), transparent 50%)',
            }}
          />
        )}
      </AnimatePresence>

      {/* Center clash spark */}
      <AnimatePresence>
        {phase === 'clash' && (
          <motion.div
            key="spark"
            className="pointer-events-none absolute left-1/2 top-[42%] z-30 -translate-x-1/2 -translate-y-1/2"
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: [0.4, 1.6, 1], opacity: [0, 1, 0.7], rotate: [0, 20, -10] }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5, repeat: Infinity, repeatType: 'mirror' }}
          >
            <div className="h-24 w-24 rounded-full bg-gradient-to-br from-white via-sky-300 to-amber-300 blur-md" />
          </motion.div>
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
            hp={hpA}
            side="left"
            phase={phase}
            highlight={phase === 'introA' || (phase === 'reveal' && result.winner === 'a')}
            dim={phase === 'reveal' && result.winner === 'b'}
            shake={shake}
          />
          <div className="text-center">
            <motion.div
              className="font-display text-3xl sm:text-5xl text-rose-400"
              animate={
                shake
                  ? { scale: [1, 1.35, 1], rotate: [0, -8, 8, 0], textShadow: ['0 0 0px #fff', '0 0 24px #38bdf8', '0 0 0px #fff'] }
                  : {}
              }
              transition={{ repeat: shake ? Infinity : 0, duration: 0.35 }}
            >
              VS
            </motion.div>
          </div>
          <FighterPanel
            hero={fighterB}
            hp={hpB}
            side="right"
            phase={phase}
            highlight={phase === 'introB' || (phase === 'reveal' && result.winner === 'b')}
            dim={phase === 'reveal' && result.winner === 'a'}
            shake={shake}
          />
        </div>

        <AnimatePresence mode="wait">
          {(phase === 'compare' || phase === 'clash' || phase === 'reveal' || phase === 'done') && (
            <motion.div
              key="math"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="mx-auto mt-6 max-w-xl rounded-2xl border border-sky-400/30 bg-black/60 p-4 text-center"
            >
              <div className="text-sky-300">
                <MathExpression base={fighterA.base} exponent={fighterA.exponent} power={result.powerA} showPower />
              </div>
              <div className="my-1 text-slate-500">vs</div>
              <div className="text-rose-300">
                <MathExpression base={fighterB.base} exponent={fighterB.exponent} power={result.powerB} showPower />
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
                  <p className="mt-2 text-slate-300">{result.explanation}</p>
                  <p className="mt-2 text-xs text-slate-500 italic">{result.winnerHero?.victoryAnimation}</p>
                </>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {(phase === 'done' || phase === 'idle') && (
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
  hp,
  side,
  phase,
  highlight,
  dim,
  shake,
}: {
  hero: Hero
  hp: number
  side: 'left' | 'right'
  phase: FightPhase
  highlight: boolean
  dim: boolean
  shake: boolean
}) {
  const dashX = side === 'left' ? [0, 28, -8, 18, 0] : [0, -28, 8, -18, 0]
  const introX = side === 'left' ? [-40, 0] : [40, 0]

  let animate: Record<string, number | number[]> = { x: 0 }
  if (phase === 'introA' && side === 'left') animate = { x: introX }
  if (phase === 'introB' && side === 'right') animate = { x: introX }
  if (phase === 'battle') animate = { x: dashX, y: [0, -6, 4, -2, 0] }
  if (phase === 'clash') animate = { x: side === 'left' ? [0, 40, 28] : [0, -40, -28], scale: [1, 1.08, 1.05] }
  if (shake && phase !== 'clash' && phase !== 'battle') {
    animate = { x: side === 'left' ? [0, 8, -4, 0] : [0, -8, 4, 0] }
  }

  return (
    <motion.div
      className={`relative text-center ${dim ? 'opacity-40 grayscale' : ''} ${highlight ? 'drop-shadow-[0_0_20px_rgba(56,189,248,0.6)]' : ''}`}
      animate={animate}
      transition={{
        repeat: phase === 'battle' ? Infinity : 0,
        duration: phase === 'battle' ? 0.45 : phase === 'clash' ? 0.35 : 0.55,
        ease: 'easeInOut',
      }}
    >
      {(phase === 'battle' || phase === 'clash' || highlight) && (
        <motion.div
          className="pointer-events-none absolute left-1/2 top-1/2 h-36 w-36 -translate-x-1/2 -translate-y-1/2 rounded-full"
          style={{
            boxShadow: `0 0 40px 12px ${hero.accentColor}55, inset 0 0 30px ${hero.secondaryColor}44`,
          }}
          animate={{ opacity: [0.35, 0.8, 0.35], scale: [0.9, 1.15, 0.9] }}
          transition={{ duration: 0.6, repeat: Infinity }}
        />
      )}
      <HeroArt hero={hero} size={140} animated={highlight || shake} />
      <div className="mt-2 font-display text-sm sm:text-base" style={{ color: hero.mainColor }}>
        {hero.name}
      </div>
      <div className="text-xs text-slate-300">
        <MathExpression base={hero.base} exponent={hero.exponent} />
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
