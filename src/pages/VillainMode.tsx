import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { Crown, Flame, ShieldAlert, Skull, Sparkles, Trophy, Zap } from 'lucide-react'
import { HeroArt } from '../heroes/HeroArt'
import type { Hero } from '../heroes/types'
import { MathExpression } from '../components/MathExpression'
import { FightSequence } from '../animations/FightSequence'
import { playFightCue } from '../audio/soundEngine'
import { ensureChampionCanClash, NULL_OVERLORD, pickChampionPool } from '../villainMode/cast'
import {
  applyVillainAnswer,
  createVillainRun,
  generateWaveQuestion,
  villainGradeLabel,
  waveLabel,
  type VillainQuestion,
  type VillainRoundOutcome,
  type VillainRunState,
} from '../villainMode/villainEngine'

type Stage = 'intro' | 'pick' | 'quiz' | 'fight' | 'cleared' | 'setback' | 'victory'

const ARENAS = ['void-rift', 'neon-colosseum', 'storm-spire', 'crystal-arena', 'ember-crater'] as const

export function VillainMode() {
  const [stage, setStage] = useState<Stage>('intro')
  const [champion, setChampion] = useState<Hero | null>(null)
  const [run, setRun] = useState<VillainRunState | null>(null)
  const [question, setQuestion] = useState<VillainQuestion | null>(null)
  const [outcome, setOutcome] = useState<VillainRoundOutcome | null>(null)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [locked, setLocked] = useState(false)
  const [pickPool] = useState(() => pickChampionPool(8))

  const arena = useMemo(
    () => ARENAS[((run?.wave ?? 1) - 1) % ARENAS.length]!,
    [run?.wave],
  )

  function beginPick() {
    setStage('pick')
    playFightCue('intro')
  }

  function startWith(hero: Hero) {
    const champ = ensureChampionCanClash(hero)
    const nextRun = createVillainRun(champ)
    setChampion(champ)
    setRun(nextRun)
    setQuestion(generateWaveQuestion(nextRun))
    setOutcome(null)
    setSelectedId(null)
    setLocked(false)
    setStage('quiz')
    playFightCue('blast')
  }

  function onPickOption(optionId: string) {
    if (!question || !run || locked) return
    setLocked(true)
    setSelectedId(optionId)
    const { state, outcome: nextOutcome } = applyVillainAnswer(run, question, optionId)
    setRun(state)
    setOutcome(nextOutcome)
    if (nextOutcome.correct) {
      playFightCue('reveal')
      window.setTimeout(() => setStage('fight'), 700)
    } else {
      playFightCue('impact')
      window.setTimeout(() => setStage('setback'), 650)
    }
  }

  function onFightComplete() {
    if (!run) return
    if (run.complete && run.victory) {
      setStage('victory')
      playFightCue('reveal')
      return
    }
    setStage('cleared')
  }

  function advanceWave() {
    if (!run) return
    const nextQ = generateWaveQuestion(run)
    setQuestion(nextQ)
    setOutcome(null)
    setSelectedId(null)
    setLocked(false)
    setStage('quiz')
    playFightCue('whoosh')
  }

  function retryWave() {
    if (!run) return
    setQuestion(generateWaveQuestion(run))
    setOutcome(null)
    setSelectedId(null)
    setLocked(false)
    setStage('quiz')
    playFightCue('blast')
  }

  function resetGauntlet() {
    setStage('intro')
    setChampion(null)
    setRun(null)
    setQuestion(null)
    setOutcome(null)
    setSelectedId(null)
    setLocked(false)
  }

  useEffect(() => {
    if (stage !== 'quiz' || !question) return
    playFightCue('whoosh')
  }, [stage, question?.id])

  return (
    <div className="relative mx-auto max-w-5xl overflow-hidden px-3 py-4 sm:px-4 sm:py-8">
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_0%,rgba(139,92,246,0.22),transparent_55%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_80%_80%,rgba(49,46,129,0.35),transparent_50%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_20%_70%,rgba(2,6,23,0.9),transparent_45%)]" />
        <motion.div
          className="absolute inset-x-0 top-28 h-px bg-gradient-to-r from-transparent via-violet-400/40 to-transparent"
          animate={{ opacity: [0.2, 0.7, 0.2] }}
          transition={{ duration: 3.4, repeat: Infinity }}
        />
        <motion.div
          className="absolute right-4 top-20 opacity-30 sm:right-10"
          animate={{ y: [0, -10, 0], rotate: [0, 3, 0] }}
          transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
        >
          <HeroArt hero={NULL_OVERLORD} size={140} animated />
        </motion.div>
      </div>

      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="inline-flex items-center gap-1.5 text-[11px] uppercase tracking-[0.4em] text-violet-300/90">
            <Skull size={12} /> Grade 6 gauntlet
          </p>
          <h1 className="font-display text-2xl tracking-widest text-violet-100 sm:text-4xl">
            NULL OVERLORD
          </h1>
          <p className="mt-2 max-w-xl text-sm text-slate-400 sm:text-base">
            The villain drains powers toward the void (0). Break the curse, charge squares and cubes, then
            duel — and face the boss. Kid-friendly, cinematic, true math (n⁰ = 1).
          </p>
        </div>
        {run && champion && (
          <div className="flex items-center gap-3 rounded-2xl border border-violet-400/25 bg-black/50 px-3 py-2">
            <HeroArt hero={champion} size={56} animated={stage === 'quiz'} />
            <div className="text-left text-xs sm:text-sm">
              <div className="font-display tracking-wide text-sky-200">{champion.name}</div>
              <div className="text-sky-100">
                <MathExpression base={champion.base} exponent={champion.exponent} size="lg" />
              </div>
              <div className="mt-1 flex flex-wrap gap-2 text-[11px] text-slate-300">
                <span className="inline-flex items-center gap-1">
                  <Trophy size={12} className="text-amber-300" /> {run.score}
                </span>
                <span className="inline-flex items-center gap-1">
                  <Flame size={12} className="text-orange-400" /> {run.streak}
                </span>
                <span className="text-violet-300/80">{waveLabel(run.wave)}</span>
              </div>
            </div>
          </div>
        )}
      </header>

      <AnimatePresence mode="wait">
        {stage === 'intro' && (
          <motion.section
            key="intro"
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="mt-6"
          >
            <div className="overflow-hidden rounded-2xl border border-violet-400/30 bg-black/55 p-5 sm:p-8">
              <div className="flex flex-col items-center gap-6 sm:flex-row sm:items-start">
                <motion.div
                  animate={{
                    scale: [1, 1.04, 1],
                    filter: ['brightness(1)', 'brightness(1.15)', 'brightness(1)'],
                  }}
                  transition={{ duration: 2.8, repeat: Infinity }}
                >
                  <HeroArt hero={NULL_OVERLORD} size={180} animated />
                </motion.div>
                <div className="flex-1 text-center sm:text-left">
                  <h2 className="font-display text-xl tracking-widest text-violet-200 sm:text-2xl">
                    VILLAIN MODE
                  </h2>
                  <p className="mt-3 text-slate-300">
                    Three waves stand between your champion and the Null Overlord. Answer to charge your
                    hero; miss and the void pushes back — then try again.
                  </p>
                  <ol className="mt-5 space-y-2 text-left text-sm text-slate-400">
                    <li className="flex gap-2">
                      <ShieldAlert size={16} className="mt-0.5 shrink-0 text-violet-300" />
                      <span>
                        <strong className="text-violet-100">Expand the Curse</strong> — fix a wrong
                        expanded form to crack the shield, then fight a minion.
                      </span>
                    </li>
                    <li className="flex gap-2">
                      <Zap size={16} className="mt-0.5 shrink-0 text-amber-300" />
                      <span>
                        <strong className="text-amber-100">Square / Cube Trap</strong> — solve n² or n³
                        (bases ~2–12) to charge up and clash again.
                      </span>
                    </li>
                    <li className="flex gap-2">
                      <Crown size={16} className="mt-0.5 shrink-0 text-sky-300" />
                      <span>
                        <strong className="text-sky-100">Stronger / Weaker Duel</strong> — compare two
                        heroes (never equals), then the final boss fight.
                      </span>
                    </li>
                  </ol>
                  <button type="button" className="btn-primary mt-6" onClick={beginPick}>
                    ENTER THE VOID
                  </button>
                </div>
              </div>
            </div>
          </motion.section>
        )}

        {stage === 'pick' && (
          <motion.section
            key="pick"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="mt-6"
          >
            <div className="rounded-2xl border border-violet-400/20 bg-black/45 p-4 sm:p-6">
              <h2 className="font-display text-lg tracking-widest text-sky-200">CHOOSE YOUR CHAMPION</h2>
              <p className="mt-1 text-sm text-slate-400">
                Correct answers fuel their next strike against Null Overlord&apos;s minions.
              </p>
              <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
                {pickPool.map((hero) => (
                  <button
                    key={hero.id}
                    type="button"
                    onClick={() => startWith(hero)}
                    className="group rounded-xl border border-white/10 bg-slate-950/60 p-3 text-center transition hover:border-violet-300/50 hover:bg-violet-500/10"
                  >
                    <HeroArt hero={hero} size={96} animated className="mx-auto" />
                    <div className="mt-2 font-display text-xs tracking-wide text-slate-200 group-hover:text-violet-100">
                      {hero.name}
                    </div>
                    <div className="mt-1 text-sky-100">
                      <MathExpression base={hero.base} exponent={hero.exponent} size="lg" />
                    </div>
                  </button>
                ))}
              </div>
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
            <div className="overflow-hidden rounded-2xl border border-violet-400/25 bg-slate-950/75">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/10 px-4 py-3 sm:px-6">
                <span className="text-[11px] uppercase tracking-[0.28em] text-violet-300/90">
                  {waveLabel(question.wave)} · {question.title}
                </span>
                <span className="text-[11px] tracking-wide text-slate-500">{question.hint}</span>
              </div>

              <div className="grid gap-4 p-4 sm:grid-cols-[1fr_1.15fr] sm:p-6">
                <div className="flex flex-col items-center justify-center rounded-xl border border-violet-500/15 bg-black/40 p-4">
                  {question.kind === 'strongerWeaker' && question.displayA && question.displayB ? (
                    <div className="flex w-full items-end justify-around gap-2">
                      <DuelHero hero={question.displayA} tone="sky" />
                      <motion.div
                        className="shrink-0 pb-8 font-display text-2xl text-violet-300"
                        animate={{ scale: [1, 1.12, 1] }}
                        transition={{ duration: 1.2, repeat: Infinity }}
                      >
                        VS
                      </motion.div>
                      <DuelHero hero={question.displayB} tone="rose" />
                    </div>
                  ) : question.kind === 'expand' ? (
                    <div className="text-center">
                      <HeroArt hero={NULL_OVERLORD} size={120} animated />
                      <p className="mt-2 font-display text-sm tracking-wide text-violet-200">
                        Curse shield
                      </p>
                      {question.curseDisplay && (
                        <p className="mt-3 font-mono text-lg text-rose-200/90 sm:text-xl">
                          {question.curseDisplay}
                        </p>
                      )}
                    </div>
                  ) : (
                    <div className="text-center">
                      {champion && <HeroArt hero={champion} size={130} animated />}
                      <p className="mt-2 font-display text-sm text-amber-200">Charge up!</p>
                      <p className="mt-3 font-mono text-3xl text-amber-100 sm:text-4xl">
                        {question.prompt.match(/[0-9]+[⁰¹²³⁴⁵⁶⁷⁸⁹]+/)?.[0] ?? 'n²'}
                      </p>
                    </div>
                  )}
                </div>

                <div>
                  <h2 className="font-display text-xl tracking-wide text-white sm:text-2xl">
                    {question.prompt}
                  </h2>
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
                              ? 'border-violet-300/70 bg-violet-500/25 text-violet-50'
                              : 'border-white/10 bg-black/40 text-slate-100 hover:border-violet-400/50 hover:bg-violet-500/10'
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

        {stage === 'setback' && question && outcome && (
          <motion.section
            key={`setback-${question.id}`}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-6 space-y-4"
          >
            <div className="rounded-xl border border-rose-400/40 bg-rose-500/10 px-4 py-3">
              <div className="flex items-center gap-2 text-sm sm:text-base">
                <Skull size={16} className="text-rose-300" />
                <span className="text-rose-100">
                  Null Drain! The overlord pulls your power toward zero — learning setback, not game over.
                </span>
              </div>
            </div>
            <div className="flex justify-center">
              <motion.div
                animate={{ scale: [1, 1.08, 1], opacity: [0.7, 1, 0.7] }}
                transition={{ duration: 1.4, repeat: Infinity }}
              >
                <HeroArt hero={NULL_OVERLORD} size={160} animated />
              </motion.div>
            </div>
            <div className="rounded-2xl border border-violet-400/25 bg-black/55 p-4 sm:p-5">
              <p className="text-[11px] uppercase tracking-[0.3em] text-slate-500">Math truth</p>
              <p className="mt-2 font-mono text-lg text-sky-100 sm:text-xl">{question.teach}</p>
              <div className="mt-4 flex flex-wrap gap-3">
                <button type="button" className="btn-primary text-xs" onClick={retryWave}>
                  TRY AGAIN
                </button>
                <Link to="/" className="btn-secondary text-xs">
                  HOME
                </Link>
              </div>
            </div>
          </motion.section>
        )}

        {stage === 'fight' && question && outcome && (
          <motion.section
            key={`fight-${question.id}`}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-6 space-y-4"
          >
            <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-emerald-400/40 bg-emerald-500/10 px-4 py-3">
              <div className="flex items-center gap-2 text-sm sm:text-base">
                <Sparkles size={16} className="text-emerald-300" />
                <span className="text-emerald-200">
                  {question.wave === 3
                    ? 'Shield broken — final clash with Null Overlord!'
                    : 'Correct — your answer charges the next attack.'}
                </span>
              </div>
              <span className="text-[11px] uppercase tracking-[0.25em] text-slate-400">
                {question.wave === 3 ? 'Boss fight' : `Minion · Wave ${question.wave}`}
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

            <div className="rounded-2xl border border-sky-400/25 bg-black/55 p-4 sm:p-5">
              <p className="text-[11px] uppercase tracking-[0.3em] text-slate-500">Math truth</p>
              <p className="mt-2 font-mono text-lg text-sky-100 sm:text-xl">{question.teach}</p>
              {run && (
                <p className="mt-3 text-sm text-slate-400">
                  Score <span className="text-amber-300">{run.score}</span> · Streak{' '}
                  <span className="text-orange-300">{run.streak}</span> · {villainGradeLabel(run)}
                </p>
              )}
            </div>
          </motion.section>
        )}

        {stage === 'cleared' && question && run && (
          <motion.section
            key={`cleared-${question.id}`}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-6"
          >
            <div className="rounded-2xl border border-emerald-400/30 bg-black/55 p-5 text-center sm:p-6">
              <p className="text-[11px] uppercase tracking-[0.3em] text-emerald-400/80">Wave cleared</p>
              <p className="mt-2 font-mono text-lg text-sky-100">{question.teach}</p>
              <p className="mt-3 text-sm text-slate-400">
                Score <span className="text-amber-300">{run.score}</span> · Next up:{' '}
                {waveLabel(run.wave)}
              </p>
              <button type="button" className="btn-primary mt-5 text-xs" onClick={advanceWave}>
                NEXT WAVE
              </button>
            </div>
          </motion.section>
        )}

        {stage === 'victory' && run && champion && (
          <motion.section
            key="victory"
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            className="mt-6"
          >
            <div className="rounded-2xl border border-amber-400/40 bg-black/60 p-6 text-center sm:p-8">
              <p className="text-[11px] uppercase tracking-[0.4em] text-amber-400/80">Gauntlet clear</p>
              <h2 className="mt-2 font-display text-2xl tracking-widest text-amber-200 sm:text-3xl">
                NULL OVERLORD DEFEATED
              </h2>
              <div className="mt-6 flex flex-wrap items-end justify-center gap-8">
                <div>
                  <HeroArt hero={champion} size={140} animated />
                  <p className="mt-2 font-display text-sky-200">{champion.name}</p>
                  <MathExpression
                    base={champion.base}
                    exponent={champion.exponent}
                    size="lg"
                    className="text-sky-100"
                  />
                </div>
                <span className="font-display text-3xl text-violet-300">VS</span>
                <div className="opacity-50 grayscale">
                  <HeroArt hero={NULL_OVERLORD} size={140} />
                  <p className="mt-2 font-display text-violet-200">{NULL_OVERLORD.name}</p>
                </div>
              </div>
              <p className="mx-auto mt-6 max-w-md text-slate-300">
                The void retreats. Powers climb away from zero. Score{' '}
                <span className="text-amber-300">{run.score}</span> · Best streak{' '}
                <span className="text-orange-300">{run.bestStreak}</span> · {villainGradeLabel(run)}
              </p>
              <div className="mt-6 flex flex-wrap justify-center gap-3">
                <button type="button" className="btn-primary text-xs" onClick={resetGauntlet}>
                  PLAY AGAIN
                </button>
                <Link to="/question" className="btn-secondary text-xs">
                  QUESTION MODE
                </Link>
                <Link to="/" className="btn-secondary text-xs">
                  HOME
                </Link>
              </div>
            </div>
          </motion.section>
        )}
      </AnimatePresence>
    </div>
  )
}

function DuelHero({ hero, tone }: { hero: Hero; tone: 'sky' | 'rose' }) {
  const toneClass = tone === 'sky' ? 'text-sky-100' : 'text-rose-100'
  return (
    <div className="min-w-0 flex-1 text-center">
      <HeroArt hero={hero} size={110} animated />
      <p className="mt-2 text-xs font-medium text-slate-200 sm:text-sm">{hero.name}</p>
      <div className={`mt-1 drop-shadow-[0_1px_3px_rgba(0,0,0,0.95)] ${toneClass}`}>
        <MathExpression base={hero.base} exponent={hero.exponent} size="xl" />
      </div>
    </div>
  )
}
