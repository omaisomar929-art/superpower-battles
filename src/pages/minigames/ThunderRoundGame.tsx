import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { playFightCue } from '../../audio/soundEngine'
import {
  createThunderPrompt,
  THUNDER_DURATION_MS,
  type ThunderPrompt,
} from '../../minigames/engines'
import type { PlayerMode } from '../../minigames/types'
import { ExprButton, GameOverBanner, MiniGameChrome, ScoreHud, SplitLanes } from './shared'

function ThunderLane({
  prompt,
  locked,
  onPick,
}: {
  prompt: ThunderPrompt | null
  locked: boolean
  onPick: (side: 'left' | 'right') => void
}) {
  if (!prompt) return null
  return (
    <div className="flex h-full min-h-[18rem] flex-col items-center justify-center gap-5 p-4">
      <p className="rounded-full border border-orange-300/40 bg-orange-500/20 px-4 py-2 font-display text-sm tracking-[0.22em] text-orange-100">
        {prompt.kind === 'stronger' ? 'WHO IS STRONGER?' : 'WHO IS WEAKER?'}
      </p>
      <div className="flex items-center gap-4">
        <ExprButton
          base={prompt.left.base}
          exponent={prompt.left.exponent}
          onClick={() => onPick('left')}
          disabled={locked}
          tone="sky"
          large
        />
        <ExprButton
          base={prompt.right.base}
          exponent={prompt.right.exponent}
          onClick={() => onPick('right')}
          disabled={locked}
          tone="rose"
          large
        />
      </div>
    </div>
  )
}

export function ThunderRoundGame({ mode }: { mode: PlayerMode }) {
  const navigate = useNavigate()
  const [scores, setScores] = useState({ p1: 0, p2: 0 })
  const [streak, setStreak] = useState({ p1: 0, p2: 0 })
  const [promptP1, setPromptP1] = useState<ThunderPrompt | null>(null)
  const [promptP2, setPromptP2] = useState<ThunderPrompt | null>(null)
  const [lockedP1, setLockedP1] = useState(false)
  const [lockedP2, setLockedP2] = useState(false)
  const [remaining, setRemaining] = useState(THUNDER_DURATION_MS)
  const [over, setOver] = useState(false)
  const endAt = useRef(0)

  const reset = () => {
    setScores({ p1: 0, p2: 0 })
    setStreak({ p1: 0, p2: 0 })
    setOver(false)
    endAt.current = Date.now() + THUNDER_DURATION_MS
    setRemaining(THUNDER_DURATION_MS)
    setPromptP1(createThunderPrompt())
    setPromptP2(mode === 2 ? createThunderPrompt() : null)
    setLockedP1(false)
    setLockedP2(false)
  }

  useEffect(() => {
    reset()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode])

  useEffect(() => {
    if (over) return
    const tick = window.setInterval(() => {
      const left = Math.max(0, endAt.current - Date.now())
      setRemaining(left)
      if (left <= 0) {
        setOver(true)
        playFightCue('reveal')
      }
    }, 100)
    return () => window.clearInterval(tick)
  }, [over])

  function pick(player: 'p1' | 'p2', side: 'left' | 'right') {
    if (over) return
    const prompt = player === 'p1' ? promptP1 : promptP2
    const locked = player === 'p1' ? lockedP1 : lockedP2
    if (!prompt || locked) return
    if (player === 'p1') setLockedP1(true)
    else setLockedP2(true)

    if (side === prompt.answer) {
      playFightCue('whoosh')
      setStreak((st) => {
        const nextStreak = st[player] + 1
        const bonus = Math.min(5, nextStreak)
        setScores((s) => ({ ...s, [player]: s[player] + 5 + bonus }))
        return { ...st, [player]: nextStreak }
      })
    } else {
      playFightCue('impact')
      setStreak((st) => ({ ...st, [player]: 0 }))
    }

    window.setTimeout(() => {
      if (player === 'p1' || mode === 1) {
        setPromptP1(createThunderPrompt())
        setLockedP1(false)
      }
      if (mode === 2 && player === 'p2') {
        setPromptP2(createThunderPrompt())
        setLockedP2(false)
      }
      // keep both sides fresh in 2P after either answers? Independent — only refresh that player
    }, 180)
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

  const secs = (remaining / 1000).toFixed(1)

  return (
    <MiniGameChrome title="Thunder Round" accent="#fb923c">
      <ScoreHud
        mode={mode}
        scores={scores}
        extra={
          <div className="font-display text-sm tracking-[0.2em] text-orange-200">
            TIME <span className="ml-2 text-2xl tabular-nums text-white">{secs}s</span>
            {mode === 1 ? (
              <span className="ml-4 text-slate-400">STREAK {streak.p1}</span>
            ) : null}
          </div>
        }
      />
      <p className="mb-2 text-center text-sm text-slate-400">
        45s blitz · stronger / weaker · chain streak for bonus · true math (n⁰ = 1)
      </p>
      <div className="relative flex min-h-0 flex-1 flex-col">
        <SplitLanes
          mode={mode}
          single={<ThunderLane prompt={promptP1} locked={lockedP1 || over} onPick={(s) => pick('p1', s)} />}
          left={
            <ThunderLane prompt={promptP1} locked={lockedP1 || over} onPick={(s) => pick('p1', s)} />
          }
          right={
            <ThunderLane prompt={promptP2} locked={lockedP2 || over} onPick={(s) => pick('p2', s)} />
          }
        />
        {over ? (
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
