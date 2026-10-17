import type { PointerEvent as ReactPointerEvent } from 'react'

export type TouchDir = {
  left: boolean
  right: boolean
  up: boolean
  down: boolean
}

type Side = 'p1' | 'p2'

interface TouchPadsProps {
  onDirChange: (side: Side, dir: Partial<TouchDir>, active: boolean) => void
  onAction: (side: Side, kind: 'punch' | 'ability') => void
}

function bindHold(
  e: ReactPointerEvent<HTMLButtonElement>,
  onDown: () => void,
  onUp: () => void,
) {
  e.preventDefault()
  e.stopPropagation()
  const el = e.currentTarget
  el.setPointerCapture(e.pointerId)
  onDown()
  const end = () => {
    onUp()
    el.removeEventListener('pointerup', end)
    el.removeEventListener('pointercancel', end)
    el.removeEventListener('lostpointercapture', end)
  }
  el.addEventListener('pointerup', end)
  el.addEventListener('pointercancel', end)
  el.addEventListener('lostpointercapture', end)
}

export function TouchPads({ onDirChange, onAction }: TouchPadsProps) {
  return (
    <div className="versus-touch-layer pointer-events-none absolute inset-0 z-50">
      <PlayerPad
        side="p1"
        accent="#38bdf8"
        className="left-1 bottom-1 sm:left-2 sm:bottom-2"
        onDirChange={onDirChange}
        onAction={onAction}
      />
      <PlayerPad
        side="p2"
        accent="#fb7185"
        className="right-1 bottom-1 sm:right-2 sm:bottom-2"
        onDirChange={onDirChange}
        onAction={onAction}
      />
    </div>
  )
}

function PlayerPad({
  side,
  accent,
  className,
  onDirChange,
  onAction,
}: {
  side: Side
  accent: string
  className: string
  onDirChange: TouchPadsProps['onDirChange']
  onAction: TouchPadsProps['onAction']
}) {
  const label = side === 'p1' ? 'P1' : 'P2'

  return (
    <div
      className={`pointer-events-auto absolute flex max-w-[46%] flex-col items-center gap-1.5 sm:max-w-none sm:gap-2 ${className}`}
      style={{ touchAction: 'none' }}
    >
      <p className="text-[9px] font-semibold tracking-[0.25em]" style={{ color: accent }}>
        {label}
      </p>
      <div className="flex gap-1.5 sm:gap-2">
        <ActionBtn
          label="PUNCH"
          ariaLabel={`${label} punch`}
          accent={accent}
          onPress={() => onAction(side, 'punch')}
        />
        <ActionBtn
          label="ABILITY"
          ariaLabel={`${label} ability`}
          accent={accent}
          onPress={() => onAction(side, 'ability')}
        />
      </div>
      <div className="grid grid-cols-3 grid-rows-3 gap-1 sm:gap-1.5">
        <span />
        <DirBtn
          label="FLY"
          ariaLabel={`${label} fly`}
          accent={accent}
          onHold={(on) => onDirChange(side, { up: true }, on)}
        />
        <span />
        <DirBtn
          label="◀"
          ariaLabel={`${label} left`}
          accent={accent}
          onHold={(on) => onDirChange(side, { left: true }, on)}
        />
        <span className="h-10 w-10 sm:h-11 sm:w-11" aria-hidden />
        <DirBtn
          label="▶"
          ariaLabel={`${label} right`}
          accent={accent}
          onHold={(on) => onDirChange(side, { right: true }, on)}
        />
        <span />
        <DirBtn
          label="▼"
          ariaLabel={`${label} down`}
          accent={accent}
          onHold={(on) => onDirChange(side, { down: true }, on)}
        />
        <span />
      </div>
    </div>
  )
}

function DirBtn({
  label,
  ariaLabel,
  accent,
  onHold,
}: {
  label: string
  ariaLabel: string
  accent: string
  onHold: (active: boolean) => void
}) {
  return (
    <button
      type="button"
      aria-label={ariaLabel}
      className={`versus-touch-btn flex h-10 w-10 items-center justify-center rounded-xl border font-bold sm:h-12 sm:w-12 ${label.length > 1 ? 'text-[9px] tracking-wide sm:text-[10px]' : 'text-sm'}`}
      style={{
        touchAction: 'none',
        borderColor: `${accent}77`,
        background: `${accent}22`,
        color: accent,
        userSelect: 'none',
      }}
      onPointerDown={(e) => {
        bindHold(
          e,
          () => onHold(true),
          () => onHold(false),
        )
      }}
      onContextMenu={(e) => e.preventDefault()}
    >
      {label}
    </button>
  )
}

function ActionBtn({
  label,
  ariaLabel,
  accent,
  onPress,
}: {
  label: string
  ariaLabel: string
  accent: string
  onPress: () => void
}) {
  return (
    <button
      type="button"
      aria-label={ariaLabel}
      className="versus-touch-btn flex h-11 min-w-[3.6rem] items-center justify-center rounded-2xl border px-2 text-[9px] font-bold tracking-wider sm:h-12 sm:min-w-[4.75rem] sm:px-3 sm:text-[11px]"
      style={{
        touchAction: 'none',
        borderColor: `${accent}99`,
        background: `linear-gradient(160deg, ${accent}55, rgba(2,6,23,0.85))`,
        color: '#f8fafc',
        boxShadow: `0 0 16px ${accent}44`,
        userSelect: 'none',
      }}
      onPointerDown={(e) => {
        e.preventDefault()
        e.stopPropagation()
        onPress()
      }}
      onContextMenu={(e) => e.preventDefault()}
    >
      {label}
    </button>
  )
}
