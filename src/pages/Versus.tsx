import { useMemo, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { HEROES, getHeroById, getRandomHeroes } from '../heroes/data'
import type { Hero } from '../heroes/types'
import { HeroCard } from '../components/HeroCard'
import { canFight } from '../battleEngine'
import { formatExpression } from '../mathEngine'
import { VersusArena } from '../versus/VersusArena'
import { VERSUS_RULES_COPY } from '../versus/damageRules'

const ARENAS = [
  { id: 'neon-colosseum', label: 'Neon Colosseum' },
  { id: 'void-rift', label: 'Void Rift' },
  { id: 'storm-spire', label: 'Storm Spire' },
  { id: 'ember-crater', label: 'Ember Crater' },
  { id: 'crystal-arena', label: 'Crystal Arena' },
]

export function Versus() {
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const aParam = params.get('a')
  const bParam = params.get('b')
  const arenaParam = params.get('arena') ?? ARENAS[0].id

  const paramA = getHeroById(aParam ?? '')
  const paramB = getHeroById(bParam ?? '')
  const inArena = Boolean(paramA && paramB && paramA.id !== paramB.id)

  const [fighterA, setFighterA] = useState<Hero | null>(() => paramA ?? null)
  const [fighterB, setFighterB] = useState<Hero | null>(() => paramB ?? null)
  const [picking, setPicking] = useState<'a' | 'b'>('a')
  const [arena, setArena] = useState(arenaParam)
  const [query, setQuery] = useState('')
  const [baseFilter, setBaseFilter] = useState<number | 'all'>('all')
  const [expFilter, setExpFilter] = useState<number | 'all'>('all')

  const list = useMemo(() => {
    let heroes = [...HEROES]
    if (baseFilter !== 'all') heroes = heroes.filter((h) => h.base === baseFilter)
    if (expFilter !== 'all') heroes = heroes.filter((h) => h.exponent === expFilter)
    const q = query.toLowerCase()
    if (!q) return heroes
    return heroes.filter(
      (h) =>
        h.name.toLowerCase().includes(q) ||
        h.expression.includes(q) ||
        formatExpression(h.base, h.exponent).includes(q) ||
        `${h.base}^${h.exponent}`.includes(q),
    )
  }, [query, baseFilter, expFilter])

  function selectHero(hero: Hero) {
    if (picking === 'a') {
      if (fighterB?.id === hero.id) return
      setFighterA(hero)
      setPicking('b')
    } else {
      if (fighterA?.id === hero.id) return
      setFighterB(hero)
    }
  }

  function randomize() {
    const [a, b] = getRandomHeroes(2)
    setFighterA(a)
    setFighterB(b)
  }

  function startVersus() {
    if (!canFight(fighterA, fighterB, false)) return
    const qs = new URLSearchParams({
      a: fighterA!.id,
      b: fighterB!.id,
      arena,
    })
    navigate(`/versus?${qs.toString()}`)
  }

  function exitToSelect() {
    navigate('/versus')
    setFighterA(paramA ?? fighterA)
    setFighterB(paramB ?? fighterB)
  }

  function rematch() {
    if (!paramA || !paramB) return
    navigate(`/versus?a=${paramA.id}&b=${paramB.id}&arena=${arenaParam}&r=${Date.now()}`)
  }

  if (inArena && paramA && paramB) {
    return (
      <div className="versus-play mx-auto max-w-5xl px-2 py-3 sm:px-4 sm:py-6">
        <div className="mb-3 flex flex-wrap items-end justify-between gap-3 sm:mb-4">
          <div>
            <h1 className="font-display text-2xl tracking-widest text-amber-300 sm:text-3xl">2 PLAYER</h1>
            <p className="mt-1 text-sm text-slate-400">Local versus · {VERSUS_RULES_COPY}</p>
          </div>
          <Link to="/versus" className="btn-secondary text-xs">
            CHANGE FIGHTERS
          </Link>
        </div>
        <VersusArena
          fighterA={paramA}
          fighterB={paramB}
          arena={arenaParam}
          onExit={exitToSelect}
          onRematch={rematch}
        />
      </div>
    )
  }

  const ready = canFight(fighterA, fighterB, false)

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <h1 className="font-display text-3xl tracking-widest text-amber-300">2 PLAYER</h1>
      <p className="mt-2 max-w-2xl text-slate-400">
        Player 1 (left) and Player 2 (right) each pick a different hero, then fight in a controllable arena.{' '}
        {VERSUS_RULES_COPY}
      </p>

      <div className="mt-6 grid gap-4 md:grid-cols-[1fr_auto_1fr] items-start">
        <div className={`panel rounded-2xl p-4 ${picking === 'a' ? 'ring-2 ring-sky-400' : ''}`}>
          <div className="flex items-center justify-between gap-2">
            <div className="text-xs tracking-widest text-sky-300">PLAYER 1 · LEFT</div>
            <span className="rounded bg-sky-500/20 px-2 py-0.5 text-[10px] font-semibold tracking-wider text-sky-200">
              P1
            </span>
          </div>
          {fighterA ? (
            <HeroCard hero={fighterA} compact />
          ) : (
            <p className="py-10 text-center text-slate-500">Select Player 1</p>
          )}
          <button type="button" className="btn-secondary mt-2 w-full text-xs" onClick={() => setPicking('a')}>
            Choose P1
          </button>
          <div className="mt-3 rounded-xl border border-sky-400/25 bg-sky-500/10 px-3 py-2.5">
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-sky-300">P1 controls</p>
            <p className="mt-1.5 text-xs leading-relaxed text-sky-100/90">
              <span className="font-semibold text-white">WASD</span> move ·{' '}
              <span className="font-semibold text-white">Space</span> fly ·{' '}
              <span className="font-semibold text-white">T</span> punch ·{' '}
              <span className="font-semibold text-white">Y</span> ability
            </p>
            <p className="mt-1.5 text-[10px] text-sky-200/70">Phone: left virtual pad · Punch · Ability</p>
          </div>
        </div>

        <div className="flex flex-col items-center gap-3 py-4">
          <div className="font-display text-4xl text-amber-400 glow-text">VS</div>
          <button type="button" className="btn-secondary text-xs" onClick={randomize}>
            RANDOMIZE
          </button>
          <select
            value={arena}
            onChange={(e) => setArena(e.target.value)}
            className="rounded-lg border border-white/10 bg-slate-950/60 px-2 py-1 text-xs"
          >
            {ARENAS.map((a) => (
              <option key={a.id} value={a.id}>
                {a.label}
              </option>
            ))}
          </select>
          <button type="button" className="btn-primary text-xs disabled:opacity-40" disabled={!ready} onClick={startVersus}>
            ENTER VERSUS
          </button>
          <Link to="/select" className="text-[10px] tracking-wide text-slate-500 hover:text-sky-300">
            Or Learning Mode →
          </Link>
        </div>

        <div className={`panel rounded-2xl p-4 ${picking === 'b' ? 'ring-2 ring-rose-400' : ''}`}>
          <div className="flex items-center justify-between gap-2">
            <div className="text-xs tracking-widest text-rose-300">PLAYER 2 · RIGHT</div>
            <span className="rounded bg-rose-500/20 px-2 py-0.5 text-[10px] font-semibold tracking-wider text-rose-200">
              P2
            </span>
          </div>
          {fighterB ? (
            <HeroCard hero={fighterB} compact />
          ) : (
            <p className="py-10 text-center text-slate-500">Select Player 2</p>
          )}
          <button type="button" className="btn-secondary mt-2 w-full text-xs" onClick={() => setPicking('b')}>
            Choose P2
          </button>
          <div className="mt-3 rounded-xl border border-rose-400/25 bg-rose-500/10 px-3 py-2.5">
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-rose-300">P2 controls</p>
            <p className="mt-1.5 text-xs leading-relaxed text-rose-100/90">
              <span className="font-semibold text-white">Arrows</span> move ·{' '}
              <span className="font-semibold text-white">Enter</span> punch ·{' '}
              <span className="font-semibold text-white">Shift</span> ability
            </p>
            <p className="mt-1.5 text-[10px] text-rose-200/70">Phone: right virtual pad · Punch · Ability</p>
          </div>
        </div>
      </div>

      <div className="panel mt-6 rounded-2xl border border-amber-400/20 bg-amber-500/5 px-4 py-3 sm:hidden">
        <p className="text-[10px] font-semibold uppercase tracking-[0.25em] text-amber-300">Phone / touch</p>
        <p className="mt-1.5 text-xs leading-relaxed text-slate-300">
          In the arena, each player gets an on-screen pad: <span className="text-sky-300">P1 left</span>,{' '}
          <span className="text-rose-300">P2 right</span>. Use the d-pad to move and fly; tap Punch and Ability.
          Keyboard still works on desktop.
        </p>
      </div>
      <div className="panel mt-6 hidden rounded-2xl border border-amber-400/20 bg-amber-500/5 px-4 py-3 sm:block">
        <p className="text-[10px] font-semibold uppercase tracking-[0.25em] text-amber-300">Touch / phone</p>
        <p className="mt-1.5 text-xs leading-relaxed text-slate-300">
          On phones, the arena shows dual virtual pads — P1 on the left, P2 on the right — with move/fly d-pads
          plus Punch and Ability. Desktop keeps the keyboard scheme above.
        </p>
      </div>

      <div className="mt-8 flex flex-wrap gap-3">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Filter heroes…"
          className="min-w-[180px] flex-1 rounded-xl border border-white/10 bg-slate-950/60 px-3 py-2 text-sm"
        />
        <select
          value={baseFilter}
          onChange={(e) => setBaseFilter(e.target.value === 'all' ? 'all' : Number(e.target.value))}
          className="rounded-xl border border-white/10 bg-slate-950/60 px-3 py-2 text-sm"
        >
          <option value="all">All bases</option>
          {Array.from({ length: 11 }, (_, i) => i).map((b) => (
            <option key={b} value={b}>
              Base {b}
              {b === 0 ? ' (null)' : ''}
            </option>
          ))}
        </select>
        <select
          value={expFilter}
          onChange={(e) => setExpFilter(e.target.value === 'all' ? 'all' : Number(e.target.value))}
          className="rounded-xl border border-white/10 bg-slate-950/60 px-3 py-2 text-sm"
        >
          <option value="all">All exponents</option>
          {[0, 1, 2, 3, 4, 5].map((e) => (
            <option key={e} value={e}>
              Exp {e}
              {e === 0 ? ' (void)' : ''}
            </option>
          ))}
        </select>
      </div>
      <p className="mt-2 text-xs text-slate-500">{list.length} heroes · pick two different fighters</p>

      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
        {list.map((hero) => (
          <HeroCard
            key={hero.id}
            hero={hero}
            compact
            selected={fighterA?.id === hero.id || fighterB?.id === hero.id}
            onSelect={selectHero}
          />
        ))}
      </div>
    </div>
  )
}
