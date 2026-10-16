import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { HEROES, getRandomHeroes } from '../heroes/data'
import type { Hero } from '../heroes/types'
import { createTournament, type BracketSize, type TournamentState } from '../tournament'
import { HeroArt } from '../heroes/HeroArt'
import { formatPower } from '../mathEngine'

export function TournamentPage() {
  const [size, setSize] = useState<BracketSize>(8)
  const [selected, setSelected] = useState<Hero[]>([])
  const [state, setState] = useState<TournamentState | null>(null)
  const [drawRule, setDrawRule] = useState<'replay' | 'shared'>('replay')

  const rounds = useMemo(() => {
    if (!state) return []
    const maxRound = Math.log2(state.size)
    return Array.from({ length: maxRound }, (_, i) => i + 1)
  }, [state])

  function toggle(hero: Hero) {
    setSelected((prev) => {
      if (prev.some((h) => h.id === hero.id)) return prev.filter((h) => h.id !== hero.id)
      if (prev.length >= size) return prev
      return [...prev, hero]
    })
  }

  function start(randomFill: boolean) {
    const pool = randomFill && selected.length === 0 ? getRandomHeroes(size) : selected
    setState(createTournament(pool, { size, randomFill, drawRule }))
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <h1 className="font-display text-3xl tracking-widest text-fuchsia-300">TOURNAMENT</h1>
      <p className="mt-2 text-slate-400">
        Brackets of 4 / 8 / 16 / 32. Every fight resolved by math. Draws use your chosen rule.
      </p>

      <div className="mt-6 flex flex-wrap gap-3 items-center">
        <select
          value={size}
          onChange={(e) => {
            setSize(Number(e.target.value) as BracketSize)
            setSelected([])
            setState(null)
          }}
          className="rounded-xl border border-white/10 bg-slate-950/60 px-3 py-2 text-sm"
        >
          {[4, 8, 16, 32].map((n) => (
            <option key={n} value={n}>
              Bracket {n}
            </option>
          ))}
        </select>
        <select
          value={drawRule}
          onChange={(e) => setDrawRule(e.target.value as 'replay' | 'shared')}
          className="rounded-xl border border-white/10 bg-slate-950/60 px-3 py-2 text-sm"
        >
          <option value="replay">Draws: replay / tie-break</option>
          <option value="shared">Draws: fighter A advances</option>
        </select>
        <button type="button" className="btn-primary text-xs" onClick={() => start(true)}>
          RANDOM FULL BRACKET
        </button>
        <button
          type="button"
          className="btn-secondary text-xs disabled:opacity-40"
          disabled={selected.length < 2}
          onClick={() => start(true)}
        >
          START ({selected.length}/{size})
        </button>
      </div>

      {!state && (
        <div className="mt-6 grid grid-cols-2 gap-2 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-8">
          {HEROES.map((hero) => {
            const on = selected.some((h) => h.id === hero.id)
            return (
              <button
                key={hero.id}
                type="button"
                onClick={() => toggle(hero)}
                className={`panel rounded-xl p-2 text-left ${on ? 'ring-2 ring-amber-400' : ''}`}
              >
                <HeroArt hero={hero} size={64} />
                <div className="mt-1 text-[10px] font-display truncate">{hero.name}</div>
                <div className="font-mono text-[10px] text-sky-300">{hero.expression}</div>
              </button>
            )
          })}
        </div>
      )}

      {state && (
        <div className="mt-8 space-y-8">
          {state.champion && (
            <div className="panel rounded-3xl p-6 text-center">
              <div className="text-xs tracking-widest text-amber-300">CHAMPION</div>
              <div className="mt-3 flex justify-center">
                <HeroArt hero={state.champion} size={160} animated />
              </div>
              <div className="mt-2 font-display text-2xl text-white">{state.champion.name}</div>
              <div className="font-mono text-sky-300">
                {state.champion.expression} = {formatPower(state.champion.power)}
              </div>
              <Link
                to={`/video?highlight=${state.champion.id}&tournament=1`}
                className="btn-primary mt-4 inline-block text-xs"
              >
                GENERATE HIGHLIGHTS VIDEO
              </Link>
            </div>
          )}

          {rounds.map((round) => (
            <div key={round}>
              <h2 className="font-display text-lg text-fuchsia-200 tracking-widest mb-3">
                ROUND {round}
              </h2>
              <div className="grid gap-3 md:grid-cols-2">
                {state.matches
                  .filter((m) => m.round === round)
                  .map((match) => (
                    <div key={match.id} className="panel rounded-2xl p-4">
                      {match.bye ? (
                        <p className="text-sm text-slate-400">
                          BYE → {match.winner?.name} advances
                        </p>
                      ) : (
                        <>
                          <div className="flex items-center justify-between gap-2 text-sm">
                            <span style={{ color: match.fighterA?.mainColor }}>{match.fighterA?.name}</span>
                            <span className="font-mono text-xs text-slate-400">
                              {match.fighterA?.expression} vs {match.fighterB?.expression}
                            </span>
                            <span style={{ color: match.fighterB?.mainColor }}>{match.fighterB?.name}</span>
                          </div>
                          <p className="mt-2 text-xs text-amber-200">
                            {match.result?.explanation ?? '—'} → {match.winner?.name}
                          </p>
                          {match.fighterA && match.fighterB && (
                            <Link
                              to={`/arena?a=${match.fighterA.id}&b=${match.fighterB.id}`}
                              className="mt-2 inline-block text-xs text-sky-300 hover:underline"
                            >
                              Watch fight
                            </Link>
                          )}
                        </>
                      )}
                    </div>
                  ))}
              </div>
            </div>
          ))}

          <button type="button" className="btn-secondary text-xs" onClick={() => setState(null)}>
            NEW TOURNAMENT
          </button>
        </div>
      )}
    </div>
  )
}
