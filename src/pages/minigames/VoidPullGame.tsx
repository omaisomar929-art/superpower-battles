import { useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { playFightCue } from '../../audio/soundEngine'
import { createVoidRound, type VoidItem, type VoidRound } from '../../minigames/engines'
import type { PlayerMode } from '../../minigames/types'
import { GameOverBanner, MiniGameChrome, ScoreHud, SplitLanes } from './shared'

function VoidField({
  round,
  disabled,
  saved,
  onTap,
}: {
  round: VoidRound | null
  disabled: boolean
  saved: Set<string>
  onTap: (item: VoidItem) => void
}) {
  if (!round) return null
  return (
    <div className="relative h-full min-h-[20rem] w-full overflow-hidden">
      <div className="absolute inset-x-0 top-3 z-10 text-center">
        <span className="rounded-full border border-pink-300/40 bg-pink-500/25 px-4 py-2 font-display text-sm tracking-[0.18em] text-pink-50">
          SAVE VALUES = {round.target}
        </span>
      </div>
      <motion.div
        className="absolute bottom-4 left-1/2 z-[1] h-24 w-24 -translate-x-1/2 rounded-full bg-black shadow-[0_0_40px_rgba(244,114,182,0.55)]"
        animate={{ scale: [1, 1.08, 1], opacity: [0.85, 1, 0.85] }}
        transition={{ duration: 2.2, repeat: Infinity }}
      />
      <p className="absolute bottom-2 left-1/2 z-[2] -translate-x-1/2 text-[10px] uppercase tracking-[0.3em] text-pink-200/70">
        Void
      </p>
      {round.items.map((item) => {
        if (saved.has(item.id)) return null
        return (
          <motion.button
            key={item.id}
            type="button"
            disabled={disabled}
            onClick={() => onTap(item)}
            className="absolute z-[5] min-h-14 min-w-[4.5rem] -translate-x-1/2 rounded-xl border border-pink-200/35 bg-pink-500/25 px-2 font-mono text-xl font-bold text-white active:scale-95 disabled:opacity-40"
            style={{ left: `${item.xPct}%` }}
            initial={{ top: '8%', opacity: 0.95 }}
            animate={{ top: '78%', opacity: 1 }}
            transition={{ duration: item.fallMs / 1000, ease: 'easeIn' }}
          >
            {item.expr.base}
            <sup className="text-[0.55em]">{item.expr.exponent}</sup>
          </motion.button>
        )
      })}
    </div>
  )
}

export function VoidPullGame({ mode }: { mode: PlayerMode }) {
  const navigate = useNavigate()
  const [scores, setScores] = useState({ p1: 0, p2: 0 })
  const [lives, setLives] = useState({ p1: 3, p2: 3 })
  const [diff, setDiff] = useState(1)
  const [roundP1, setRoundP1] = useState<VoidRound | null>(null)
  const [roundP2, setRoundP2] = useState<VoidRound | null>(null)
  const [savedP1, setSavedP1] = useState<Set<string>>(new Set())
  const [savedP2, setSavedP2] = useState<Set<string>>(new Set())
  const [over, setOver] = useState(false)
  const timers = useRef<number[]>([])

  const clearTimers = () => {
    for (const t of timers.current) window.clearTimeout(t)
    timers.current = []
  }

  const spawn = useCallback(() => {
    setRoundP1(createVoidRound(diff))
    setSavedP1(new Set())
    if (mode === 2) {
      setRoundP2(createVoidRound(diff))
      setSavedP2(new Set())
    } else setRoundP2(null)
  }, [diff, mode])

  const reset = () => {
    clearTimers()
    setScores({ p1: 0, p2: 0 })
    setLives({ p1: 3, p2: 3 })
    setDiff(1)
    setOver(false)
    setRoundP1(createVoidRound(1))
    setSavedP1(new Set())
    setRoundP2(mode === 2 ? createVoidRound(1) : null)
    setSavedP2(new Set())
  }

  useEffect(() => {
    reset()
    return clearTimers
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode])

  useEffect(() => {
    if (!roundP1 || over) return
    const maxFall = Math.max(
      ...roundP1.items.map((i) => i.fallMs),
      ...(roundP2?.items.map((i) => i.fallMs) ?? [0]),
    )
    const t = window.setTimeout(() => {
      setLives((prev) => {
        let next = { ...prev }
        const lost1 = roundP1.items.filter((i) => i.correct && !savedP1.has(i.id)).length
        if (lost1 > 0) {
          playFightCue('impact')
          next = { ...next, p1: next.p1 - lost1 }
        }
        if (mode === 2 && roundP2) {
          const lost2 = roundP2.items.filter((i) => i.correct && !savedP2.has(i.id)).length
          if (lost2 > 0) {
            playFightCue('impact')
            next = { ...next, p2: next.p2 - lost2 }
          }
        }
        if (mode === 1 && next.p1 <= 0) setOver(true)
        if (mode === 2 && next.p1 <= 0 && next.p2 <= 0) setOver(true)
        return next
      })
      setDiff((d) => d + 1)
      timers.current.push(window.setTimeout(() => spawn(), 350))
    }, maxFall + 60)
    timers.current.push(t)
    return () => window.clearTimeout(t)
  }, [roundP1, roundP2, over]) // eslint-disable-line react-hooks/exhaustive-deps

  function tap(player: 'p1' | 'p2', item: VoidItem) {
    if (over) return
    const setSaved = player === 'p1' ? setSavedP1 : setSavedP2
    const saved = player === 'p1' ? savedP1 : savedP2
    if (saved.has(item.id)) return
    setSaved(new Set(saved).add(item.id))
    if (item.correct) {
      playFightCue('reveal')
      setScores((s) => ({ ...s, [player]: s[player] + 10 }))
    } else {
      playFightCue('impact')
      setLives((prev) => {
        const next = { ...prev, [player]: prev[player] - 1 }
        if (mode === 1 && next.p1 <= 0) setOver(true)
        if (mode === 2 && next.p1 <= 0 && next.p2 <= 0) setOver(true)
        return next
      })
    }
  }

  return (
    <MiniGameChrome title="Void Black-Hole Pull" accent="#f472b6">
      <ScoreHud mode={mode} scores={scores} lives={lives} />
      <p className="mb-2 text-center text-sm text-slate-400">
        Rescue expressions that equal the target · distractors damage you · true math (n⁰ = 1)
      </p>
      <div className="relative flex min-h-0 flex-1 flex-col">
        <SplitLanes
          mode={mode}
          single={
            <VoidField round={roundP1} disabled={over} saved={savedP1} onTap={(i) => tap('p1', i)} />
          }
          left={
            <VoidField
              round={roundP1}
              disabled={over || lives.p1 <= 0}
              saved={savedP1}
              onTap={(i) => tap('p1', i)}
            />
          }
          right={
            <VoidField
              round={roundP2}
              disabled={over || lives.p2 <= 0}
              saved={savedP2}
              onTap={(i) => tap('p2', i)}
            />
          }
        />
        {(over || (lives.p1 <= 0 && (mode === 1 || lives.p2 <= 0))) && (
          <GameOverBanner
            mode={mode}
            scores={scores}
            onAgain={reset}
            onHub={() => navigate('/minigames')}
          />
        )}
      </div>
    </MiniGameChrome>
  )
}
