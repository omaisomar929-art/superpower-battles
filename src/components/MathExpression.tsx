import { formatExpression, formatPower } from '../mathEngine'

export type MathExpressionSize = 'sm' | 'md' | 'lg' | 'xl'

interface MathExpressionProps {
  base: number
  exponent: number
  power?: number
  className?: string
  showPower?: boolean
  /** Visual scale — `xl` is for Question Mode phone-readable labels. */
  size?: MathExpressionSize
}

const SIZE_CLASS: Record<MathExpressionSize, string> = {
  sm: 'text-sm',
  /** Inherit parent size — preserves Versus / Expand / Power labels. */
  md: '',
  lg: 'text-2xl sm:text-3xl font-semibold tracking-tight',
  xl: 'text-3xl sm:text-4xl font-bold tracking-tight',
}

const SUP_CLASS: Record<MathExpressionSize, string> = {
  sm: 'text-[0.65em] leading-none',
  md: 'text-[0.65em] leading-none',
  lg: 'text-[0.55em] leading-none font-bold',
  xl: 'text-[0.55em] leading-none font-bold',
}

const VALUE_CLASS: Record<MathExpressionSize, string> = {
  sm: 'font-mono tabular-nums',
  md: 'font-mono tabular-nums',
  lg: 'font-mono tabular-nums text-xl sm:text-2xl font-bold',
  xl: 'font-mono tabular-nums text-2xl sm:text-3xl font-bold',
}

/** Renders base<sup>exponent</sup> (and optional = power) in proper math notation. */
export function MathExpression({
  base,
  exponent,
  power,
  className = '',
  showPower = false,
  size = 'md',
}: MathExpressionProps) {
  const unicode = formatExpression(base, exponent)
  const stacked = size === 'lg' || size === 'xl'
  return (
    <span
      className={`inline-flex ${stacked ? 'flex-col items-center gap-0.5' : 'items-baseline'} ${SIZE_CLASS[size]} ${className}`}
      title={showPower && power !== undefined ? `${unicode} = ${formatPower(power)}` : unicode}
      aria-label={showPower && power !== undefined ? `${unicode} = ${formatPower(power)}` : unicode}
    >
      <span className="font-mono tabular-nums text-inherit">
        {base}
        <sup className={SUP_CLASS[size]}>{exponent}</sup>
      </span>
      {showPower && power !== undefined && (
        <>
          {!stacked && <span className="mx-1 opacity-70">=</span>}
          {stacked && <span className="text-[0.45em] font-semibold uppercase tracking-[0.2em] opacity-70">=</span>}
          <span className={`${VALUE_CLASS[size]} text-inherit`}>{formatPower(power)}</span>
        </>
      )}
    </span>
  )
}
