import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import type { Hero } from '../heroes/types'
import { HeroArt } from '../heroes/HeroArt'
import { MathExpression } from '../components/MathExpression'
import { getAbilityFx } from '../animations/abilityFx'
import { playFightCue } from '../audio/soundEngine'
import {
  MATCH_SECONDS,
  MAX_HP,
  VERSUS_RULES_COPY,
  resolveHitDamage,
  type HitKind,
} from './damageRules'
import { TouchPads, type TouchDir } from './TouchPads'
import { FLY_SPEED, applyHoldToAscendFlight } from './flightPhysics'

const ARENA_W = 960
const ARENA_H = 520
const GROUND_Y = ARENA_H - 72
const FIGHTER_R = 36
/** Sprite is 88px tall above feet — keep art inside the visible stage. */
const SPRITE_H = 88
const MIN_X = FIGHTER_R
const MAX_X = ARENA_W - FIGHTER_R
const MIN_Y = SPRITE_H
const MAX_Y = GROUND_Y
const MOVE_SPEED = 280
const PUNCH_RANGE = 110
const ABILITY_RANGE = 260
const PUNCH_COOLDOWN = 0.35
const ABILITY_COOLDOWN = 1.1
const HIT_STUN = 0.18

type Outcome = 'p1' | 'p2' | 'draw' | null

interface FighterState {
  x: number
  y: number
  vx: number
  vy: number
  facing: 1 | -1
  flying: boolean
  hp: number
  punchCd: number
  abilityCd: number
  stun: number
  punching: number
  abilitying: number
  hitFlash: number
  blockedFlash: number
}

interface FxEvent {
  id: number
  kind: HitKind | 'block'
  x: number
  y: number
  color: string
  label: string
  side: 'p1' | 'p2'
}

interface VersusArenaProps {
  fighterA: Hero
  fighterB: Hero
  arena?: string
  onExit?: () => void
  onRematch?: () => void
}

const P1_KEYS = new Set(['w', 'a', 's', 'd', 't', 'y', ' ', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright', 'enter', 'shift'])

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n))
}

/** Keep fighter center + residual velocity inside the visible playfield. */
function clampFighterToArena(f: FighterState) {
  f.x = clamp(f.x, MIN_X, MAX_X)
  f.y = clamp(f.y, MIN_Y, MAX_Y)
  if (f.x <= MIN_X && f.vx < 0) f.vx = 0
  if (f.x >= MAX_X && f.vx > 0) f.vx = 0
  if (f.y <= MIN_Y && f.vy < 0) f.vy = 0
  if (f.y >= MAX_Y && f.vy > 0) f.vy = 0
}

function arenaBg(arena: string): string {
  const map: Record<string, string> = {
    'neon-colosseum':
      'radial-gradient(circle at 50% 85%, rgba(56,189,248,0.35), transparent 55%), linear-gradient(180deg,#0f172a,#020617)',
    'void-rift': 'radial-gradient(circle at 50% 40%, rgba(99,102,241,0.4), transparent 50%), #02010a',
    'storm-spire': 'radial-gradient(circle at 30% 20%, rgba(56,189,248,0.35), transparent 45%), #0b1220',
    'ember-crater': 'radial-gradient(circle at 50% 100%, rgba(249,115,22,0.4), transparent 50%), #1a0505',
    'crystal-arena': 'radial-gradient(circle at 70% 30%, rgba(233,213,255,0.35), transparent 45%), #0a1020',
  }
  return map[arena] ?? map['neon-colosseum']!
}

const EMPTY_DIR: TouchDir = { left: false, right: false, up: false, down: false }

