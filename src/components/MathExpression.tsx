import { formatExpression, formatPower } from '../mathEngine'

interface MathExpressionProps {
  base: number
  exponent: number
  power?: number
  className?: string
  showPower?: boolean
}

/** Renders base<sup>exponent</sup> (and optional = power) in proper math notation. */
export function MathExpression({
  base,
  exponent,
  power,
  className = '',
  showPower = false,
}: MathExpressionProps) {
  const unicode = formatExpression(base, exponent)
  return (
    <span className={className} title={unicode} aria-label={unicode}>
      <span className="font-mono tabular-nums">
        {base}
        <sup className="text-[0.65em] leading-none">{exponent}</sup>
      </span>
      {showPower && power !== undefined && (
        <>
          <span className="mx-1 opacity-60">=</span>
          <span className="font-mono tabular-nums">{formatPower(power)}</span>
        </>
      )}
    </span>
  )
}
