import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { ArrowLeft, Hexagon, Square, Sparkles } from 'lucide-react'
import { HEROES, getHeroByPowerPair, getRandomHeroes } from '../heroes/data'
import type { Hero } from '../heroes/types'
import { HeroArt } from '../heroes/HeroArt'
import { LearningActionStage } from '../components/LearningActionStage'
import {
  explainPower,
  formatExpression,
  formatPowerExpansion,
  parseNonNegativeInt,
  parsePositiveInt,
  raiseToPower,
  toSuperscript,
} from '../mathEngine'

type PowerKind = 'squared' | 'cubed' | 'other'

const KIND_META: Record<
  PowerKind,
  { label: string; blurb: string; exponent: number | null; icon: 'square' | 'cube' | 'other' }
> = {
  squared: {
    label: 'Squared',
    blurb: 'Exponent 2 — multiply the base by itself once.',
    exponent: 2,
    icon: 'square',
  },
  cubed: {
    label: 'Cubed',
    blurb: 'Exponent 3 — multiply the base by itself twice.',
    exponent: 3,
    icon: 'cube',
  },
  other: {
    label: 'Other',
    blurb: 'Declare any positive integer exponent.',
    exponent: null,
    icon: 'other',
  },
}

function pickPowerHeroes(base: number, exponent: number): [Hero, Hero] {
  const primary =
    getHeroByPowerPair(base, Math.min(exponent, 5)) ??
    HEROES.find((h) => h.exponent === Math.min(exponent, 5) && h.base === Math.min(Math.max(base, 0), 10)) ??
    HEROES.find((h) => h.exponent === (exponent === 2 ? 2 : exponent === 3 ? 3 : h.exponent)) ??
    HEROES[14]!

  const rivals = getRandomHeroes(4, [primary.id])
  const rival =
    rivals.find((h) => h.exponent !== primary.exponent || h.base !== primary.base) ?? rivals[0] ?? HEROES[23]!
  return [primary, rival]
}

function KindIcon({ kind }: { kind: PowerKind }) {
  if (kind === 'squared') return <Square size={18} />
  if (kind === 'cubed') return <Hexagon size={18} />
  return <Sparkles size={18} />
}

