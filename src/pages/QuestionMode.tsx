import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { HelpCircle, Zap, Flame, Trophy } from 'lucide-react'
import { getRandomHeroes } from '../heroes/data'
import type { Hero } from '../heroes/types'
import { HeroArt } from '../heroes/HeroArt'
import { MathExpression } from '../components/MathExpression'
import { FightSequence } from '../animations/FightSequence'
import { playFightCue } from '../audio/soundEngine'
import { calculateTruePower } from '../mathEngine'
import {
  applyAnswer,
  createRun,
  generateQuestion,
  gradeLabel,
  type Question,
  type QuestionRunState,
  type RoundOutcome,
} from '../questionMode/questionEngine'

type Stage = 'pick' | 'quiz' | 'fight' | 'result'

const ARENAS = ['neon-colosseum', 'void-rift', 'storm-spire', 'ember-crater', 'crystal-arena'] as const

const TYPE_LABEL: Record<Question['type'], string> = {
  stronger: 'Who is Stronger?',
  weaker: 'Who is Weaker?',
  evaluate: 'Square / Cube',
}

function HeroPowerLabel({
  hero,
  tone,
  showValue,
}: {
  hero: Hero
  tone: 'sky' | 'rose' | 'amber'
  showValue: boolean
}) {
  const toneClass =
    tone === 'sky'
      ? 'text-sky-100'
      : tone === 'rose'
        ? 'text-rose-100'
        : 'text-amber-100'
  return (
    <div className={`mt-2 drop-shadow-[0_1px_3px_rgba(0,0,0,0.95)] ${toneClass}`}>
      <MathExpression
        base={hero.base}
        exponent={hero.exponent}
        power={showValue ? calculateTruePower(hero.base, hero.exponent) : undefined}
        showPower={showValue}
        size="xl"
      />
    </div>
  )
}

