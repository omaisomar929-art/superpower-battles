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

function assertHeroPair(base: number, exponent: number): void {
  if (!Number.isInteger(base) || !Number.isInteger(exponent)) {
    throw new Error('Base and exponent must be integers')
  }
  if (base < 0 || base > 10) {
    throw new Error('Base must be between 0 and 10')
  }
  if (exponent < 0 || exponent > 5) {
    throw new Error('Exponent must be between 0 and 5')
  }
}

/**
 * Game power for a base^exponent pair.
 * Exponent 0 is a **null-power void** override: always returns 0,
 * even though mathematics says n⁰ = 1 for n ≠ 0 (and 0⁰ is undefined).
 * Used by Versus / Learning arena combat — do not use for quiz math.
 */
export function calculatePower(base: number, exponent: number): number {
  assertHeroPair(base, exponent)
  // Power-zero void fighters: n⁰ → game power 0 (not mathematical 1)
  if (exponent === 0) return 0
  return base ** exponent
}

/**
 * True mathematical value of base^exponent.
 * Convention: n⁰ = 1 for every n in the roster (including 0⁰ → 1), matching JS `**`.
 * Question Mode comparisons use this — not the void game override.
 */
export function calculateTruePower(base: number, exponent: number): number {
  assertHeroPair(base, exponent)
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

/** Same as explainComparison but with true mathematical powers (for Question Mode). */
export function explainTrueComparison(
  leftBase: number,
  leftExponent: number,
  rightBase: number,
  rightExponent: number,
): string {
  const left = calculateTruePower(leftBase, leftExponent)
  const right = calculateTruePower(rightBase, rightExponent)
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

/**
 * Place-value expanded form with Unicode superscripts.
 * Convention (shown in Expand Mode UI):
 * - 0 → `0` (no place-value terms)
 * - Skip zero digits (100 → `1×10²`, not `1×10² + 0×10¹ + 0×10⁰`)
 * - Single-digit non-zero → always `d×10⁰` (e.g. 7 → `7×10⁰`) so learners see the ones place
 */
export function toExpandedForm(value: number): string {
  if (!Number.isInteger(value) || value < 0) {
    throw new Error('Expanded form expects a non-negative integer')
  }
  if (value === 0) return '0'

  const digits = String(value)
  const terms: string[] = []
  for (let i = 0; i < digits.length; i += 1) {
    const digit = Number(digits[i])
    if (digit === 0) continue
    const place = digits.length - 1 - i
    terms.push(`${digit}×10${toSuperscript(place)}`)
  }
  return terms.join(' + ')
}

/** Full equation, e.g. `540 = 5×10² + 4×10¹`. */
export function formatExpandedEquation(value: number): string {
  return `${value} = ${toExpandedForm(value)}`
}
