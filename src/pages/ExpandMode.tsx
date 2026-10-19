import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowLeft, Sparkles } from 'lucide-react'
import { formatExpandedEquation, parseNonNegativeInt, toExpandedForm } from '../mathEngine'
import { HEROES, getHeroByPowerPair, getRandomHeroes } from '../heroes/data'
import type { Hero } from '../heroes/types'
import { HeroArt } from '../heroes/HeroArt'
import { LearningActionStage } from '../components/LearningActionStage'

const PRESETS = [0, 7, 100, 540, 2048, 10_005] as const

function placeExponents(value: number): number[] {
  if (value === 0) return [0]
  const digits = String(value)
  const exps: number[] = []
  for (let i = 0; i < digits.length; i += 1) {
    if (Number(digits[i]) === 0) continue
    exps.push(digits.length - 1 - i)
  }
  return exps.length ? exps : [0]
}

function pickExpandHeroes(value: number): [Hero, Hero] {
  const places = placeExponents(value)
  const top = Math.min(places[0] ?? 0, 5)
  const second = Math.min(places[1] ?? (top === 0 ? 1 : 0), 5)
  const heroA =
    getHeroByPowerPair(10, top) ??
    getHeroByPowerPair(Math.min(Math.max(value % 10 || 1, 1), 10), top) ??
    HEROES.find((h) => h.exponent === top) ??
    HEROES[20]!
  const heroB =
    getHeroByPowerPair(10, second) ??
    getRandomHeroes(1, [heroA.id])[0] ??
    HEROES.find((h) => h.id !== heroA.id)!
  return [heroA, heroB]
}

