import { useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { playFightCue } from '../../audio/soundEngine'
import { createCometWave, type CometItem, type CometWave } from '../../minigames/engines'
import type { PlayerMode } from '../../minigames/types'
import { GameOverBanner, MiniGameChrome, ScoreHud, SplitLanes } from './shared'

function CometField({
  wave,
  disabled,
  tapped,
  onTap,
}: {
  wave: CometWave | null
  disabled: boolean
  tapped: Set<string>
  onTap: (item: CometItem) => void
}) {
  if (!wave) return null
  return (
    <div className="relative h-full min-h-[20rem] w-full overflow-hidden">
      <div className="absolute inset-x-0 top-3 z-10 text-center">
        <span className="rounded-full border border-violet-300/40 bg-violet-500/25 px-4 py-2 font-display text-sm tracking-[0.2em] text-violet-100">
          TAP TRUE {wave.mode === 'squares' ? 'SQUARES' : 'CUBES'}
        </span>
      </div>
      {wave.items.map((item) => {
        const gone = tapped.has(item.id)
        if (gone) return null
        return (
          <motion.button
            key={item.id}
            type="button"
            disabled={disabled}
            onClick={() => onTap(item)}
            className="absolute z-[5] min-h-14 min-w-14 -translate-x-1/2 rounded-full border border-violet-200/40 bg-gradient-to-br from-violet-400/40 to-fuchsia-600/40 px-3 font-mono text-xl font-bold text-white shadow-lg active:scale-95 disabled:opacity-40"
            style={{ left: `${item.xPct}%` }}
            initial={{ top: '-10%', opacity: 0.9 }}
            animate={{ top: '88%', opacity: 1 }}
            transition={{ duration: item.fallMs / 1000, ease: 'linear' }}
          >
            {item.value}
          </motion.button>
        )
      })}
      <div className="absolute inset-x-0 bottom-0 h-12 bg-gradient-to-t from-black/60 to-transparent" />
    </div>
  )
}

export function CubeCometsGame({ mode }: { mode: PlayerMode }) {
  const navigate = useNavigate()
  const [scores, setScores] = useState({ p1: 0, p2: 0 })
  const [lives, setLives] = useState({ p1: 3, p2: 3 })
  const [diff, setDiff] = useState(1)
  const [waveP1, setWaveP1] = useState<CometWave | null>(null)
  const [waveP2, setWaveP2] = useState<CometWave | null>(null)
  const [tappedP1, setTappedP1] = useState<Set<string>>(new Set())
  const [tappedP2, setTappedP2] = useState<Set<string>>(new Set())
  const [over, setOver] = useState(false)
  const timers = useRef<number[]>([])

  const clearTimers = () => {
    for (const t of timers.current) window.clearTimeout(t)
    timers.current = []
  }

  const spawn = useCallback(() => {
    const w1 = createCometWave(diff)
    setWaveP1(w1)
    setTappedP1(new Set())
    if (mode === 2) {
      setWaveP2(createCometWave(diff))
      setTappedP2(new Set())
    } else {
      setWaveP2(null)
    }
  }, [diff, mode])

  const reset = () => {
    clearTimers()
    setScores({ p1: 0, p2: 0 })
    setLives({ p1: 3, p2: 3 })
    setDiff(1)
    setOver(false)
    const w1 = createCometWave(1)
    setWaveP1(w1)
    setTappedP1(new Set())
    setWaveP2(mode === 2 ? createCometWave(1) : null)
    setTappedP2(new Set())
  }

  useEffect(() => {
    reset()
    return clearTimers
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode])

  // Missed correct comets when they finish falling
  useEffect(() => {
    if (!waveP1 || over) return
    const maxFall = Math.max(
      ...waveP1.items.map((i) => i.fallMs),
      ...(waveP2?.items.map((i) => i.fallMs) ?? [0]),
    )
    const t = window.setTimeout(() => {
      setLives((prev) => {
        let next = { ...prev }
        const miss1 = waveP1.items.filter((i) => i.correct && !tappedP1.has(i.id)).length
        if (miss1 > 0) {
          playFightCue('impact')
          next = { ...next, p1: next.p1 - miss1 }
        }
        if (mode === 2 && waveP2) {
          const miss2 = waveP2.items.filter((i) => i.correct && !tappedP2.has(i.id)).length
          if (miss2 > 0) {
            playFightCue('impact')
            next = { ...next, p2: next.p2 - miss2 }
          }
        }
        if (mode === 1 && next.p1 <= 0) setOver(true)
        if (mode === 2 && next.p1 <= 0 && next.p2 <= 0) setOver(true)
        return next
      })
      setDiff((d) => d + 1)
      timers.current.push(window.setTimeout(() => spawn(), 400))
    }, maxFall + 80)
    timers.current.push(t)
    return () => window.clearTimeout(t)
  }, [waveP1, waveP2, over]) // eslint-disable-line react-hooks/exhaustive-deps

  function tap(player: 'p1' | 'p2', item: CometItem) {
    if (over) return
    const setTapped = player === 'p1' ? setTappedP1 : setTappedP2
    const tapped = player === 'p1' ? tappedP1 : tappedP2
    if (tapped.has(item.id)) return
    setTapped(new Set(tapped).add(item.id))
    if (item.correct) {
      playFightCue('reveal')
      setScores((s) => ({ ...s, [player]: s[player] + 8 }))
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
    <MiniGameChrome title="Cube Comets" accent="#a78bfa">
      <ScoreHud mode={mode} scores={scores} lives={lives} />
      <p className="mb-2 text-center text-sm text-slate-400">
        Tap only the values that are true {waveP1?.mode === 'cubes' ? 'cubes' : 'squares'} · miss a correct one = damage
      </p>
      <div className="relative flex min-h-0 flex-1 flex-col">
        <SplitLanes
          mode={mode}
          single={
            <CometField
              wave={waveP1}
              disabled={over}
              tapped={tappedP1}
              onTap={(item) => tap('p1', item)}
            />
          }
          left={
            <CometField
              wave={waveP1}
              disabled={over || lives.p1 <= 0}
              tapped={tappedP1}
              onTap={(item) => tap('p1', item)}
            />
          }
          right={
            <CometField
              wave={waveP2}
              disabled={over || lives.p2 <= 0}
              tapped={tappedP2}
              onTap={(item) => tap('p2', item)}
            />
          }
        />
        {(over || lives.p1 <= 0 && (mode === 1 || lives.p2 <= 0)) && (
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
