import { useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { playFightCue } from '../../audio/soundEngine'
import { createLaserRound, type LaserRound } from '../../minigames/engines'
import type { PlayerMode } from '../../minigames/types'
import { ExprButton, GameOverBanner, MiniGameChrome, ScoreHud, SplitLanes } from './shared'

function LaserLane({
  round,
  locked,
  onPick,
}: {
  round: LaserRound | null
  locked: boolean
  onPick: (side: 'left' | 'right') => void
}) {
  if (!round) return null
  return (
    <div className="relative flex h-full min-h-[20rem] flex-col items-center justify-center gap-6 p-4">
      <p className="text-center text-sm uppercase tracking-[0.25em] text-emerald-200/80">Which beam wins?</p>
      <div className="relative flex w-full max-w-md items-center justify-between gap-4">
        <motion.div
          key={`${round.id}-L`}
          className="h-1.5 flex-1 rounded-full bg-gradient-to-r from-sky-400 to-sky-200"
          initial={{ scaleX: 0.2, originX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ duration: round.collideMs / 1000, ease: 'easeIn' }}
        />
        <motion.div
          className="font-display text-sm tracking-[0.2em] text-white"
          animate={{ scale: [1, 1.12, 1], opacity: [0.6, 1, 0.6] }}
          transition={{ duration: 0.6, repeat: Infinity }}
        >
          VS
        </motion.div>
        <motion.div
          key={`${round.id}-R`}
          className="h-1.5 flex-1 rounded-full bg-gradient-to-l from-rose-400 to-rose-200"
          initial={{ scaleX: 0.2, originX: 1 }}
          animate={{ scaleX: 1 }}
          transition={{ duration: round.collideMs / 1000, ease: 'easeIn' }}
        />
      </div>
      <div className="flex items-center gap-4">
        <ExprButton
          base={round.left.base}
          exponent={round.left.exponent}
          onClick={() => onPick('left')}
          disabled={locked}
          tone="sky"
          large
        />
        <ExprButton
          base={round.right.base}
          exponent={round.right.exponent}
          onClick={() => onPick('right')}
          disabled={locked}
          tone="rose"
          large
        />
      </div>
    </div>
  )
}

export function LaserLatticeGame({ mode }: { mode: PlayerMode }) {
  const navigate = useNavigate()
  const [scores, setScores] = useState({ p1: 0, p2: 0 })
  const [lives, setLives] = useState({ p1: 3, p2: 3 })
  const [diff, setDiff] = useState(1)
  const [roundP1, setRoundP1] = useState<LaserRound | null>(null)
  const [roundP2, setRoundP2] = useState<LaserRound | null>(null)
  const [lockedP1, setLockedP1] = useState(false)
  const [lockedP2, setLockedP2] = useState(false)
  const [over, setOver] = useState(false)
  const timers = useRef<number[]>([])

  const clearTimers = () => {
    for (const t of timers.current) window.clearTimeout(t)
    timers.current = []
  }

  const spawn = useCallback(() => {
    setRoundP1(createLaserRound(diff))
    setLockedP1(false)
    if (mode === 2) {
      setRoundP2(createLaserRound(diff))
      setLockedP2(false)
    } else setRoundP2(null)
  }, [diff, mode])

  const reset = () => {
    clearTimers()
    setScores({ p1: 0, p2: 0 })
    setLives({ p1: 3, p2: 3 })
    setDiff(1)
    setOver(false)
    setRoundP1(createLaserRound(1))
    setRoundP2(mode === 2 ? createLaserRound(1) : null)
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
      playFightCue('clash')
      setLives((prev) => {
        const next = { ...prev, p1: prev.p1 - 1 }
        if (mode === 1 && next.p1 <= 0) setOver(true)
        if (mode === 2 && next.p1 <= 0 && next.p2 <= 0) setOver(true)
        return next
      })
      timers.current.push(window.setTimeout(() => spawn(), 400))
    }, roundP1.collideMs)
    timers.current.push(t)
    return () => window.clearTimeout(t)
  }, [roundP1, lockedP1, over, mode, spawn])

  useEffect(() => {
    if (mode !== 2 || !roundP2 || over || lockedP2) return
    const t = window.setTimeout(() => {
      setLockedP2(true)
      playFightCue('clash')
      setLives((prev) => {
        const next = { ...prev, p2: prev.p2 - 1 }
        if (next.p1 <= 0 && next.p2 <= 0) setOver(true)
        return next
      })
      timers.current.push(window.setTimeout(() => spawn(), 400))
    }, roundP2.collideMs)
    timers.current.push(t)
    return () => window.clearTimeout(t)
  }, [roundP2, lockedP2, over, mode, spawn])

  function pick(player: 'p1' | 'p2', side: 'left' | 'right') {
    if (over) return
    const round = player === 'p1' ? roundP1 : roundP2
    const locked = player === 'p1' ? lockedP1 : lockedP2
    if (!round || locked) return
    if (player === 'p1') setLockedP1(true)
    else setLockedP2(true)
    if (side === round.winner) {
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
    timers.current.push(window.setTimeout(() => spawn(), 400))
  }

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'a' || e.key === 'A' || e.key === '1') pick('p1', 'left')
      if (e.key === 'd' || e.key === 'D' || e.key === '2') pick('p1', 'right')
      if (mode === 2) {
        if (e.key === 'ArrowLeft' || e.key === 'j') pick('p2', 'left')
        if (e.key === 'ArrowRight' || e.key === 'l') pick('p2', 'right')
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  })

  return (
    <MiniGameChrome title="Laser Lattice" accent="#34d399">
      <ScoreHud mode={mode} scores={scores} lives={lives} />
      <p className="mb-2 text-center text-sm text-slate-400">
        Pick the winning beam before they collide · true math (n⁰ = 1)
      </p>
      <div className="relative flex min-h-0 flex-1 flex-col">
        <SplitLanes
          mode={mode}
          single={<LaserLane round={roundP1} locked={lockedP1} onPick={(s) => pick('p1', s)} />}
          left={
            <LaserLane
              round={roundP1}
              locked={lockedP1 || lives.p1 <= 0}
              onPick={(s) => pick('p1', s)}
            />
          }
          right={
            <LaserLane
              round={roundP2}
              locked={lockedP2 || lives.p2 <= 0}
              onPick={(s) => pick('p2', s)}
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