export function PowerMode() {
  const [kind, setKind] = useState<PowerKind>('squared')
  const [expRaw, setExpRaw] = useState('4')
  const [baseRaw, setBaseRaw] = useState('3')
  const [revealed, setRevealed] = useState(false)

  const customExp = useMemo(() => parsePositiveInt(expRaw), [expRaw])
  const base = useMemo(() => parseNonNegativeInt(baseRaw), [baseRaw])
  const exponent = kind === 'other' ? customExp : KIND_META[kind].exponent

  const baseInvalid = baseRaw.trim().length > 0 && base === null
  const expInvalid = kind === 'other' && expRaw.trim().length > 0 && customExp === null

  const computation = useMemo(() => {
    if (base === null || exponent === null) return null
    try {
      const value = raiseToPower(base, exponent)
      return {
        value,
        expansion: formatPowerExpansion(base, exponent),
        teach: explainPower(base, exponent),
        expr: formatExpression(base, exponent),
      }
    } catch {
      return { error: 'Result is too large — try a smaller base or exponent.' } as const
    }
  }, [base, exponent])

  const heroes = useMemo(() => {
    if (!computation || 'error' in computation || base === null || exponent === null) return null
    return pickPowerHeroes(base, exponent)
  }, [computation, base, exponent])

  function onCompute() {
    if (!computation || 'error' in computation) return
    setRevealed(true)
  }

  function onKindChange(next: PowerKind) {
    setKind(next)
    setRevealed(false)
    if (next === 'squared') setBaseRaw('3')
    if (next === 'cubed') setBaseRaw('2')
    if (next === 'other') {
      setExpRaw('4')
      setBaseRaw('2')
    }
  }

  return (
    <div className="relative mx-auto min-h-[calc(100vh-8rem)] max-w-3xl overflow-hidden px-4 py-8">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_25%_15%,rgba(251,191,36,0.14),transparent_50%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_85%_75%,rgba(244,63,94,0.1),transparent_45%)]" />
        <motion.div
          className="absolute left-1/2 top-20 -translate-x-1/2 font-display text-[20vw] leading-none text-amber-500/[0.07]"
          animate={{ opacity: [0.05, 0.12, 0.05], scale: [1, 1.04, 1] }}
          transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
        >
          n{toSuperscript(kind === 'cubed' ? 3 : 2)}
        </motion.div>
      </div>

      <div className="relative z-10">
        <div className="flex flex-wrap items-center gap-3">
          <Link
            to="/select"
            className="inline-flex items-center gap-1.5 text-xs font-semibold tracking-widest text-slate-400 transition hover:text-sky-300"
          >
            <ArrowLeft size={14} />
            LEARNING MODE
          </Link>
          <Link
            to="/learning/expand"
            className="text-xs font-semibold tracking-widest text-slate-500 transition hover:text-amber-300"
          >
            EXPAND MODE
          </Link>
        </div>

        <motion.h1
          className="mt-4 font-display text-3xl tracking-[0.2em] text-rose-200 sm:text-4xl"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
        >
          POWER MODE
        </motion.h1>
        <motion.p
          className="mt-3 max-w-xl text-slate-300"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.08 }}
        >
          Square, cube, or raise any base to a power — then watch related heroes prove the math in the arena.
        </motion.p>

        <motion.div
          className="panel mt-8 rounded-2xl p-5 sm:p-6"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.12 }}
        >
          <p className="text-[11px] uppercase tracking-[0.35em] text-slate-500">Choose operation</p>
          <div className="mt-3 grid gap-2 sm:grid-cols-3">
            {(Object.keys(KIND_META) as PowerKind[]).map((k) => {
              const meta = KIND_META[k]
              const active = kind === k
              return (
                <button
                  key={k}
                  type="button"
                  onClick={() => onKindChange(k)}
                  className={`rounded-xl border px-3 py-3 text-left transition ${
                    active
                      ? 'border-rose-400/50 bg-rose-500/15 text-rose-100'
                      : 'border-white/10 text-slate-300 hover:border-amber-400/40 hover:text-amber-100'
                  }`}
                >
                  <span className="inline-flex items-center gap-2 font-display text-sm tracking-widest">
                    <KindIcon kind={k} />
                    {meta.label}
                  </span>
                  <span className="mt-1 block text-[11px] leading-snug text-slate-400">{meta.blurb}</span>
                </button>
              )
            })}
          </div>

          <AnimatePresence>
            {kind === 'other' && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mt-4 overflow-hidden"
              >
                <label htmlFor="power-exp" className="text-[11px] uppercase tracking-[0.35em] text-slate-500">
                  Exponent (positive integer)
                </label>
                <input
                  id="power-exp"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  value={expRaw}
                  onChange={(e) => {
                    setExpRaw(e.target.value)
                    setRevealed(false)
                  }}
                  className="mt-2 w-full rounded-xl border border-white/10 bg-slate-950/70 px-4 py-3 font-mono text-xl text-amber-100 outline-none ring-amber-400/40 transition focus:ring-2"
                  aria-invalid={expInvalid}
                />
                {expInvalid ? (
                  <p className="mt-2 text-sm text-rose-300">Enter a positive whole number (1, 2, 3…).</p>
                ) : null}
              </motion.div>
            )}
          </AnimatePresence>

          <div className="mt-4">
            <label htmlFor="power-base" className="text-[11px] uppercase tracking-[0.35em] text-slate-500">
              Base (non-negative integer)
            </label>
            <input
              id="power-base"
              inputMode="numeric"
              pattern="[0-9]*"
              value={baseRaw}
              onChange={(e) => {
                setBaseRaw(e.target.value)
                setRevealed(false)
              }}
              placeholder={kind === 'cubed' ? 'Try 2' : 'Try 3'}
              className="mt-2 w-full rounded-xl border border-white/10 bg-slate-950/70 px-4 py-3 font-mono text-2xl tracking-wide text-sky-100 outline-none ring-sky-400/40 transition focus:ring-2"
              aria-invalid={baseInvalid}
            />
            {baseInvalid ? (
              <p className="mt-2 text-sm text-rose-300">Enter a non-negative whole number (digits only).</p>
            ) : null}
          </div>

          <div className="mt-5 flex flex-wrap gap-3">
            <button
              type="button"
              className="btn-primary text-xs disabled:opacity-40"
              disabled={!computation || 'error' in computation}
              onClick={onCompute}
            >
              COMPUTE POWER
            </button>
            {kind === 'squared' && (
              <button type="button" className="btn-secondary text-xs" onClick={() => { setBaseRaw('3'); setRevealed(false) }}>
                Demo 3²
              </button>
            )}
            {kind === 'cubed' && (
              <button type="button" className="btn-secondary text-xs" onClick={() => { setBaseRaw('2'); setRevealed(false) }}>
                Demo 2³
              </button>
            )}
            {kind === 'other' && (
              <button
                type="button"
                className="btn-secondary text-xs"
                onClick={() => {
                  setExpRaw('4')
                  setBaseRaw('2')
                  setRevealed(false)
                }}
              >
                Demo 2⁴
              </button>
            )}
          </div>

          <div className="mt-8 min-h-[6rem]">
            <AnimatePresence mode="wait">
              {computation && 'error' in computation ? (
                <motion.p
                  key="err"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-center text-rose-300"
                >
                  {computation.error}
                </motion.p>
              ) : revealed && computation ? (
                <motion.div
                  key={computation.expansion}
                  initial={{ opacity: 0, y: 16, filter: 'blur(6px)' }}
                  animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                  exit={{ opacity: 0 }}
                  className="text-center"
                >
                  <p className="text-[11px] uppercase tracking-[0.35em] text-slate-500">Result</p>
                  <p className="mt-3 font-mono text-xl leading-relaxed text-sky-100 sm:text-2xl md:text-3xl">
                    {computation.expansion}
                  </p>
                  <p className="mt-3 text-sm text-slate-400">{computation.teach}</p>
                  {heroes && (
                    <div className="mt-4 flex items-center justify-center gap-4 opacity-90">
                      <HeroArt hero={heroes[0]} size={72} animated />
                      <span className="font-display text-xs tracking-widest text-amber-200/80">
                        {heroes[0].name}
                      </span>
                    </div>
                  )}
                </motion.div>
              ) : (
                <motion.p
                  key="idle"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="py-6 text-center text-slate-500"
                >
                  Pick an operation, enter a base, then compute.
                </motion.p>
              )}
            </AnimatePresence>
          </div>
        </motion.div>

        {revealed && computation && !('error' in computation) && heroes && base !== null && exponent !== null ? (
          <LearningActionStage
            heroA={heroes[0]}
            heroB={heroes[1]}
            headline={computation.expansion}
            teach={computation.teach}
            resultKey={`${base}-${exponent}-${computation.value}`}
            arena="ember-crater"
          />
        ) : null}

        <motion.aside
          className="mt-6 rounded-2xl border border-white/10 bg-black/30 px-5 py-4 text-sm leading-relaxed text-slate-400"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.25 }}
        >
          <p className="text-[11px] uppercase tracking-[0.3em] text-slate-500">Examples</p>
          <ul className="mt-2 list-disc space-y-1.5 pl-5">
            <li>
              Squared: <span className="font-mono text-slate-300">3² = 3×3 = 9</span>
            </li>
            <li>
              Cubed: <span className="font-mono text-slate-300">2³ = 2×2×2 = 8</span>
            </li>
            <li>
              Other: <span className="font-mono text-slate-300">2⁴ = 2×2×2×2 = 16</span>
            </li>
          </ul>
        </motion.aside>
      </div>
    </div>
  )
}