export function QuestionMode() {
  const [stage, setStage] = useState<Stage>('pick')
  const [champion, setChampion] = useState<Hero | null>(null)
  const [run, setRun] = useState<QuestionRunState | null>(null)
  const [question, setQuestion] = useState<Question | null>(null)
  const [outcome, setOutcome] = useState<RoundOutcome | null>(null)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [locked, setLocked] = useState(false)
  const [pickPool] = useState(() => getRandomHeroes(8))

  const arena = useMemo(
    () => ARENAS[(run?.round ?? 1) % ARENAS.length]!,
    [run?.round],
  )

  function startWith(hero: Hero) {
    const nextRun = createRun(hero)
    setChampion(hero)
    setRun(nextRun)
    setQuestion(generateQuestion(nextRun))
    setOutcome(null)
    setSelectedId(null)
    setLocked(false)
    setStage('quiz')
    playFightCue('intro')
  }

  function randomChampion() {
    const [hero] = getRandomHeroes(1)
    if (hero) startWith(hero)
  }

  function onPickOption(optionId: string) {
    if (!question || !run || locked) return
    setLocked(true)
    setSelectedId(optionId)
    const { state, outcome: nextOutcome } = applyAnswer(run, question, optionId)
    setRun(state)
    setOutcome(nextOutcome)
    playFightCue(nextOutcome.correct ? 'reveal' : 'impact')
    window.setTimeout(() => setStage('fight'), 650)
  }

  function onFightComplete() {
    setStage('result')
  }

  function nextQuestion() {
    if (!run) return
    setQuestion(generateQuestion(run))
    setOutcome(null)
    setSelectedId(null)
    setLocked(false)
    setStage('quiz')
    playFightCue('whoosh')
  }

  function changeChampion() {
    setStage('pick')
    setChampion(null)
    setRun(null)
    setQuestion(null)
    setOutcome(null)
    setSelectedId(null)
    setLocked(false)
  }

  useEffect(() => {
    if (stage !== 'quiz' || !question) return
    playFightCue('blast')
  }, [stage, question?.id])

  return (
    <div className="relative mx-auto max-w-5xl px-3 py-4 sm:px-4 sm:py-8">
      <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute left-1/2 top-0 h-64 w-[120%] -translate-x-1/2 bg-[radial-gradient(ellipse_at_center,rgba(251,191,36,0.14),transparent_60%)]" />
        <motion.div
          className="absolute inset-x-0 top-24 h-px bg-gradient-to-r from-transparent via-amber-400/50 to-transparent"
          animate={{ opacity: [0.25, 0.7, 0.25] }}
          transition={{ duration: 3.2, repeat: Infinity }}
        />
      </div>

      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-[11px] uppercase tracking-[0.4em] text-amber-400/80">Quiz → Clash</p>
          <h1 className="font-display text-2xl tracking-widest text-amber-200 sm:text-4xl">QUESTION MODE</h1>
          <p className="mt-2 max-w-xl text-sm text-slate-400 sm:text-base">
            Three question types: who is stronger, who is weaker, or what is a square/cube (e.g. 6² / 3³).
            True math only (n⁰ = 1). Correct answers charge your champion; misses feed the rival.
          </p>
        </div>
        {run && champion && (
          <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-black/40 px-3 py-2">
            <HeroArt hero={champion} size={56} animated={stage === 'quiz'} />
            <div className="text-left text-xs sm:text-sm">
              <div className="font-display tracking-wide text-sky-200">{champion.name}</div>
              <div className="text-sky-100">
                <MathExpression
                  base={champion.base}
                  exponent={champion.exponent}
                  power={calculateTruePower(champion.base, champion.exponent)}
                  showPower
                  size="lg"
                />
              </div>
              <div className="mt-1 flex flex-wrap gap-2 text-[11px] text-slate-300">
                <span className="inline-flex items-center gap-1">
                  <Trophy size={12} className="text-amber-300" /> {run.score}
                </span>
                <span className="inline-flex items-center gap-1">
                  <Flame size={12} className="text-orange-400" /> {run.streak} streak
                </span>
                <span className="text-slate-500">{gradeLabel(run)}</span>
              </div>
            </div>
          </div>
        )}
      </header>

      <AnimatePresence mode="wait">
        {stage === 'pick' && (
          <motion.section
            key="pick"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="mt-6"
          >
            <div className="rounded-2xl border border-amber-400/20 bg-black/45 p-4 sm:p-6">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="font-display text-lg tracking-widest text-sky-200">CHOOSE YOUR CHAMPION</h2>
                  <p className="mt-1 text-sm text-slate-400">
                    Correct answers power their next attack. Misses power a rival instead.
                  </p>
                </div>
                <button type="button" className="btn-secondary text-xs" onClick={randomChampion}>
                  RANDOM CHAMPION
                </button>
              </div>
              <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
                {pickPool.map((hero) => (
                  <button
                    key={hero.id}
                    type="button"
                    onClick={() => startWith(hero)}
                    className="group rounded-xl border border-white/10 bg-slate-950/60 p-3 text-center transition hover:border-amber-300/50 hover:bg-amber-500/10"
                  >
                    <HeroArt hero={hero} size={96} animated className="mx-auto" />
                    <div className="mt-2 font-display text-xs tracking-wide text-slate-200 group-hover:text-amber-100">
                      {hero.name}
                    </div>
                    <div className="mt-1 text-sky-100">
                      <MathExpression
                        base={hero.base}
                        exponent={hero.exponent}
                        power={calculateTruePower(hero.base, hero.exponent)}
                        showPower
                        size="lg"
                      />
                    </div>
                  </button>
                ))}
              </div>
              <p className="mt-4 text-center text-xs text-slate-500">
                Full roster lives in{' '}
                <Link to="/gallery" className="text-sky-400 hover:text-sky-300">
                  Heroes
                </Link>
                . Power, Expand, and 2 Player are unchanged.
              </p>
            </div>
          </motion.section>
        )}

        {stage === 'quiz' && question && (
          <motion.section
            key={question.id}
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.98 }}
            className="mt-6"
          >
            <div className="overflow-hidden rounded-2xl border border-white/10 bg-slate-950/70">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/10 px-4 py-3 sm:px-6">
                <span className="inline-flex items-center gap-1.5 text-[11px] uppercase tracking-[0.28em] text-amber-300/90">
                  <HelpCircle size={14} />
                  Round {run?.round ?? 1} · {TYPE_LABEL[question.type]}
                </span>
                <span className="text-[11px] tracking-wide text-slate-500">{question.hint}</span>
              </div>

              <div className="grid gap-4 p-4 sm:grid-cols-[1fr_1.1fr] sm:p-6">
                <div className="flex flex-col items-center justify-center rounded-xl border border-white/5 bg-black/30 p-4">
                  {question.type === 'evaluate' ? (
                    <div className="text-center">
                      <HeroArt hero={question.clashA} size={140} animated />
                      <p className="mt-2 font-display text-base tracking-wide text-sky-200 sm:text-lg">
                        {question.clashA.name}
                      </p>
                      <HeroPowerLabel hero={question.clashA} tone="amber" showValue={false} />
                    </div>
                  ) : (
                    <div className="flex w-full items-end justify-around gap-2">
                      <div className="min-w-0 flex-1 text-center">
                        <HeroArt hero={question.clashA} size={120} animated />
                        <p className="mt-2 text-xs font-medium text-slate-200 sm:text-sm">
                          {question.clashA.name}
                        </p>
                        <HeroPowerLabel hero={question.clashA} tone="sky" showValue />
                      </div>
                      <motion.div
                        className="shrink-0 pb-10 font-display text-2xl text-rose-400 sm:text-3xl"
                        animate={{ scale: [1, 1.15, 1] }}
                        transition={{ duration: 1.2, repeat: Infinity }}
                      >
                        VS
                      </motion.div>
                      <div className="min-w-0 flex-1 text-center">
                        <HeroArt hero={question.clashB} size={120} animated />
                        <p className="mt-2 text-xs font-medium text-slate-200 sm:text-sm">
                          {question.clashB.name}
                        </p>
                        <HeroPowerLabel hero={question.clashB} tone="rose" showValue />
                      </div>
                    </div>
                  )}
                </div>

                <div>
                  <h2 className="font-display text-xl tracking-wide text-white sm:text-2xl">{question.prompt}</h2>
                  <div className="mt-4 grid gap-2">
                    {question.options.map((opt) => {
                      const picked = selectedId === opt.id
                      return (
                        <button
                          key={opt.id}
                          type="button"
                          disabled={locked}
                          onClick={() => onPickOption(opt.id)}
                          className={`rounded-xl border px-4 py-3 text-left font-mono text-base transition sm:text-lg ${
                            picked
                              ? 'border-amber-300/70 bg-amber-500/20 text-amber-100'
                              : 'border-white/10 bg-black/40 text-slate-100 hover:border-sky-400/50 hover:bg-sky-500/10'
                          } disabled:cursor-default`}
                        >
                          {opt.label}
                        </button>
                      )
                    })}
                  </div>
                </div>
              </div>
            </div>
          </motion.section>
        )}

        {(stage === 'fight' || stage === 'result') && question && outcome && (
          <motion.section
            key={`fight-${question.id}`}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-6 space-y-4"
          >
            <div
              className={`flex flex-wrap items-center justify-between gap-2 rounded-xl border px-4 py-3 ${
                outcome.correct
                  ? 'border-emerald-400/40 bg-emerald-500/10'
                  : 'border-rose-400/40 bg-rose-500/10'
              }`}
            >
              <div className="flex items-center gap-2 text-sm sm:text-base">
                <Zap size={16} className={outcome.correct ? 'text-emerald-300' : 'text-rose-300'} />
                <span className={outcome.correct ? 'text-emerald-200' : 'text-rose-200'}>
                  {outcome.correct
                    ? 'Correct — your answer charges the next attack.'
                    : 'Miss — the rival absorbs the charge.'}
                </span>
              </div>
              <span className="text-[11px] uppercase tracking-[0.25em] text-slate-400">
                Charge → {outcome.chargedSide === 'player' ? 'Champion side' : 'Rival side'}
              </span>
            </div>

            <FightSequence
              fighterA={question.clashA}
              fighterB={question.clashB}
              result={question.battle}
              arena={arena}
              compact
              hideReplay
              largeMath
              onComplete={onFightComplete}
            />

            {stage === 'result' && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-2xl border border-sky-400/25 bg-black/55 p-4 sm:p-5"
              >
                <p className="text-[11px] uppercase tracking-[0.3em] text-slate-500">Math truth</p>
                <p className="mt-2 font-mono text-lg text-sky-100 sm:text-xl">{question.teach}</p>
                {run && (
                  <p className="mt-3 text-sm text-slate-400">
                    Score <span className="text-amber-300">{run.score}</span> · Best streak{' '}
                    <span className="text-orange-300">{run.bestStreak}</span> · {run.correctCount}/
                    {run.answered} correct · {gradeLabel(run)}
                  </p>
                )}
                <div className="mt-4 flex flex-wrap gap-3">
                  <button type="button" className="btn-primary text-xs" onClick={nextQuestion}>
                    NEXT QUESTION
                  </button>
                  <button type="button" className="btn-secondary text-xs" onClick={changeChampion}>
                    NEW CHAMPION
                  </button>
                  <Link to="/" className="btn-secondary text-xs">
                    HOME
                  </Link>
                </div>
              </motion.div>
            )}
          </motion.section>
        )}
      </AnimatePresence>
    </div>
  )
}
