import { Link } from 'react-router-dom'
import type { Hero } from '../heroes/types'
import { HeroArt } from '../heroes/HeroArt'
import { formatPower } from '../mathEngine'
import { MathExpression } from './MathExpression'

interface HeroCardProps {
  hero: Hero
  selected?: boolean
  onSelect?: (hero: Hero) => void
  compact?: boolean
}

export function HeroCard({ hero, selected, onSelect, compact }: HeroCardProps) {
  const powerPct = Math.min(100, (Math.log10(hero.power + 1) / Math.log10(100001)) * 100)

  const content = (
    <div
      className={`panel rounded-2xl p-4 transition hover:border-sky-400/40 ${
        selected ? 'ring-2 ring-sky-400 border-sky-400/50' : ''
      } ${onSelect ? 'cursor-pointer' : ''} ${hero.power === 0 ? 'border-slate-500/40' : ''}`}
      onClick={() => onSelect?.(hero)}
      onKeyDown={(e) => {
        if (onSelect && (e.key === 'Enter' || e.key === ' ')) onSelect(hero)
      }}
      role={onSelect ? 'button' : undefined}
      tabIndex={onSelect ? 0 : undefined}
    >
      <div className="flex justify-center">
        <HeroArt hero={hero} size={compact ? 96 : 140} />
      </div>
      <h3 className="mt-2 font-display text-sm sm:text-base text-center text-white">{hero.name}</h3>
      <p className="text-center text-sky-300 text-sm">
        <MathExpression base={hero.base} exponent={hero.exponent} />
      </p>
      <p className="text-center text-amber-300 text-xs mt-1">
        POWER {formatPower(hero.power)}
        {hero.power === 0 ? ' · NULL' : ''}
      </p>
      {!compact && (
        <>
          <div className="mt-3 h-2 rounded-full bg-slate-800 overflow-hidden">
            <div
              className="h-full rounded-full"
              style={{ width: `${powerPct}%`, background: hero.secondaryColor }}
            />
          </div>
          <p className="mt-2 text-xs text-slate-400 line-clamp-2">{hero.signatureAttack}</p>
        </>
      )}
    </div>
  )

  if (onSelect) return content
  return <Link to={`/gallery/${hero.id}`}>{content}</Link>
}