export function ExpandMode() {
  const [raw, setRaw] = useState('540')
  const value = useMemo(() => parseNonNegativeInt(raw), [raw])
  const equation = value === null ? null : formatExpandedEquation(value)
  const expanded = value === null ? null : toExpandedForm(value)
  const invalid = raw.trim().length > 0 && value === null
  const heroes = useMemo(() => (value === null ? null : pickExpandHeroes(value)), [value])

  return (
    <div className="relative mx-auto min-h-[calc(100vh-8rem)] max-w-3xl overflow-hidden px-4 py-8">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_30%_20%,rgba(56,189,248,0.16),transparent_50%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_80%_70%,rgba(251,191,36,0.1),transparent_45%)]" />
        <motion.div
          className="absolute left-1/2 top-24 -translate-x-1/2 font-display text-[22vw] leading-none text-sky-500/[0.07]"
          animate={{ opacity: [0.05, 0.12, 0.05], scale: [1, 1.03, 1] }}
          transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
        >
          10ⁿ
        </motion.div>
        {heroes && value !== null && value !== 0 ? (
          <>
            <motion.div
              className="absolute -left-6 top-36 opacity-35"
              animate={{ y: [0, -12, 0], x: [0, 8, 0] }}
              transition={{ duration: 4.5, repeat: Infinity, ease: 'easeInOut' }}
            >
              <HeroArt hero={heroes[0]} size={160} animated />
            </motion.div>
            <motion.div
              className="absolute -right-6 top-48 opacity-35"
              animate={{ y: [0, 10, 0], x: [0, -10, 0] }}
              transition={{ duration: 5.2, repeat: Infinity, ease: 'easeInOut' }}
            >
              <HeroArt hero={heroes[1]} size={150} animated />
            </motion.div>
          </>
        ) : null}
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
            to="/learning/power"
            className="text-xs font-semibold tracking-widest text-slate-500 transition hover:text-rose-300"
          >
            POWER MODE
          </Link>
        </div>

        <motion.h1
          className="mt-4 font-display text-3xl tracking-[0.2em] text-amber-200 sm:text-4xl"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55 }}
        >
          EXPAND MODE
        </motion.h1>
        <motion.p
          className="mt-3 max-w-xl text-slate-300"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.08, duration: 0.5 }}
        >
          Break a whole number into place-value powers of ten — then watch place-value heroes duel over the
          expansion.
        </motion.p>

        <motion.div
          className="panel mt-8 rounded-2xl p-5 sm:p-6"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15, duration: 0.55 }}
        >
          <label htmlFor="expand-input" className="text-[11px] uppercase tracking-[0.35em] text-slate-500">
            Non-negative integer
          </label>
          <input
            id="expand-input"
            inputMode="numeric"
            pattern="[0-9]*"
            value={raw}
            onChange={(e) => setRaw(e.target.value)}
            placeholder="Try 540"
            className="mt-2 w-full rounded-xl border border-white/10 bg-slate-950/70 px-4 py-3 font-mono text-2xl tracking-wide text-sky-100 outline-none ring-sky-400/40 transition focus:ring-2"
            aria-invalid={invalid}
          />
          {invalid ? (
            <p className="mt-2 text-sm text-rose-300">Enter a non-negative whole number (digits only).</p>
          ) : null}

          <div className="mt-4 flex flex-wrap gap-2">
            {PRESETS.map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => setRaw(String(n))}
                className={`rounded-lg border px-3 py-1.5 text-xs font-semibold tracking-wide transition ${
                  value === n
                    ? 'border-amber-400/50 bg-amber-400/15 text-amber-100'
                    : 'border-white/10 text-slate-300 hover:border-sky-400/40 hover:text-sky-200'
                }`}
              >
                {n}
              </button>
            ))}
          </div>

          <div className="mt-8 min-h-[7rem]">
            <AnimatePresence mode="wait">
              {equation && expanded !== null ? (
                <motion.div
                  key={equation}
                  initial={{ opacity: 0, y: 18, filter: 'blur(6px)' }}
                  animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                  exit={{ opacity: 0, y: -10, filter: 'blur(4px)' }}
                  transition={{ duration: 0.45 }}
                  className="text-center"
                >
                  <p className="text-[11px] uppercase tracking-[0.35em] text-slate-500">Expanded form</p>
                  <p className="mt-3 font-mono text-xl leading-relaxed text-sky-100 sm:text-2xl md:text-3xl">
                    <span className="text-amber-200">{value}</span>
                    <span className="mx-2 text-slate-500">=</span>
                    <span className="text-fuchsia-200">{expanded}</span>
                  </p>
                  <motion.div
                    className="mx-auto mt-4 flex items-center justify-center gap-2 text-xs text-slate-400"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.25 }}
                  >
                    <Sparkles size={12} className="text-amber-300/80" />
                    Place values · zero digits skipped · heroes charge next
                  </motion.div>
                </motion.div>
              ) : (
                <motion.p
                  key="empty"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="py-8 text-center text-slate-500"
                >
                  Type a number to expand it.
                </motion.p>
              )}
            </AnimatePresence>
          </div>
        </motion.div>

        {equation && heroes && value !== null ? (
          <LearningActionStage
            heroA={heroes[0]}
            heroB={heroes[1]}
            headline={equation}
            teach="Place-value heroes clash — higher powers of ten carry more weight in the expansion."
            resultKey={equation}
            arena="storm-spire"
          />
        ) : null}

        <motion.aside
          className="mt-6 rounded-2xl border border-white/10 bg-black/30 px-5 py-4 text-sm leading-relaxed text-slate-400"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          <p className="text-[11px] uppercase tracking-[0.3em] text-slate-500">Convention</p>
          <ul className="mt-2 list-disc space-y-1.5 pl-5">
            <li>
              <span className="font-mono text-slate-300">0</span> stays <span className="font-mono text-slate-300">0</span>{' '}
              — no place-value terms.
            </li>
            <li>
              Zero digits are skipped: <span className="font-mono text-slate-300">100 = 1×10²</span>.
            </li>
            <li>
              Ones place always shown as <span className="font-mono text-slate-300">×10⁰</span> — so{' '}
              <span className="font-mono text-slate-300">7 = 7×10⁰</span>.
            </li>
          </ul>
        </motion.aside>
      </div>
    </div>
  )
}