export function VersusArena({ fighterA, fighterB, arena = 'neon-colosseum', onExit, onRematch }: VersusArenaProps) {
  const fxA = useMemo(() => getAbilityFx(fighterA), [fighterA])
  const fxB = useMemo(() => getAbilityFx(fighterB), [fighterB])
  const wrapRef = useRef<HTMLDivElement>(null)
  const stageRef = useRef<HTMLDivElement>(null)
  const keysRef = useRef<Set<string>>(new Set())
  const touchP1Ref = useRef<TouchDir>({ ...EMPTY_DIR })
  const touchP2Ref = useRef<TouchDir>({ ...EMPTY_DIR })
  const tryActionRef = useRef<(who: 'p1' | 'p2', kind: HitKind) => void>(() => undefined)
  const p1Ref = useRef<FighterState>(makeFighter(180, GROUND_Y, 1))
  const p2Ref = useRef<FighterState>(makeFighter(ARENA_W - 180, GROUND_Y, -1))
  const timeRef = useRef(MATCH_SECONDS)
  const outcomeRef = useRef<Outcome>(null)
  const fxId = useRef(0)

  const [p1, setP1] = useState(() => makeFighter(180, GROUND_Y, 1))
  const [p2, setP2] = useState(() => makeFighter(ARENA_W - 180, GROUND_Y, -1))
  const [timeLeft, setTimeLeft] = useState(MATCH_SECONDS)
  const [outcome, setOutcome] = useState<Outcome>(null)
  const [shake, setShake] = useState(0)
  const [fxEvents, setFxEvents] = useState<FxEvent[]>([])
  const [lastGate, setLastGate] = useState(VERSUS_RULES_COPY)
  const [focused, setFocused] = useState(true)
  const [tick, setTick] = useState(0)
  const [scale, setScale] = useState(1)

  const resetMatch = useCallback(() => {
    p1Ref.current = makeFighter(180, GROUND_Y, 1)
    p2Ref.current = makeFighter(ARENA_W - 180, GROUND_Y, -1)
    timeRef.current = MATCH_SECONDS
    outcomeRef.current = null
    setP1({ ...p1Ref.current })
    setP2({ ...p2Ref.current })
    setTimeLeft(MATCH_SECONDS)
    setOutcome(null)
    setFxEvents([])
    setLastGate(VERSUS_RULES_COPY)
    setShake(0)
    wrapRef.current?.focus()
  }, [])

  useEffect(() => {
    resetMatch()
  }, [fighterA.id, fighterB.id, resetMatch])

  useEffect(() => {
    const prevOverflow = document.body.style.overflow
    const prevTouch = document.body.style.touchAction
    document.body.classList.add('versus-fighting')
    document.body.style.overflow = 'hidden'
    document.body.style.touchAction = 'none'
    return () => {
      document.body.classList.remove('versus-fighting')
      document.body.style.overflow = prevOverflow
      document.body.style.touchAction = prevTouch
      touchP1Ref.current = { ...EMPTY_DIR }
      touchP2Ref.current = { ...EMPTY_DIR }
    }
  }, [])

  useEffect(() => {
    const el = stageRef.current
    if (!el || typeof ResizeObserver === 'undefined') return
    const update = () => {
      const w = el.clientWidth
      setScale(w > 0 ? Math.min(1, w / ARENA_W) : 1)
    }
    update()
    const ro = new ResizeObserver(update)
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  const onTouchDirChange = useCallback((side: 'p1' | 'p2', dir: Partial<TouchDir>, active: boolean) => {
    const target = side === 'p1' ? touchP1Ref.current : touchP2Ref.current
    for (const key of Object.keys(dir) as (keyof TouchDir)[]) {
      if (dir[key]) target[key] = active
    }
  }, [])

  const onTouchAction = useCallback((side: 'p1' | 'p2', kind: 'punch' | 'ability') => {
    tryActionRef.current(side, kind)
  }, [])

  const spawnFx = useCallback((ev: Omit<FxEvent, 'id'>) => {
    const id = (fxId.current += 1)
    setFxEvents((list) => [...list.slice(-10), { ...ev, id }])
    window.setTimeout(() => {
      setFxEvents((list) => list.filter((e) => e.id !== id))
    }, 520)
  }, [])

  const applyHit = useCallback(
    (attacker: 'p1' | 'p2', kind: HitKind) => {
      if (outcomeRef.current) return
      const atk = attacker === 'p1' ? p1Ref.current : p2Ref.current
      const def = attacker === 'p1' ? p2Ref.current : p1Ref.current
      const atkHero = attacker === 'p1' ? fighterA : fighterB
      const defHero = attacker === 'p1' ? fighterB : fighterA
      const atkFx = attacker === 'p1' ? fxA : fxB
      const range = kind === 'ability' ? ABILITY_RANGE : PUNCH_RANGE
      const dx = def.x - atk.x
      const dy = def.y - atk.y
      const dist = Math.hypot(dx, dy)
      const facingOk = kind === 'ability' || Math.sign(dx) === atk.facing || dist < 50
      if (dist > range || !facingOk) return

      const result = resolveHitDamage(
        atkHero.power,
        defHero.power,
        atkHero.expression,
        defHero.expression,
        kind,
      )
      setLastGate(result.expression)

      const knock = (kind === 'ability' ? 140 : 70) * (result.blocked ? 0.35 : 1)
      def.vx += Math.sign(dx || atk.facing) * knock
      def.vy -= kind === 'ability' ? 60 : 30
      clampFighterToArena(def)
      def.stun = HIT_STUN
      def.hitFlash = 0.25

      if (result.blocked) {
        def.blockedFlash = 0.4
        playFightCue('whoosh')
        spawnFx({
          kind: 'block',
          x: def.x,
          y: def.y - 40,
          color: '#94a3b8',
          label: 'BLOCKED',
          side: attacker,
        })
      } else {
        def.hp = Math.max(0, def.hp - result.damage)
        playFightCue(kind === 'ability' ? atkFx.cue : 'impact')
        setShake((s) => s + (kind === 'ability' ? 2 : 1))
        spawnFx({
          kind,
          x: (atk.x + def.x) / 2,
          y: (atk.y + def.y) / 2 - 20,
          color: atkFx.accent,
          label: kind === 'ability' ? atkFx.label : `-${result.damage}`,
          side: attacker,
        })
      }

      if (def.hp <= 0) {
        outcomeRef.current = attacker
        setOutcome(attacker)
        playFightCue('reveal')
      }
    },
    [fighterA, fighterB, fxA, fxB, spawnFx],
  )

  useEffect(() => {
    const el = wrapRef.current
    if (!el) return

    const tryAction = (who: 'p1' | 'p2', kind: HitKind) => {
      if (outcomeRef.current) return
      const f = who === 'p1' ? p1Ref.current : p2Ref.current
      if (kind === 'punch') {
        if (f.punchCd > 0) return
        f.punchCd = PUNCH_COOLDOWN
        f.punching = 0.22
        playFightCue('whoosh')
        applyHit(who, 'punch')
      } else {
        if (f.abilityCd > 0) return
        f.abilityCd = ABILITY_COOLDOWN
        f.abilitying = 0.45
        applyHit(who, 'ability')
      }
    }
    tryActionRef.current = tryAction

    const clearKeys = () => {
      keysRef.current.clear()
    }

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.repeat) return
      const key = e.key.toLowerCase()
      if (P1_KEYS.has(key) || e.code === 'ShiftLeft' || e.code === 'ShiftRight' || e.code === 'Space') {
        e.preventDefault()
      }
      keysRef.current.add(key)
      if (e.code === 'Space') keysRef.current.add(' ')
      if (e.key === 'Shift' || e.code.startsWith('Shift')) keysRef.current.add('shift')

      // Edge-triggered combat (reliable vs RAF polling)
      if (key === 't') tryAction('p1', 'punch')
      if (key === 'y') tryAction('p1', 'ability')
      if (key === 'enter') tryAction('p2', 'punch')
      if (key === 'shift' || e.code.startsWith('Shift')) tryAction('p2', 'ability')
    }
    const onKeyUp = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase()
      keysRef.current.delete(key)
      if (e.code === 'Space') keysRef.current.delete(' ')
      if (e.key === 'Shift' || e.code.startsWith('Shift')) keysRef.current.delete('shift')
    }

    const onWindowBlur = () => clearKeys()
    const onVisibility = () => {
      if (document.hidden) clearKeys()
    }

    el.addEventListener('keydown', onKeyDown)
    el.addEventListener('keyup', onKeyUp)
    el.addEventListener('blur', clearKeys)
    window.addEventListener('blur', onWindowBlur)
    document.addEventListener('visibilitychange', onVisibility)
    el.focus()
    return () => {
      el.removeEventListener('keydown', onKeyDown)
      el.removeEventListener('keyup', onKeyUp)
      el.removeEventListener('blur', clearKeys)
      window.removeEventListener('blur', onWindowBlur)
      document.removeEventListener('visibilitychange', onVisibility)
      clearKeys()
    }
  }, [applyHit])

  useEffect(() => {
    let raf = 0
    let last = performance.now()
    let uiAccum = 0

    const step = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000)
      last = now
      uiAccum += dt

      if (!outcomeRef.current) {
        timeRef.current = Math.max(0, timeRef.current - dt)
        if (timeRef.current <= 0) {
          const a = p1Ref.current.hp
          const b = p2Ref.current.hp
          const out: Outcome = a > b ? 'p1' : b > a ? 'p2' : 'draw'
          outcomeRef.current = out
          setOutcome(out)
          playFightCue(out === 'draw' ? 'draw' : 'reveal')
        }
      }

      const keys = keysRef.current
      const t1 = touchP1Ref.current
      const t2 = touchP2Ref.current
      if (!outcomeRef.current) {
        // Hold-to-ascend: P1 W or Space (or touch ▲); P2 ArrowUp (or touch ▲)
        integrateFighter(p1Ref.current, dt, {
          left: keys.has('a') || t1.left,
          right: keys.has('d') || t1.right,
          ascend: keys.has('w') || keys.has(' ') || t1.up,
          descend: keys.has('s') || t1.down,
        })

        integrateFighter(p2Ref.current, dt, {
          left: keys.has('arrowleft') || t2.left,
          right: keys.has('arrowright') || t2.right,
          ascend: keys.has('arrowup') || t2.up,
          descend: keys.has('arrowdown') || t2.down,
        })

        // Face each other when close
        if (Math.abs(p1Ref.current.x - p2Ref.current.x) > 8) {
          p1Ref.current.facing = p1Ref.current.x < p2Ref.current.x ? 1 : -1
          p2Ref.current.facing = p2Ref.current.x < p1Ref.current.x ? 1 : -1
        }
      } else {
        decayTimers(p1Ref.current, dt)
        decayTimers(p2Ref.current, dt)
      }

      if (uiAccum >= 1 / 30) {
        uiAccum = 0
        setP1({ ...p1Ref.current })
        setP2({ ...p2Ref.current })
        setTimeLeft(Math.ceil(timeRef.current))
        setTick((t) => t + 1)
        setShake((s) => (s > 0 ? s * 0.7 : 0))
      }

      raf = requestAnimationFrame(step)
    }
    raf = requestAnimationFrame(step)
    return () => cancelAnimationFrame(raf)
  }, [applyHit])

  const winnerLabel =
    outcome === 'p1'
      ? fighterA.name
      : outcome === 'p2'
        ? fighterB.name
        : outcome === 'draw'
          ? 'DRAW'
          : null

  const scaledH = ARENA_H * scale

  return (
    <div className="versus-arena space-y-3 sm:space-y-4" style={{ touchAction: 'none' }}>
      <div
        ref={wrapRef}
        tabIndex={0}
        role="application"
        aria-label="2 player versus arena"
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        className="relative outline-none"
        style={{ touchAction: 'none', overscrollBehavior: 'none' }}
      >
        {/* HUD */}
        <div className="mb-2 grid grid-cols-[1fr_auto_1fr] items-start gap-2 sm:mb-3 sm:items-center sm:gap-3">
          <div>
            <HudBar hero={fighterA} hp={p1.hp} fx={fxA} align="left" label="P1 · LEFT" />
            <p className="mt-1 hidden text-[10px] leading-snug text-sky-300/80 sm:block">
              WASD · hold W/Space ascend · T punch · Y ability
            </p>
          </div>
          <div className="text-center">
            <div className="font-display text-xl text-amber-300 tabular-nums sm:text-2xl">{timeLeft}s</div>
            <div className="text-[10px] tracking-widest text-slate-500">VS</div>
          </div>
          <div>
            <HudBar hero={fighterB} hp={p2.hp} fx={fxB} align="right" label="P2 · RIGHT" />
            <p className="mt-1 hidden text-[10px] leading-snug text-rose-300/80 sm:block sm:text-right">
              Arrows · Enter punch · Shift ability
            </p>
          </div>
        </div>

        <div
          ref={stageRef}
          className="relative mx-auto w-full max-w-[960px] overflow-hidden rounded-2xl border border-white/10 sm:rounded-3xl"
          style={{ height: scaledH, touchAction: 'none' }}
        >
          <motion.div
            className="relative overflow-hidden"
            style={{
              background: arenaBg(arena),
              width: ARENA_W,
              height: ARENA_H,
              transform: `scale(${scale})`,
              transformOrigin: 'top left',
            }}
            animate={shake > 0.4 ? { x: [0, -4, 4, -2, 2, 0], y: [0, 2, -2, 0] } : { x: 0, y: 0 }}
            transition={{ duration: 0.18 }}
          >
            {/* Ground line */}
            <div
              className="absolute inset-x-0 bottom-0 h-[72px] border-t border-white/10"
              style={{
                background:
                  'linear-gradient(180deg, rgba(15,23,42,0.2), rgba(2,6,23,0.85)), repeating-linear-gradient(90deg, transparent, transparent 40px, rgba(56,189,248,0.06) 40px, rgba(56,189,248,0.06) 41px)',
              }}
            />

            {/* Math / gate readout */}
            <div className="absolute left-1/2 top-3 z-20 w-[min(90%,420px)] -translate-x-1/2 rounded-xl border border-sky-400/20 bg-black/55 px-3 py-2 text-center text-[11px] text-sky-200/90">
              <div className="flex justify-center gap-3 font-mono text-xs">
                <span className="text-sky-300">
                  <MathExpression base={fighterA.base} exponent={fighterA.exponent} power={fighterA.power} showPower />
                </span>
                <span className="text-slate-500">vs</span>
                <span className="text-rose-300">
                  <MathExpression base={fighterB.base} exponent={fighterB.exponent} power={fighterB.power} showPower />
                </span>
              </div>
              <p className="mt-1 text-[10px] tracking-wide text-slate-400">{lastGate}</p>
            </div>

            <FighterSprite hero={fighterA} fx={fxA} state={p1} side="p1" tick={tick} />
            <FighterSprite hero={fighterB} fx={fxB} state={p2} side="p2" tick={tick} />

            <AnimatePresence>
              {fxEvents.map((ev) => (
                <motion.div
                  key={ev.id}
                  className="pointer-events-none absolute z-[25] -translate-x-1/2 -translate-y-1/2 font-display text-xs tracking-wider"
                  style={{ left: ev.x, top: ev.y, color: ev.color, textShadow: `0 0 10px ${ev.color}` }}
                  initial={{ opacity: 0, scale: 0.6, y: 8 }}
                  animate={{ opacity: 1, scale: 1.1, y: -12 }}
                  exit={{ opacity: 0 }}
                >
                  {ev.label.toUpperCase()}
                </motion.div>
              ))}
            </AnimatePresence>

            <AnimatePresence>
              {outcome && (
                <motion.div
                  className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-black/75 px-4 text-center"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                >
                  <div className="font-display text-3xl text-amber-300">
                    {outcome === 'draw' ? 'SPECTACULAR DRAW' : `WINNER: ${winnerLabel}`}
                  </div>
                  <p className="mt-2 max-w-md text-sm text-slate-300">
                    {fighterA.expression}={fighterA.power} vs {fighterB.expression}={fighterB.power}
                    {outcome === 'draw'
                      ? ' — equal remaining HP (or both zero).'
                      : ` — ${VERSUS_RULES_COPY}`}
                  </p>
                  <div className="mt-6 flex flex-wrap justify-center gap-3">
                    <button type="button" className="btn-primary text-xs" onClick={onRematch ?? resetMatch}>
                      REMATCH
                    </button>
                    {onExit && (
                      <button type="button" className="btn-secondary text-xs" onClick={onExit}>
                        CHANGE FIGHTERS
                      </button>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>

          {!focused && !outcome && (
            <button
              type="button"
              className="absolute inset-0 z-40 flex items-center justify-center bg-black/55 px-4 text-center text-xs tracking-widest text-sky-200 sm:text-sm"
              onClick={() => wrapRef.current?.focus()}
            >
              TAP ARENA FOR KEYBOARD · TOUCH PADS READY
            </button>
          )}

          {!outcome && (
            <TouchPads
              onDirChange={(side, dir, active) => {
                wrapRef.current?.focus()
                onTouchDirChange(side, dir, active)
              }}
              onAction={(side, kind) => {
                wrapRef.current?.focus()
                onTouchAction(side, kind)
              }}
            />
          )}
        </div>
      </div>

      {/* Separate control panels — P1 left / P2 right */}
      <div className="mx-auto grid max-w-4xl gap-3 sm:grid-cols-2">
        <div className="rounded-2xl border border-sky-400/30 bg-sky-500/10 p-3 text-xs text-slate-200 sm:p-4">
          <div className="flex items-center justify-between gap-2">
            <div className="font-display tracking-widest text-sky-300">PLAYER 1 · LEFT</div>
            <span className="rounded bg-sky-500/25 px-2 py-0.5 text-[10px] font-semibold text-sky-100">P1</span>
          </div>
          <p className="mt-2 leading-relaxed">
            <span className="font-semibold text-white">WASD</span> · hold{' '}
            <span className="font-semibold text-white">W</span>/<span className="font-semibold text-white">Space</span>{' '}
            ascend · <span className="font-semibold text-white">S</span> descend ·{' '}
            <span className="font-semibold text-white">T</span> punch ·{' '}
            <span className="font-semibold text-white">Y</span> ability
          </p>
          <p className="mt-1.5 text-[10px] text-sky-200/70">Touch: left d-pad (hold ▲ ascend) · Punch · Ability</p>
        </div>
        <div className="rounded-2xl border border-rose-400/30 bg-rose-500/10 p-3 text-xs text-slate-200 sm:p-4">
          <div className="flex items-center justify-between gap-2">
            <div className="font-display tracking-widest text-rose-300">PLAYER 2 · RIGHT</div>
            <span className="rounded bg-rose-500/25 px-2 py-0.5 text-[10px] font-semibold text-rose-100">P2</span>
          </div>
          <p className="mt-2 leading-relaxed">
            <span className="font-semibold text-white">Arrows</span> · hold{' '}
            <span className="font-semibold text-white">↑</span> ascend ·{' '}
            <span className="font-semibold text-white">↓</span> descend ·{' '}
            <span className="font-semibold text-white">Enter</span> punch ·{' '}
            <span className="font-semibold text-white">Shift</span> ability
          </p>
          <p className="mt-1.5 text-[10px] text-rose-200/70">Touch: right d-pad (hold ▲ ascend) · Punch · Ability</p>
        </div>
        <p className="text-[11px] text-slate-500 sm:col-span-2">{VERSUS_RULES_COPY}</p>
      </div>
    </div>
  )
}

function makeFighter(x: number, y: number, facing: 1 | -1): FighterState {
  return {
    x,
    y,
    vx: 0,
    vy: 0,
    facing,
    flying: false,
    hp: MAX_HP,
    punchCd: 0,
    abilityCd: 0,
    stun: 0,
    punching: 0,
    abilitying: 0,
    hitFlash: 0,
    blockedFlash: 0,
  }
}

function decayTimers(f: FighterState, dt: number) {
  f.punchCd = Math.max(0, f.punchCd - dt)
  f.abilityCd = Math.max(0, f.abilityCd - dt)
  f.stun = Math.max(0, f.stun - dt)
  f.punching = Math.max(0, f.punching - dt)
  f.abilitying = Math.max(0, f.abilitying - dt)
  f.hitFlash = Math.max(0, f.hitFlash - dt)
  f.blockedFlash = Math.max(0, f.blockedFlash - dt)
}

function integrateFighter(
  f: FighterState,
  dt: number,
  input: {
    left: boolean
    right: boolean
    ascend: boolean
    descend: boolean
  },
) {
  decayTimers(f, dt)
  if (f.stun > 0) {
    f.x += f.vx * dt
    f.y += f.vy * dt
    f.vx *= 0.85
    f.vy *= 0.9
    clampFighterToArena(f)
    return
  }

  applyHoldToAscendFlight(f, { ascend: input.ascend, descend: input.descend }, dt, GROUND_Y)

  let ax = 0
  if (input.left) ax -= 1
  if (input.right) ax += 1
  const airborne = f.flying || f.y < GROUND_Y - 1
  const speed = airborne ? FLY_SPEED : MOVE_SPEED
  f.vx = ax * speed

  f.x += f.vx * dt
  f.y += f.vy * dt
  clampFighterToArena(f)

  // Re-apply landing after integration (position may have crossed the floor)
  if (f.y >= GROUND_Y - 0.5) {
    f.y = GROUND_Y
    if (!input.ascend) {
      f.vy = 0
      f.flying = false
    }
  }
}

function HudBar({
  hero,
  hp,
  fx,
  align,
  label,
}: {
  hero: Hero
  hp: number
  fx: ReturnType<typeof getAbilityFx>
  align: 'left' | 'right'
  label: string
}) {
  return (
    <div className={align === 'right' ? 'text-right' : 'text-left'}>
      <div className="flex items-center gap-2 text-[10px] tracking-widest text-slate-400" style={{ justifyContent: align === 'right' ? 'flex-end' : 'flex-start' }}>
        <span style={{ color: fx.accent }}>{label}</span>
        <span className="font-display text-xs" style={{ color: hero.mainColor }}>
          {hero.name}
        </span>
      </div>
      <div className="mt-1 h-2.5 overflow-hidden rounded-full bg-slate-800">
        <div
          className="h-full transition-[width] duration-150"
          style={{
            width: `${(hp / MAX_HP) * 100}%`,
            background: `linear-gradient(90deg, ${hero.secondaryColor}, ${hero.accentColor})`,
            marginLeft: align === 'right' ? 'auto' : undefined,
          }}
        />
      </div>
      <div className="mt-0.5 font-mono text-[10px] text-slate-500">
        <MathExpression base={hero.base} exponent={hero.exponent} power={hero.power} showPower />
      </div>
    </div>
  )
}

function FighterSprite({
  hero,
  fx,
  state,
  side,
  tick,
}: {
  hero: Hero
  fx: ReturnType<typeof getAbilityFx>
  state: FighterState
  side: 'p1' | 'p2'
  tick: number
}) {
  const face = state.facing
  return (
    <div
      className="absolute z-10"
      style={{
        left: state.x,
        top: state.y,
        width: 88,
        marginLeft: -44,
        marginTop: -88,
        filter:
          state.hitFlash > 0
            ? 'brightness(1.8)'
            : state.blockedFlash > 0
              ? 'grayscale(0.4) brightness(1.2)'
              : undefined,
      }}
    >
      <div style={{ transform: `scaleX(${face})` }} className="relative">
        {/* Ability beam toward facing direction */}
        {state.abilitying > 0 && (
          <div
            className="pointer-events-none absolute left-1/2 top-[42%] h-3 -translate-y-1/2 rounded-full"
            style={{
              width: ABILITY_RANGE * 0.85,
              background: `linear-gradient(90deg, ${fx.accent}, ${fx.secondary}88, transparent)`,
              boxShadow: `0 0 18px ${fx.secondary}`,
              opacity: 0.9,
              transformOrigin: 'left center',
            }}
          />
        )}
        {/* Punch fist */}
        {state.punching > 0 && (
          <div
            className="pointer-events-none absolute left-1/2 top-[42%] h-3.5 w-3.5 -translate-y-1/2 rounded-md"
            style={{
              background: fx.primary,
              boxShadow: `0 0 10px ${fx.accent}`,
              transform: 'translateX(28px)',
            }}
          />
        )}
        {state.flying && (
          <div
            className="pointer-events-none absolute left-1/2 top-full h-8 w-10 -translate-x-1/2 rounded-full blur-md"
            style={{ background: `${fx.secondary}66` }}
          />
        )}
        <HeroArt hero={hero} size={88} animated={state.punching > 0 || state.abilitying > 0 || tick % 20 < 10} />
      </div>
      <div className="mt-0.5 text-center font-display text-[9px] tracking-wider" style={{ color: fx.accent }}>
        {side.toUpperCase()}
      </div>
    </div>
  )
}
