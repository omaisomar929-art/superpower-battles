import { useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { HEROES, getHeroById, getRandomHeroes } from '../heroes/data'
import type { Hero } from '../heroes/types'
import { HeroCard } from '../components/HeroCard'
import { canFight } from '../battleEngine'
import { formatExpression } from '../mathEngine'

const ARENAS = [
  { id: 'neon-colosseum', label: 'Neon Colosseum' },
  { id: 'void-rift', label: 'Void Rift' },
  { id: 'storm-spire', label: 'Storm Spire' },
  { id: 'ember-crater', label: 'Ember Crater' },
  { id: 'crystal-arena', label: 'Crystal Arena' },
]

export function FighterSelect() {
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const [fighterA, setFighterA] = useState<Hero | null>(() => getHeroById(params.get('a') ?? '') ?? null)
  const [fighterB, setFighterB] = useState<Hero | null>(null)
  const [picking, setPicking] = useState<'a' | 'b'>('a')
  const [mirrorMode, setMirrorMode] = useState(false)
  const [arena, setArena] = useState(ARENAS[0].id)
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
      setFighterA(hero)
      setPicking('b')
    } else {
      setFighterB(hero)
    }
  }

  function randomize() {
    const [a, b] = getRandomHeroes(2)
    setFighterA(a)
    setFighterB(b)
  }

  function startFight() {
    if (!canFight(fighterA, fighterB, mirrorMode)) return
    const qs = new URLSearchParams({
      a: fighterA!.id,
      b: fighterB!.id,
      arena,
      mirror: mirrorMode ? '1' : '0',
    })
    navigate(`/arena?${qs.toString()}`)
  }

  const ready = canFight(fighterA, fighterB, mirrorMode)

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <h1 className="font-display text-3xl tracking-widest text-fuchsia-300">FIGHTER SELECT</h1>
      <p className="mt-2 text-slate-400">
        Pick two heroes. Higher power wins — math never lies. Power-zero void variants (n⁰) have game power
        0.
      </p>

      <div className="mt-6 grid gap-4 md:grid-cols-[1fr_auto_1fr] items-start">
        <div className={`panel rounded-2xl p-4 ${picking === 'a' ? 'ring-2 ring-sky-400' : ''}`}>
          <div className="text-xs tracking-widest text-sky-300">FIGHTER A</div>
          {fighterA ? <HeroCard hero={fighterA} compact /> : <p className="py-10 text-center text-slate-500">Select fighter A</p>}
          <button type="button" className="btn-secondary mt-2 w-full text-xs" onClick={() => setPicking('a')}>
            Choose A
          </button>
        </div>

        <div className="flex flex-col items-center gap-3 py-4">
          <div className="font-display text-4xl text-rose-400 glow-text">VS</div>
          <button type="button" className="btn-secondary text-xs" onClick={randomize}>
            RANDOMIZE
          </button>
          <label className="flex items-center gap-2 text-xs text-slate-400">
            <input type="checkbox" checked={mirrorMode} onChange={(e) => setMirrorMode(e.target.checked)} />
            Mirror mode
          </label>
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
          <button type="button" className="btn-primary text-xs disabled:opacity-40" disabled={!ready} onClick={startFight}>
            ENTER ARENA
          </button>
        </div>

        <div className={`panel rounded-2xl p-4 ${picking === 'b' ? 'ring-2 ring-rose-400' : ''}`}>
          <div className="text-xs tracking-widest text-rose-300">FIGHTER B</div>
          {fighterB ? <HeroCard hero={fighterB} compact /> : <p className="py-10 text-center text-slate-500">Select fighter B</p>}
          <button type="button" className="btn-secondary mt-2 w-full text-xs" onClick={() => setPicking('b')}>
            Choose B
          </button>
        </div>
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
      <p className="mt-2 text-xs text-slate-500">{list.length} heroes shown</p>

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
