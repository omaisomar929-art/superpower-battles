import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import type { PlayerId, PlayerMode } from '../../minigames/types'

export function MiniGameChrome({
  title,
  accent,
  children,
  footer,
}: {
  title: string
  accent: string
  children: ReactNode
  footer?: ReactNode
}) {
  return (
    <div className="relative mx-auto flex min-h-[calc(100dvh-8rem)] w-full max-w-6xl flex-col px-3 py-4 sm:px-4 sm:py-6">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div
          className="absolute inset-0 opacity-80"
          style={{
            background: `radial-gradient(ellipse at 50% 0%, ${accent}33, transparent 55%), radial-gradient(ellipse at 20% 80%, rgba(56,189,248,0.08), transparent 40%)`,
          }}
        />
        <div className="absolute inset-0 bg-[linear-gradient(180deg,transparent_60%,rgba(5,8,22,0.85))]" />
      </div>

      <div className="relative z-10 mb-3 flex flex-wrap items-center gap-3">
        <Link
          to="/minigames"
          className="inline-flex min-h-11 items-center gap-1.5 rounded-xl border border-white/10 bg-black/30 px-3 text-xs font-semibold tracking-widest text-slate-300 transition hover:border-sky-400/40 hover:text-sky-200"
        >
          <ArrowLeft size={14} />
          MINI GAMES
        </Link>
        <h1 className="font-display text-lg tracking-[0.18em] text-sky-100 sm:text-2xl" style={{ textShadow: `0 0 20px ${accent}88` }}>
          {title}
        </h1>
      </div>

      <div className="relative z-10 flex min-h-0 flex-1 flex-col">{children}</div>
      {footer ? <div className="relative z-10 mt-3">{footer}</div> : null}
    </div>
  )
}

export function ModePicker({
  title,
  blurb,
  accent,
  onPick,
}: {
  title: string
  blurb: string
  accent: string
  onPick: (mode: PlayerMode) => void
}) {
  return (
    <MiniGameChrome title={title} accent={accent}>
      <div className="mx-auto flex w-full max-w-xl flex-1 flex-col items-center justify-center gap-6 text-center">
        <p className="max-w-md text-base text-slate-300 sm:text-lg">{blurb}</p>
        <p className="text-[11px] uppercase tracking-[0.35em] text-slate-500">Choose players</p>
        <div className="grid w-full grid-cols-1 gap-3 sm:grid-cols-2">
          <button
            type="button"
            onClick={() => onPick(1)}
            className="min-h-20 rounded-2xl border border-sky-400/40 bg-sky-500/15 px-4 py-5 font-display text-xl tracking-[0.16em] text-sky-100 transition hover:bg-sky-500/25 active:scale-[0.98]"
          >
            1 PLAYER
          </button>
          <button
            type="button"
            onClick={() => onPick(2)}
            className="min-h-20 rounded-2xl border border-rose-400/40 bg-rose-500/15 px-4 py-5 font-display text-xl tracking-[0.16em] text-rose-100 transition hover:bg-rose-500/25 active:scale-[0.98]"
          >
            2 PLAYER
          </button>
        </div>
        <p className="text-sm text-slate-500">
          2 Player: left = P1, right = P2 — both on one device (touch or keyboard).
        </p>
      </div>
    </MiniGameChrome>
  )
}

export function ScoreHud({
  mode,
  scores,
  lives,
  extra,
}: {
  mode: PlayerMode
  scores: { p1: number; p2: number }
  lives?: { p1: number; p2: number }
  extra?: ReactNode
}) {
  if (mode === 1) {
    return (
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2 rounded-xl border border-white/10 bg-black/40 px-3 py-2.5">
        <div className="font-display text-sm tracking-[0.2em] text-sky-200">
          SCORE <span className="ml-2 text-2xl tabular-nums text-white">{scores.p1}</span>
        </div>
        {lives ? (
          <div className="font-display text-sm tracking-[0.16em] text-rose-200">
            LIVES <span className="ml-2 text-xl tabular-nums">{'♥'.repeat(lives.p1)}</span>
          </div>
        ) : null}
        {extra}
      </div>
    )
  }

  return (
    <div className="mb-3 grid grid-cols-2 gap-2">
      <div className="rounded-xl border border-sky-400/35 bg-sky-500/10 px-3 py-2.5">
        <p className="text-[10px] uppercase tracking-[0.3em] text-sky-300">P1 · Left</p>
        <p className="font-display text-2xl tabular-nums text-sky-50">{scores.p1}</p>
        {lives ? <p className="text-sm text-rose-200">{'♥'.repeat(lives.p1)}</p> : null}
      </div>
      <div className="rounded-xl border border-rose-400/35 bg-rose-500/10 px-3 py-2.5 text-right">
        <p className="text-[10px] uppercase tracking-[0.3em] text-rose-300">P2 · Right</p>
        <p className="font-display text-2xl tabular-nums text-rose-50">{scores.p2}</p>
        {lives ? <p className="text-sm text-rose-200">{'♥'.repeat(lives.p2)}</p> : null}
      </div>
      {extra ? <div className="col-span-2">{extra}</div> : null}
    </div>
  )
}

