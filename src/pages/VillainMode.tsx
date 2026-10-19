import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { Crown, Flame, ShieldAlert, Skull, Sparkles, Trophy, Zap } from 'lucide-react'
import { HeroArt } from '../heroes/HeroArt'
import type { Hero } from '../heroes/types'
import { MathExpression } from '../components/MathExpression'
import { FightSequence } from '../animations/FightSequence'
import { EvilVictoryDance } from '../animations/EvilVictoryDance'
import { VictoryDance } from '../animations/VictoryDance'
import { playEvilVictoryStinger, playFightCue, playVictoryStinger } from '../audio/soundEngine'
import {
  VILLAINS,
  ensureChampionCanClash,
  pickChampionPool,
  type VillainProfile,
} from '../villainMode/cast'
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

type Stage = 'select' | 'pick' | 'quiz' | 'fight' | 'cleared' | 'setback' | 'victory'

const ARENAS = ['void-rift', 'neon-colosseum', 'storm-spire', 'crystal-arena', 'ember-crater'] as const

export function VillainMode() {
  const [stage, setStage] = useState<Stage>('select')
  const [villain, setVillain] = useState<VillainProfile | null>(null)
  const [champion, setChampion] = useState<Hero | null>(null)
  const [run, setRun] = useState<VillainRunState | null>(null)
  const [question, setQuestion] = useState<VillainQuestion | null>(null)
  const [outcome, setOutcome] = useState<VillainRoundOutcome | null>(null)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [locked, setLocked] = useState(false)
  const [pickPool] = useState(() => pickChampionPool(8))

  const activeVillain = villain ?? run?.villain ?? null

  const arena = useMemo(
    () => ARENAS[((run?.wave ?? 1) - 1) % ARENAS.length]!,
    [run?.wave],
  )

  function chooseVillain(profile: VillainProfile) {
    setVillain(profile)
    setStage('pick')
    playFightCue('intro')
  }

  function startWith(hero: Hero) {
    if (!villain) return
    const champ = ensureChampionCanClash(hero, villain.hero)
    const nextRun = createVillainRun(champ, villain)
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
      window.setTimeout(() => {
        setStage('setback')
        playEvilVictoryStinger(state.villain.hero)
      }, 650)
    }
  }

  function onFightComplete() {
    if (!run) return
    if (run.complete && run.victory) {
      setStage('victory')
      if (champion) playVictoryStinger(champion)
      else playFightCue('reveal')
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
    setStage('select')
    setVillain(null)
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

  const themeGlow = activeVillain?.theme.glow ?? 'rgba(139,92,246,0.22)'

  return (
    <div className="relative mx-auto max-w-5xl overflow-hidden px-3 py-4 sm:px-4 sm:py-8">
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div
          className="absolute inset-0"
          style={{
            background: `radial-gradient(ellipse at 50% 0%, ${themeGlow}, transparent 55%)`,
          }}
        />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_80%_80%,rgba(49,46,129,0.35),transparent_50%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_20%_70%,rgba(2,6,23,0.9),transparent_45%)]" />
        <motion.div
          className="absolute inset-x-0 top-28 h-px bg-gradient-to-r from-transparent via-violet-400/40 to-transparent"
          animate={{ opacity: [0.2, 0.7, 0.2] }}
          transition={{ duration: 3.4, repeat: Infinity }}
        />
        {activeVillain && stage !== 'select' && (
          <motion.div
            className="absolute right-4 top-20 opacity-30 sm:right-10"
            animate={{ y: [0, -10, 0], rotate: [0, 3, 0] }}
            transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
          >
            <HeroArt hero={activeVillain.hero} size={140} animated />
          </motion.div>
        )}
      </div>

      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="inline-flex items-center gap-1.5 text-[11px] uppercase tracking-[0.4em] text-violet-300/90">
            <Skull size={12} /> Grade 6 gauntlet
          </p>
          <h1 className="font-display text-2xl tracking-widest text-violet-100 sm:text-4xl">
            {activeVillain && stage !== 'select' ? activeVillain.hero.name.toUpperCase() : 'VILLAIN MODE'}
          </h1>
          <p className="mt-2 max-w-xl text-sm text-slate-400 sm:text-base">
            {activeVillain && stage !== 'select'
              ? activeVillain.hero.tagline
              : 'Choose your foe by difficulty. Break the curse, charge squares and cubes, compare powers — then the boss. Kid-friendly, cinematic, true math (n⁰ = 1).'}
          </p>
        </div>
        {run && champion && activeVillain && (
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
                <span className={`rounded px-1.5 py-0.5 ${activeVillain.theme.badge}`}>
                  {activeVillain.difficultyLabel}
                </span>
                <span className="text-violet-300/80">{waveLabel(run.wave)}</span>
              </div>
            </div>
          </div>
        )}
      </header>

      <AnimatePresence mode="wait">
        {stage === 'select' && (
          <motion.section
            key="select"
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="mt-6"
          >
            <div className="overflow-hidden rounded-2xl border border-violet-400/30 bg-black/55 p-5 sm:p-8">
              <div className="text-center sm:text-left">
                <h2 className="font-display text-xl tracking-widest text-violet-200 sm:text-2xl">
                  CHOOSE YOUR VILLAIN
                </h2>
                <p className="mt-2 max-w-2xl text-slate-300">
                  Four foes. Four difficulties. Same three waves — expand → square/cube → stronger/weaker
                  boss fight — tuned harder as you climb.
                </p>
              </div>

              <div className="mt-6 grid gap-3 sm:grid-cols-2">
                {VILLAINS.map((profile, index) => (
                  <motion.button
                    key={profile.id}
                    type="button"
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.06 }}
                    onClick={() => chooseVillain(profile)}
                    className={`group relative overflow-hidden rounded-2xl border ${profile.theme.border} bg-gradient-to-br ${profile.theme.panel} p-4 text-left transition hover:brightness-110 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-300`}
                  >
                    <div
                      className="pointer-events-none absolute -right-6 -top-6 h-28 w-28 rounded-full blur-2xl"
                      style={{ background: profile.theme.glow }}
                    />
                    <div className="relative flex gap-4">
                      <motion.div
                        animate={{ y: [0, -6, 0] }}
                        transition={{ duration: 3.2 + index * 0.3, repeat: Infinity, ease: 'easeInOut' }}
                      >
                        <HeroArt hero={profile.hero} size={108} animated />
                      </motion.div>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span
                            className={`rounded-md px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.2em] ${profile.theme.badge}`}
                          >
                            {profile.difficultyLabel}
                          </span>
                          <span className="text-[10px] uppercase tracking-[0.2em] text-slate-500">
                            Tier {index + 1}
                          </span>
                        </div>
                        <h3
                          className="mt-2 font-display text-lg tracking-wide sm:text-xl"
                          style={{ color: profile.hero.mainColor }}
                        >
                          {profile.hero.name}
                        </h3>
                        <p className="mt-1 text-xs text-slate-400 sm:text-sm">{profile.blurb}</p>
                        <p className="mt-3 text-[11px] uppercase tracking-[0.22em] text-slate-500 group-hover:text-slate-300">
                          Challenge →
                        </p>
                      </div>
                    </div>
                  </motion.button>
                ))}
              </div>

              <ol className="mt-8 space-y-2 text-left text-sm text-slate-400">
                <li className="flex gap-2">
                  <ShieldAlert size={16} className="mt-0.5 shrink-0 text-violet-300" />
                  <span>
                    <strong className="text-violet-100">Expand the Curse</strong> — fix a wrong expanded
                    form, then fight a minion.
                  </span>
                </li>
                <li className="flex gap-2">
                  <Zap size={16} className="mt-0.5 shrink-0 text-amber-300" />
                  <span>
                    <strong className="text-amber-100">Square / Cube Trap</strong> — solve n² or n³ to
                    charge up.
                  </span>
                </li>
                <li className="flex gap-2">
                  <Crown size={16} className="mt-0.5 shrink-0 text-sky-300" />
                  <span>
                    <strong className="text-sky-100">Stronger / Weaker Duel</strong> — compare two heroes,
                    then the boss fight.
                  </span>
                </li>
              </ol>
            </div>
          </motion.section>
        )}

        {stage === 'pick' && villain && (
          <motion.section
            key="pick"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="mt-6"
          >
            <div className={`rounded-2xl border ${villain.theme.border} bg-black/45 p-4 sm:p-6`}>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="font-display text-lg tracking-widest text-sky-200">CHOOSE YOUR CHAMPION</h2>
                  <p className="mt-1 text-sm text-slate-400">
                    Correct answers fuel strikes against {villain.hero.name} (
                    {villain.difficultyLabel}).
                  </p>
                </div>
                <button type="button" className="btn-secondary text-xs" onClick={() => setStage('select')}>
                  CHANGE VILLAIN
                </button>
              </div>
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

        {stage === 'quiz' && question && activeVillain && (
          <motion.section
            key={question.id}
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.98 }}
            className="mt-6"
          >
            <div className={`overflow-hidden rounded-2xl border ${activeVillain.theme.border} bg-slate-950/75`}>
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
                      <HeroArt hero={activeVillain.hero} size={120} animated />
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

        {stage === 'setback' && question && outcome && activeVillain && (
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
                  {activeVillain.hero.name} wins this round! Evil victory dance — learning setback, not
                  game over.
                </span>
              </div>
            </div>
            <div className="flex justify-center py-2">
              <EvilVictoryDance
                villain={activeVillain.hero}
                style={activeVillain.evilDanceStyle}
                size={170}
              />
            </div>
            <div className={`rounded-2xl border ${activeVillain.theme.border} bg-black/55 p-4 sm:p-5`}>
              <p className="text-[11px] uppercase tracking-[0.3em] text-slate-500">Math truth</p>
              <p className="mt-2 font-mono text-lg text-sky-100 sm:text-xl">{question.teach}</p>
              <div className="mt-4 flex flex-wrap gap-3">
                <button type="button" className="btn-primary text-xs" onClick={retryWave}>
                  TRY AGAIN
                </button>
                <button type="button" className="btn-secondary text-xs" onClick={resetGauntlet}>
                  PICK NEW VILLAIN
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
                    ? `Shield broken — final clash with ${activeVillain?.hero.name ?? 'the villain'}!`
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

        {stage === 'victory' && run && champion && activeVillain && (
          <motion.section
            key="victory"
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            className="mt-6"
          >
            <div className="rounded-2xl border border-amber-400/40 bg-black/60 p-6 text-center sm:p-8">
              <p className="text-[11px] uppercase tracking-[0.4em] text-amber-400/80">Gauntlet clear</p>
              <h2 className="mt-2 font-display text-2xl tracking-widest text-amber-200 sm:text-3xl">
                {activeVillain.hero.name.toUpperCase()} DEFEATED
              </h2>
              <div className="mt-6 flex flex-wrap items-end justify-center gap-8">
                <VictoryDance hero={champion} size={140} />
                <span className="font-display text-3xl text-violet-300">VS</span>
                <div className="opacity-50 grayscale">
                  <HeroArt hero={activeVillain.hero} size={140} />
                  <p className="mt-2 font-display text-violet-200">{activeVillain.hero.name}</p>
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
