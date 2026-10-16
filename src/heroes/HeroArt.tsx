import type { Hero } from './types'
import { ELEMENT_GLOW } from './data'

interface HeroArtProps {
  hero: Hero
  size?: number
  className?: string
  animated?: boolean
}

export function HeroArt({ hero, size = 160, className = '', animated = false }: HeroArtProps) {
  const { visuals, mainColor, secondaryColor, accentColor } = hero
  const glow = ELEMENT_GLOW[visuals.aura]
  const id = hero.id.replace(/[^a-zA-Z0-9]/g, '')

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 200 200"
      className={className}
      role="img"
      aria-label={`${hero.name} portrait`}
    >
      <defs>
        <radialGradient id={`aura-${id}`} cx="50%" cy="55%" r="55%">
          <stop offset="0%" stopColor={glow} stopOpacity="0.55" />
          <stop offset="70%" stopColor={secondaryColor} stopOpacity="0.15" />
          <stop offset="100%" stopColor="transparent" stopOpacity="0" />
        </radialGradient>
        <linearGradient id={`body-${id}`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor={mainColor} />
          <stop offset="100%" stopColor={secondaryColor} />
        </linearGradient>
      </defs>

      <circle cx="100" cy="100" r="88" fill={`url(#aura-${id})`} />
      {animated && (
        <circle
          cx="100"
          cy="100"
          r="78"
          fill="none"
          stroke={glow}
          strokeWidth="2"
          strokeDasharray="8 10"
          opacity="0.6"
        >
          <animateTransform
            attributeName="transform"
            type="rotate"
            from="0 100 100"
            to="360 100 100"
            dur="8s"
            repeatCount="indefinite"
          />
        </circle>
      )}

      {visuals.cape && (
        <path
          d="M70 78 Q100 170 130 78 Q100 120 70 78"
          fill={accentColor}
          opacity="0.85"
        />
      )}

      {visuals.silhouette === 'wings' && (
        <>
          <path d="M55 90 Q20 60 25 110 Q40 100 55 105 Z" fill={secondaryColor} opacity="0.8" />
          <path d="M145 90 Q180 60 175 110 Q160 100 145 105 Z" fill={secondaryColor} opacity="0.8" />
        </>
      )}

      {/* Legs */}
      <rect x="78" y="135" width="16" height="38" rx="6" fill={`url(#body-${id})`} />
      <rect x="106" y="135" width="16" height="38" rx="6" fill={`url(#body-${id})`} />

      {/* Body by silhouette */}
      {visuals.silhouette === 'mech' || visuals.silhouette === 'armor' ? (
        <rect x="68" y="78" width="64" height="62" rx="10" fill={`url(#body-${id})`} stroke={accentColor} strokeWidth="3" />
      ) : visuals.silhouette === 'robe' || visuals.silhouette === 'cloak' ? (
        <path d="M70 80 L130 80 L145 150 L55 150 Z" fill={`url(#body-${id})`} stroke={accentColor} strokeWidth="2" />
      ) : visuals.silhouette === 'beast' ? (
        <ellipse cx="100" cy="110" rx="38" ry="34" fill={`url(#body-${id})`} stroke={accentColor} strokeWidth="3" />
      ) : (
        <ellipse cx="100" cy="108" rx="30" ry="36" fill={`url(#body-${id})`} />
      )}

      {/* Head */}
      <circle cx="100" cy="58" r="24" fill={mainColor} stroke={accentColor} strokeWidth="2" />

      {visuals.horns && (
        <>
          <path d="M82 42 L74 22 L90 40 Z" fill={accentColor} />
          <path d="M118 42 L126 22 L110 40 Z" fill={accentColor} />
        </>
      )}

      {visuals.mask === 'full' && (
        <rect x="82" y="48" width="36" height="22" rx="8" fill={accentColor} opacity="0.9" />
      )}
      {visuals.mask === 'half' && (
        <rect x="82" y="52" width="36" height="12" rx="4" fill={accentColor} opacity="0.85" />
      )}
      {visuals.mask === 'visor' && (
        <rect x="84" y="54" width="32" height="8" rx="3" fill={glow} opacity="0.95" />
      )}
      {visuals.mask === 'hood' && (
        <path d="M76 58 Q100 20 124 58 L118 52 Q100 32 82 52 Z" fill={secondaryColor} />
      )}
      {visuals.mask === 'none' && (
        <>
          <circle cx="92" cy="56" r="3" fill={accentColor} />
          <circle cx="108" cy="56" r="3" fill={accentColor} />
        </>
      )}

      {/* Weapon */}
      {visuals.weapon === 'blade' && (
        <rect x="142" y="70" width="8" height="55" rx="2" fill={glow} transform="rotate(20 146 97)" />
      )}
      {visuals.weapon === 'staff' && (
        <rect x="148" y="50" width="6" height="90" rx="3" fill={accentColor} />
      )}
      {visuals.weapon === 'bow' && (
        <path d="M145 70 Q170 105 145 140" fill="none" stroke={glow} strokeWidth="4" />
      )}
      {visuals.weapon === 'spear' && (
        <>
          <rect x="150" y="55" width="5" height="95" rx="2" fill={secondaryColor} />
          <path d="M145 50 L152.5 30 L160 50 Z" fill={glow} />
        </>
      )}
      {visuals.weapon === 'shield' && (
        <path d="M48 85 L68 80 L72 120 L58 135 L44 120 Z" fill={accentColor} stroke={glow} strokeWidth="2" />
      )}
      {visuals.weapon === 'orb' && (
        <circle cx="155" cy="100" r="12" fill={glow} opacity="0.9">
          {animated && (
            <animate attributeName="r" values="10;14;10" dur="2s" repeatCount="indefinite" />
          )}
        </circle>
      )}
      {visuals.weapon === 'gauntlets' && (
        <>
          <rect x="55" y="105" width="18" height="14" rx="4" fill={accentColor} />
          <rect x="127" y="105" width="18" height="14" rx="4" fill={accentColor} />
        </>
      )}

      {/* Expression badge */}
      <rect x="60" y="178" width="80" height="16" rx="8" fill="#0b1220" opacity="0.85" />
      <text
        x="100"
        y="190"
        textAnchor="middle"
        fontSize="11"
        fontFamily="monospace"
        fill={glow}
        fontWeight="700"
      >
        {hero.expression}
      </text>
    </svg>
  )
}