export function SplitLanes({
  mode,
  left,
  right,
  single,
}: {
  mode: PlayerMode
  left: ReactNode
  right: ReactNode
  single: ReactNode
}) {
  if (mode === 1) {
    return <div className="relative min-h-[22rem] flex-1 overflow-hidden rounded-2xl border border-white/10 bg-black/35">{single}</div>
  }
  return (
    <div className="grid min-h-[22rem] flex-1 grid-cols-2 gap-2">
      <div className="relative overflow-hidden rounded-2xl border border-sky-400/30 bg-sky-950/30">
        <div className="pointer-events-none absolute left-2 top-2 z-20 rounded-md bg-sky-500/30 px-2 py-1 text-[10px] font-bold tracking-widest text-sky-100">
          P1
        </div>
        {left}
      </div>
      <div className="relative overflow-hidden rounded-2xl border border-rose-400/30 bg-rose-950/30">
        <div className="pointer-events-none absolute right-2 top-2 z-20 rounded-md bg-rose-500/30 px-2 py-1 text-[10px] font-bold tracking-widest text-rose-100">
          P2
        </div>
        {right}
      </div>
    </div>
  )
}

export function GameOverBanner({
  mode,
  scores,
  onAgain,
  onHub,
}: {
  mode: PlayerMode
  scores: { p1: number; p2: number }
  onAgain: () => void
  onHub: () => void
}) {
  const winner =
    mode === 2
      ? scores.p1 === scores.p2
        ? 'Draw!'
        : scores.p1 > scores.p2
          ? 'P1 wins!'
          : 'P2 wins!'
      : `Score ${scores.p1}`

  return (
    <div className="absolute inset-0 z-30 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-2xl border border-white/15 bg-[#0b1220] p-6 text-center shadow-2xl">
        <p className="font-display text-2xl tracking-[0.2em] text-amber-200">GAME OVER</p>
        <p className="mt-3 text-lg text-slate-200">{winner}</p>
        {mode === 2 ? (
          <p className="mt-1 text-sm text-slate-400">
            P1 {scores.p1} · P2 {scores.p2}
          </p>
        ) : null}
        <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-center">
          <button type="button" className="btn-primary min-h-12" onClick={onAgain}>
            PLAY AGAIN
          </button>
          <button type="button" className="btn-secondary min-h-12" onClick={onHub}>
            HUB
          </button>
        </div>
      </div>
    </div>
  )
}

export function ExprButton({
  base,
  exponent,
  onClick,
  tone = 'sky',
  disabled,
  large,
}: {
  base: number
  exponent: number
  onClick: () => void
  tone?: 'sky' | 'rose' | 'amber' | 'mint'
  disabled?: boolean
  large?: boolean
}) {
  const toneClass =
    tone === 'sky'
      ? 'border-sky-400/50 bg-sky-500/20 text-sky-50 hover:bg-sky-500/35'
      : tone === 'rose'
        ? 'border-rose-400/50 bg-rose-500/20 text-rose-50 hover:bg-rose-500/35'
        : tone === 'mint'
          ? 'border-emerald-400/50 bg-emerald-500/20 text-emerald-50 hover:bg-emerald-500/35'
          : 'border-amber-400/50 bg-amber-500/20 text-amber-50 hover:bg-amber-500/35'

  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={`inline-flex min-h-16 min-w-[5.5rem] items-center justify-center rounded-2xl border px-4 font-mono font-bold tabular-nums transition active:scale-[0.97] disabled:opacity-50 ${
        large ? 'min-h-24 text-4xl sm:text-5xl' : 'text-3xl sm:text-4xl'
      } ${toneClass}`}
    >
      {base}
      <sup className="ml-0.5 text-[0.55em] font-bold leading-none">{exponent}</sup>
    </button>
  )
}

export function playerFromSide(side: 'left' | 'right', mode: PlayerMode): PlayerId {
  if (mode === 1) return 'p1'
  return side === 'left' ? 'p1' : 'p2'
}
