const SUPERSCRIPTS = ['⁰', '¹', '²', '³', '⁴', '⁵', '⁶', '⁷', '⁸', '⁹'] as const

export function toSuperscript(value: number): string {
  return String(value)
    .split('')
    .map((digit) => {
      const n = Number(digit)
      return Number.isInteger(n) ? SUPERSCRIPTS[n] : digit
    })
    .join('')
}

/**
 * Game power for a base^exponent pair.
 * Exponent 0 is a **null-power void** override: always returns 0,
 * even though mathematics says n⁰ = 1 for n ≠ 0 (and 0⁰ is undefined).
 */
export function calculatePower(base: number, exponent: number): number {
  if (!Number.isInteger(base) || !Number.isInteger(exponent)) {
    throw new Error('Base and exponent must be integers')
  }
  if (base < 0 || base > 10) {
    throw new Error('Base must be between 0 and 10')
  }
  if (exponent < 0 || exponent > 5) {
    throw new Error('Exponent must be between 0 and 5')
  }
  // Power-zero void fighters: n⁰ → game power 0 (not mathematical 1)
  if (exponent === 0) return 0
  return base ** exponent
}

/** Mathematical notation with Unicode superscripts, e.g. 2³ */
export function formatExpression(base: number, exponent: number): string {
  return `${base}${toSuperscript(exponent)}`
}

/** ASCII caret form for search / legacy, e.g. 2^3 */
export function formatExpressionAscii(base: number, exponent: number): string {
  return `${base}^${exponent}`
}

export function formatPower(power: number): string {
  return power.toLocaleString('en-US')
}

export function explainComparison(
  leftBase: number,
  leftExponent: number,
  rightBase: number,
  rightExponent: number,
): string {
  const left = calculatePower(leftBase, leftExponent)
  const right = calculatePower(rightBase, rightExponent)
  const leftExpr = formatExpression(leftBase, leftExponent)
  const rightExpr = formatExpression(rightBase, rightExponent)

  if (left > right) {
    return `${leftExpr}=${left} > ${rightExpr}=${right}`
  }
  if (right > left) {
    return `${rightExpr}=${right} > ${leftExpr}=${left}`
  }
  return `${leftExpr}=${left} = ${rightExpr}=${right}`
}

export function comparePowers(left: number, right: number): -1 | 0 | 1 {
  if (left > right) return 1
  if (left < right) return -1
  return 0
}
