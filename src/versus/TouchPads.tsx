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
  /** When true, pads sit in chrome beside/below the stage (not overlaying fighters). */
  docked?: boolean
  /** Render a single side (smart-board flanks) or both (default phone dock). */
  side?: Side
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

export function TouchPads({ onDirChange, onAction, docked = false, side }: TouchPadsProps) {
  if (docked && side) {
    return (
      <div className="versus-touch-dock pointer-events-none flex w-full justify-center">
        <PlayerPad
          side={side}
          accent={side === 'p1' ? '#38bdf8' : '#fb7185'}
          docked
          stackActions
          className=""
          onDirChange={onDirChange}
          onAction={onAction}
        />
      </div>
    )
  }

  if (docked) {
    return (
      <div className="versus-touch-dock pointer-events-none grid w-full grid-cols-2 gap-2 sm:gap-4">
        <PlayerPad
          side="p1"
          accent="#38bdf8"
          docked
          className="justify-self-start"
          onDirChange={onDirChange}
          onAction={onAction}
        />
        <PlayerPad
          side="p2"
          accent="#fb7185"
          docked
          className="justify-self-end"
          onDirChange={onDirChange}
          onAction={onAction}
        />
      </div>
    )
  }

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
  docked,
  stackActions,
  onDirChange,
  onAction,
}: {
  side: Side
  accent: string
  className: string
  docked?: boolean
  stackActions?: boolean
  onDirChange: TouchPadsProps['onDirChange']
  onAction: TouchPadsProps['onAction']
}) {
  const label = side === 'p1' ? 'P1' : 'P2'

  return (
    <div
      className={
        docked
          ? `versus-pad-root pointer-events-auto flex flex-col items-center gap-1 sm:gap-1.5 md:gap-2 ${
              stackActions ? 'versus-pad-root--side' : ''
            } ${className}`
          : `versus-pad-root pointer-events-auto absolute flex max-w-[46%] flex-col items-center gap-1.5 sm:max-w-none sm:gap-2 ${className}`
      }
      style={{ touchAction: 'none' }}
    >
      <p
        className="versus-pad-label text-[9px] font-semibold tracking-[0.25em] sm:text-[10px] md:text-xs"
        style={{ color: accent }}
      >
        {label}
      </p>
      <div
        className={`versus-pad-actions ${
          stackActions ? 'flex flex-col gap-1.5' : 'flex gap-1.5 sm:gap-2 md:gap-2.5'
        }`}
      >
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
      <div className="versus-pad-dirs grid grid-cols-3 grid-rows-3 gap-1 sm:gap-1.5 md:gap-2">
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
        <span className="versus-dir-spacer" aria-hidden />
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
      className={`versus-touch-btn versus-dir-btn flex items-center justify-center rounded-xl border font-bold ${
        label.length > 1 ? 'text-[9px] tracking-wide sm:text-[10px] md:text-xs' : 'text-sm md:text-base'
      }`}
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
      className="versus-touch-btn versus-action-btn flex items-center justify-center rounded-2xl border px-2 text-[9px] font-bold tracking-wider sm:px-3 sm:text-[11px] md:text-xs"
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
