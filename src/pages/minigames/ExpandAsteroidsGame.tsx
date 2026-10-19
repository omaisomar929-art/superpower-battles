import { useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { playFightCue } from '../../audio/soundEngine'
import { createExpandRound, type ExpandRound } from '../../minigames/engines'
import type { PlayerMode } from '../../minigames/types'
import { GameOverBanner, MiniGameChrome, ScoreHud, SplitLanes } from './shared'

function ExpandLane({
  round,
  locked,
  onPick,
  tone,
}: {
  round: ExpandRound | null
  locked: boolean
  onPick: (choiceId: string) => void
  tone: 'sky' | 'rose'
}) {
  if (!round) return null
  const border = tone === 'sky' ? 'border-sky-400/40' : 'border-rose-400/40'
  return (
    <div className="flex h-full min-h-[20rem] flex-col gap-3 p-3">
      <div className={`rounded-2xl border ${border} bg-black/40 px-4 py-5 text-center`}>
        <p className="text-[10px] uppercase tracking-[0.3em] text-slate-400">Expand</p>
        <p className="mt-1 font-display text-4xl tabular-nums text-amber-100 sm:text-5xl">{round.value}</p>
        <motion.div
          key={round.id}
          className="mx-auto mt-3 h-2 max-w-xs overflow-hidden rounded-full bg-white/10"
        >
          <motion.div
            className="h-full bg-amber-400"
            initial={{ width: '100%' }}
            animate={{ width: '0%' }}
            transition={{ duration: round.timeoutMs / 1000, ease: 'linear' }}
          />
        </motion.div>
      </div>
      <div className="grid flex-1 grid-cols-1 gap-2">
        {round.choices.map((c) => (
          <button
            key={c.id}
            type="button"
            disabled={locked}
            onClick={() => onPick(c.id)}
            className="min-h-14 rounded-xl border border-amber-300/30 bg-amber-500/15 px-3 py-3 text-left font-mono text-base font-semibold text-amber-50 transition hover:bg-amber-500/30 active:scale-[0.99] disabled:opacity-50 sm:text-lg"
          >
            {c.label}
          </button>
        ))}
      </div>
    </div>
  )
}

export function ExpandAsteroidsGame({ mode }: { mode: PlayerMode }) {
  const navigate = useNavigate()
  const [scores, setScores] = useState({ p1: 0, p2: 0 })
  const [lives, setLives] = useState({ p1: 3, p2: 3 })
  const [diff, setDiff] = useState(1)
  const [roundP1, setRoundP1] = useState<ExpandRound | null>(null)
  const [roundP2, setRoundP2] = useState<ExpandRound | null>(null)
  const [lockedP1, setLockedP1] = useState(false)
  const [lockedP2, setLockedP2] = useState(false)
  const [over, setOver] = useState(false)
  const timers = useRef<number[]>([])

  const clearTimers = () => {
    for (const t of timers.current) window.clearTimeout(t)
    timers.current = []
  }

  const spawn = useCallback(() => {
    setRoundP1(createExpandRound(diff))
    setLockedP1(false)
    if (mode === 2) {
      setRoundP2(createExpandRound(diff))
      setLockedP2(false)
    } else setRoundP2(null)
  }, [diff, mode])

  const reset = () => {
    clearTimers()
    setScores({ p1: 0, p2: 0 })
    setLives({ p1: 3, p2: 3 })
    setDiff(1)
    setOver(false)
    setRoundP1(createExpandRound(1))
    setRoundP2(mode === 2 ? createExpandRound(1) : null)
    setLockedP1(false)
    setLockedP2(false)
  }

  useEffect(() => {
    reset()
    return clearTimers
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode])

  useEffect(() => {
    if (!roundP1 || over || lockedP1) return
    const t = window.setTimeout(() => {
      setLockedP1(true)
      playFightCue('impact')
      setLives((prev) => {
        const next = { ...prev, p1: prev.p1 - 1 }
        if (mode === 1 && next.p1 <= 0) setOver(true)
        if (mode === 2 && next.p1 <= 0 && next.p2 <= 0) setOver(true)
        return next
      })
      timers.current.push(window.setTimeout(() => spawn(), 400))
    }, roundP1.timeoutMs)
    timers.current.push(t)
    return () => window.clearTimeout(t)
  }, [roundP1, lockedP1, over, mode, spawn])

  useEffect(() => {
    if (mode !== 2 || !roundP2 || over || lockedP2) return
    const t = window.setTimeout(() => {
      setLockedP2(true)
      playFightCue('impact')
      setLives((prev) => {
        const next = { ...prev, p2: prev.p2 - 1 }
        if (next.p1 <= 0 && next.p2 <= 0) setOver(true)
        return next
      })
      timers.current.push(window.setTimeout(() => spawn(), 400))
    }, roundP2.timeoutMs)
    timers.current.push(t)
    return () => window.clearTimeout(t)
  }, [roundP2, lockedP2, over, mode, spawn])

  function pick(player: 'p1' | 'p2', choiceId: string) {
    if (over) return
    const round = player === 'p1' ? roundP1 : roundP2
    const locked = player === 'p1' ? lockedP1 : lockedP2
    if (!round || locked) return
    if (player === 'p1') setLockedP1(true)
    else setLockedP2(true)
    const choice = round.choices.find((c) => c.id === choiceId)
    if (!choice) return
    if (choice.correct) {
      playFightCue('reveal')
      setScores((s) => ({ ...s, [player]: s[player] + 12 }))
      setDiff((d) => d + 1)
    } else {
      playFightCue('impact')
      setLives((prev) => {
        const next = { ...prev, [player]: prev[player] - 1 }
        if (mode === 1 && next.p1 <= 0) setOver(true)
        if (mode === 2 && next.p1 <= 0 && next.p2 <= 0) setOver(true)
        return next
      })
    }
    timers.current.push(window.setTimeout(() => spawn(), 400))
  }

  return (
    <MiniGameChrome title="Expand Asteroids" accent="#fbbf24">
      <ScoreHud mode={mode} scores={scores} lives={lives} />
      <p className="mb-2 text-center text-sm text-slate-400">
        Tap the correct expanded form before the timer hits zero
      </p>
      <div className="relative flex min-h-0 flex-1 flex-col">
        <SplitLanes
          mode={mode}
          single={
            <ExpandLane round={roundP1} locked={lockedP1} onPick={(id) => pick('p1', id)} tone="sky" />
          }
          left={
            <ExpandLane
              round={roundP1}
              locked={lockedP1 || lives.p1 <= 0}
              onPick={(id) => pick('p1', id)}
              tone="sky"
            />
          }
          right={
            <ExpandLane
              round={roundP2}
              locked={lockedP2 || lives.p2 <= 0}
              onPick={(id) => pick('p2', id)}
              tone="rose"
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
