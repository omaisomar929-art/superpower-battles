import { useMemo, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { HEROES, getHeroById } from '../heroes/data'
import { HeroCard } from '../components/HeroCard'
import { HeroArt } from '../heroes/HeroArt'
import { formatPower } from '../mathEngine'

type SortKey = 'power' | 'name' | 'base' | 'exponent'

export function Gallery() {
  const { id } = useParams()
  const detail = id ? getHeroById(id) : null

  const [query, setQuery] = useState('')
  const [sort, setSort] = useState<SortKey>('power')
  const [baseFilter, setBaseFilter] = useState<number | 'all'>('all')
  const [expFilter, setExpFilter] = useState<number | 'all'>('all')

  const filtered = useMemo(() => {
    let list = [...HEROES]
    if (query.trim()) {
      const q = query.toLowerCase()
      list = list.filter(
        (h) =>
          h.name.toLowerCase().includes(q) ||
          h.expression.includes(q) ||
          h.signatureAttack.toLowerCase().includes(q) ||
          h.fightingStyle.includes(q),
      )
    }
    if (baseFilter !== 'all') list = list.filter((h) => h.base === baseFilter)
    if (expFilter !== 'all') list = list.filter((h) => h.exponent === expFilter)

    list.sort((a, b) => {
      if (sort === 'name') return a.name.localeCompare(b.name)
      if (sort === 'base') return b.base - a.base || b.exponent - a.exponent
      if (sort === 'exponent') return b.exponent - a.exponent || b.base - a.base
      return b.power - a.power
    })
    return list
  }, [query, sort, baseFilter, expFilter])

  if (detail) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-10">
        <Link to="/gallery" className="text-sm text-sky-300 hover:underline">
          ← Back to gallery
        </Link>
        <div className="panel mt-4 grid gap-8 rounded-3xl p-6 md:grid-cols-[240px_1fr]">
          <div className="flex justify-center">
            <HeroArt hero={detail} size={220} animated />
          </div>
          <div>
            <h1 className="font-display text-3xl text-white">{detail.name}</h1>
            <p className="mt-1 font-mono text-2xl text-sky-300">
              {detail.expression} = {formatPower(detail.power)}
            </p>
            <p className="mt-3 text-slate-300">{detail.tagline}</p>
            <dl className="mt-6 grid gap-3 sm:grid-cols-2 text-sm">
              <div>
                <dt className="text-slate-500">Costume</dt>
                <dd>{detail.costume}</dd>
              </div>
              <div>
                <dt className="text-slate-500">Fighting style</dt>
                <dd className="capitalize">{detail.fightingStyle}</dd>
              </div>
              <div>
                <dt className="text-slate-500">Signature attack</dt>
                <dd>{detail.signatureAttack}</dd>
              </div>
              <div>
                <dt className="text-slate-500">Defense</dt>
                <dd>{detail.defensiveAbility}</dd>
              </div>
              <div>
                <dt className="text-slate-500">Victory</dt>
                <dd>{detail.victoryAnimation}</dd>
              </div>
              <div>
                <dt className="text-slate-500">Defeat</dt>
                <dd>{detail.defeatAnimation}</dd>
              </div>
              <div>
                <dt className="text-slate-500">Visual effect</dt>
                <dd>{detail.visualEffect}</dd>
              </div>
              <div>
                <dt className="text-slate-500">Aura</dt>
                <dd className="capitalize">{detail.visuals.aura}</dd>
              </div>
            </dl>
            <Link to={`/select?a=${detail.id}`} className="btn-primary mt-6 inline-block">
              FIGHT WITH {detail.name.toUpperCase()}
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <h1 className="font-display text-3xl tracking-widest text-fuchsia-300">50 HEROES</h1>
      <p className="mt-2 text-slate-400">Every base 1–10 and exponent 1–5. Search, sort, and inspect.</p>

      <div className="mt-6 flex flex-wrap gap-3">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search name, attack, style…"
          className="min-w-[200px] flex-1 rounded-xl border border-white/10 bg-slate-950/60 px-3 py-2 text-sm"
        />
        <select
          value={sort}
          onChange={(e) => setSort(e.target.value as SortKey)}
          className="rounded-xl border border-white/10 bg-slate-950/60 px-3 py-2 text-sm"
        >
          <option value="power">Sort: Power</option>
          <option value="name">Sort: Name</option>
          <option value="base">Sort: Base</option>
          <option value="exponent">Sort: Exponent</option>
        </select>
        <select
          value={baseFilter}
          onChange={(e) => setBaseFilter(e.target.value === 'all' ? 'all' : Number(e.target.value))}
          className="rounded-xl border border-white/10 bg-slate-950/60 px-3 py-2 text-sm"
        >
          <option value="all">All bases</option>
          {Array.from({ length: 10 }, (_, i) => i + 1).map((b) => (
            <option key={b} value={b}>
              Base {b}
            </option>
          ))}
        </select>
        <select
          value={expFilter}
          onChange={(e) => setExpFilter(e.target.value === 'all' ? 'all' : Number(e.target.value))}
          className="rounded-xl border border-white/10 bg-slate-950/60 px-3 py-2 text-sm"
        >
          <option value="all">All exponents</option>
          {[1, 2, 3, 4, 5].map((e) => (
            <option key={e} value={e}>
              Exp {e}
            </option>
          ))}
        </select>
      </div>

      <p className="mt-3 text-xs text-slate-500">{filtered.length} heroes shown</p>

      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
        {filtered.map((hero) => (
          <HeroCard key={hero.id} hero={hero} />
        ))}
      </div>
    </div>
  )
}
