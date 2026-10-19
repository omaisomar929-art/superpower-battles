import { useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { playFightCue } from '../../audio/soundEngine'
import { createMeteorRound, type MeteorRound } from '../../minigames/engines'
import type { PlayerMode } from '../../minigames/types'
import {
  ExprButton,
  GameOverBanner,
  MiniGameChrome,
  ScoreHud,
  SplitLanes,
} from './shared'

const START_LIVES = 3

function Lane({
  round,
  locked,
  onPick,
  accent,
}: {
  round: MeteorRound | null
  locked: boolean
  onPick: (side: 'left' | 'right') => void
  accent: string
}) {
  if (!round) return null
  return (
    <div className="relative h-full min-h-[20rem] w-full">
      <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-amber-900/50 to-transparent" />
      <div className="absolute inset-x-0 bottom-2 text-center text-[10px] uppercase tracking-[0.3em] text-amber-200/70">
        City
      </div>
      <motion.div
        key={round.id}
        className="absolute left-1/2 top-4 flex w-[92%] -translate-x-1/2 flex-col items-center gap-3"
        initial={{ y: -40, opacity: 0 }}
        animate={{ y: '58%', opacity: 1 }}
        transition={{ duration: round.fallMs / 1000, ease: 'linear' }}
      >
        <div
          className="rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-[0.25em] text-white/90"
          style={{ background: accent }}
        >
          Meteor
        </div>
        <div className="flex w-full items-center justify-center gap-3">
          <ExprButton
            base={round.left.base}
            exponent={round.left.exponent}
            onClick={() => onPick('left')}
            disabled={locked}
            tone="sky"
          />
          <span className="font-display text-xs tracking-widest text-slate-400">VS</span>
          <ExprButton
            base={round.right.base}
            exponent={round.right.exponent}
            onClick={() => onPick('right')}
            disabled={locked}
            tone="rose"
          />
        </div>
        <p className="text-center text-xs text-slate-400">Tap the stronger</p>
      </motion.div>
    </div>
  )
}

export function MeteorGame({ mode }: { mode: PlayerMode }) {
  const navigate = useNavigate()
  const [scores, setScores] = useState({ p1: 0, p2: 0 })
  const [lives, setLives] = useState({ p1: START_LIVES, p2: START_LIVES })
  const [diff, setDiff] = useState(1)
  const [roundP1, setRoundP1] = useState<MeteorRound | null>(null)
  const [roundP2, setRoundP2] = useState<MeteorRound | null>(null)
  const [lockedP1, setLockedP1] = useState(false)
  const [lockedP2, setLockedP2] = useState(false)
  const [over, setOver] = useState(false)
  const timers = useRef<number[]>([])

  const clearTimers = () => {
    for (const t of timers.current) window.clearTimeout(t)
    timers.current = []
  }

  const spawn = useCallback(
    (forMode: PlayerMode = mode) => {
      const d = diff
      setRoundP1(createMeteorRound(d))
      setLockedP1(false)
      if (forMode === 2) {
        setRoundP2(createMeteorRound(d))
        setLockedP2(false)
      } else {
        setRoundP2(null)
      }
    },
    [diff, mode],
  )

  const reset = () => {
    clearTimers()
    setScores({ p1: 0, p2: 0 })
    setLives({ p1: START_LIVES, p2: START_LIVES })
    setDiff(1)
    setOver(false)
    setLockedP1(false)
    setLockedP2(false)
    setRoundP1(createMeteorRound(1))
    setRoundP2(mode === 2 ? createMeteorRound(1) : null)
  }

  useEffect(() => {
    reset()
    return clearTimers
    // eslint-disable-next-line react-hooks/exhaustive-deps -- mount only
  }, [mode])

  useEffect(() => {
    if (over || !roundP1) return
    const t = window.setTimeout(() => {
      if (lockedP1) return
      setLockedP1(true)
      playFightCue('impact')
      setLives((prev) => {
        const next = { ...prev, p1: prev.p1 - 1 }
        if (next.p1 <= 0 && (mode === 1 || next.p2 <= 0)) setOver(true)
        else if (mode === 2 && next.p1 <= 0 && next.p2 <= 0) setOver(true)
        return next
      })
      timers.current.push(window.setTimeout(() => spawn(), 500))
    }, roundP1.fallMs)
    timers.current.push(t)
    return () => window.clearTimeout(t)
  }, [roundP1, lockedP1, over, mode, spawn])

  useEffect(() => {
    if (mode !== 2 || over || !roundP2) return
    const t = window.setTimeout(() => {
      if (lockedP2) return
      setLockedP2(true)
      playFightCue('impact')
      setLives((prev) => {
        const next = { ...prev, p2: prev.p2 - 1 }
        if (next.p1 <= 0 && next.p2 <= 0) setOver(true)
        return next
      })
      timers.current.push(window.setTimeout(() => spawn(), 500))
    }, roundP2.fallMs)
    timers.current.push(t)
    return () => window.clearTimeout(t)
  }, [roundP2, lockedP2, over, mode, spawn])

  function answer(player: 'p1' | 'p2', side: 'left' | 'right') {
    if (over) return
    const round = player === 'p1' ? roundP1 : roundP2
    const locked = player === 'p1' ? lockedP1 : lockedP2
    if (!round || locked) return
    if (player === 'p1') setLockedP1(true)
    else setLockedP2(true)

    const correct = side === round.stronger
    if (correct) {
      playFightCue('reveal')
      setScores((s) => ({ ...s, [player]: s[player] + 10 + diff }))
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
    timers.current.push(window.setTimeout(() => spawn(), 450))
  }

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'a' || e.key === 'A' || e.key === '1') answer('p1', 'left')
      if (e.key === 'd' || e.key === 'D' || e.key === '2') answer('p1', 'right')
      if (mode === 2) {
        if (e.key === 'ArrowLeft' || e.key === 'j' || e.key === 'J') answer('p2', 'left')
        if (e.key === 'ArrowRight' || e.key === 'l' || e.key === 'L') answer('p2', 'right')
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  })

  const bothDead = mode === 1 ? lives.p1 <= 0 : lives.p1 <= 0 && lives.p2 <= 0
  const showOver = over || bothDead

  return (
    <MiniGameChrome title="Power Meteor Shower" accent="#38bdf8">
      <ScoreHud mode={mode} scores={scores} lives={lives} />
      <p className="mb-2 text-center text-sm text-slate-400">
        Tap the stronger power before impact · True math (n⁰ = 1)
        {mode === 2 ? ' · P1: A/D · P2: ←/→' : ' · Keys: A / D'}
      </p>
      <div className="relative flex min-h-0 flex-1 flex-col">
        <SplitLanes
          mode={mode}
          single={
            <Lane
              round={roundP1}
              locked={lockedP1}
              onPick={(side) => answer('p1', side)}
              accent="#38bdf8"
            />
          }
          left={
            <Lane
              round={roundP1}
              locked={lockedP1 || lives.p1 <= 0}
              onPick={(side) => answer('p1', side)}
              accent="#38bdf8"
            />
          }
          right={
            <Lane
              round={roundP2}
              locked={lockedP2 || lives.p2 <= 0}
              onPick={(side) => answer('p2', side)}
              accent="#fb7185"
            />
          }
        />
        {showOver ? (
          <GameOverBanner
            mode={mode}
            scores={scores}
            onAgain={reset}
            onHub={() => navigate('/minigames')}
          />
        ) : null}
      </div>
    </MiniGameChrome>
  )
}
