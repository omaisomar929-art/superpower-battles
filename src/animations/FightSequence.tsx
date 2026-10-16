import { useEffect, useState, type CSSProperties } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import type { BattleResult } from '../battleEngine'
import type { Hero } from '../heroes/types'
import { HeroArt } from '../heroes/HeroArt'
import { formatPower } from '../mathEngine'

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
  battle: 2200,
  compare: 1800,
  clash: 1600,
  reveal: 2000,
}

export function FightSequence({ fighterA, fighterB, result, arena, autoStart = true, onComplete }: FightSequenceProps) {
  const [phase, setPhase] = useState<FightPhase>(autoStart ? 'introA' : 'idle')
  const [hpA, setHpA] = useState(100)
  const [hpB, setHpB] = useState(100)

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
  }, [fighterA.id, fighterB.id, autoStart])

  function replay() {
    setHpA(100)
    setHpB(100)
    setPhase('introA')
  }

  const shake = phase === 'clash' || phase === 'battle'

  return (
    <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-slate-950/70 min-h-[420px]">
      <div className="absolute inset-0 opacity-40" style={arenaBackground(arena)} />
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
            highlight={phase === 'introA' || (phase === 'reveal' && result.winner === 'a')}
            dim={phase === 'reveal' && result.winner === 'b'}
            shake={shake}
          />
          <div className="text-center">
            <motion.div
              className="font-display text-3xl sm:text-5xl text-rose-400"
              animate={shake ? { scale: [1, 1.2, 1], rotate: [0, -4, 4, 0] } : {}}
              transition={{ repeat: shake ? Infinity : 0, duration: 0.35 }}
            >
              VS
            </motion.div>
          </div>
          <FighterPanel
            hero={fighterB}
            hp={hpB}
            side="right"
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
              className="mx-auto mt-6 max-w-xl rounded-2xl border border-fuchsia-400/30 bg-black/60 p-4 text-center font-mono"
            >
              <div className="text-sky-300">
                {result.expressionA} = {formatPower(result.powerA)}
              </div>
              <div className="my-1 text-slate-500">vs</div>
              <div className="text-rose-300">
                {result.expressionB} = {formatPower(result.powerB)}
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
    </div>
  )
}

function FighterPanel({
  hero,
  hp,
  side,
  highlight,
  dim,
  shake,
}: {
  hero: Hero
  hp: number
  side: 'left' | 'right'
  highlight: boolean
  dim: boolean
  shake: boolean
}) {
  return (
    <motion.div
      className={`text-center ${dim ? 'opacity-40 grayscale' : ''} ${highlight ? 'drop-shadow-[0_0_20px_rgba(232,121,249,0.6)]' : ''}`}
      animate={shake ? { x: side === 'left' ? [0, 8, -4, 0] : [0, -8, 4, 0] } : { x: 0 }}
      transition={{ repeat: shake ? Infinity : 0, duration: 0.4 }}
    >
      <HeroArt hero={hero} size={140} animated={highlight || shake} />
      <div className="mt-2 font-display text-sm sm:text-base" style={{ color: hero.mainColor }}>
        {hero.name}
      </div>
      <div className="font-mono text-xs text-slate-300">{hero.expression}</div>
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
    'neon-colosseum': 'radial-gradient(circle at 50% 80%, rgba(168,85,247,0.35), transparent 55%), linear-gradient(180deg,#0f172a,#020617)',
    'void-rift': 'radial-gradient(circle at 50% 40%, rgba(99,102,241,0.4), transparent 50%), #02010a',
    'storm-spire': 'radial-gradient(circle at 30% 20%, rgba(56,189,248,0.35), transparent 45%), #0b1220',
    'ember-crater': 'radial-gradient(circle at 50% 100%, rgba(249,115,22,0.4), transparent 50%), #1a0505',
    'crystal-arena': 'radial-gradient(circle at 70% 30%, rgba(233,213,255,0.35), transparent 45%), #0a1020',
  }
  return { background: map[arena] ?? map['neon-colosseum'] }
}
