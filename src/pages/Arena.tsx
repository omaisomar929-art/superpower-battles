import { useMemo } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { getHeroById, getRandomHeroes } from '../heroes/data'
import { resolveBattle } from '../battleEngine'
import { FightSequence } from '../animations/FightSequence'

export function Arena() {
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const fighterA = getHeroById(params.get('a') ?? '')
  const fighterB = getHeroById(params.get('b') ?? '')
  const arena = params.get('arena') ?? 'neon-colosseum'

  const result = useMemo(() => {
    if (!fighterA || !fighterB) return null
    return resolveBattle(fighterA, fighterB)
  }, [fighterA, fighterB])

  if (!fighterA || !fighterB || !result) {
    return (
      <div className="mx-auto max-w-xl px-4 py-20 text-center">
        <p className="text-slate-300">Select two fighters in Learning Mode to enter the arena.</p>
        <Link to="/select" className="btn-primary mt-6 inline-block">
          LEARNING MODE
        </Link>
      </div>
    )
  }

  function rematch() {
    const [a, b] = getRandomHeroes(2)
    navigate(`/arena?a=${a.id}&b=${b.id}&arena=${arena}`)
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <h1 className="font-display text-3xl tracking-widest text-sky-300">LEARNING MODE · ARENA</h1>
      <p className="mt-2 text-slate-400">
        Animated fight sequence. HP bars are presentation only — the math decides the winner.
      </p>

      <div className="mt-6">
        <FightSequence fighterA={fighterA} fighterB={fighterB} result={result} arena={arena} />
      </div>

      <div className="mt-6 flex flex-wrap gap-3">
        <Link to="/select" className="btn-primary text-xs">
          BACK TO LEARNING MODE
        </Link>
        <button type="button" className="btn-secondary text-xs" onClick={rematch}>
          RANDOM REMATCH
        </button>
      </div>
    </div>
  )
}
