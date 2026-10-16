export function calculatePower(base: number, exponent: number): number {
  if (!Number.isInteger(base) || !Number.isInteger(exponent)) {
    throw new Error('Base and exponent must be integers')
  }
  if (base < 1 || base > 10) {
    throw new Error('Base must be between 1 and 10')
  }
  if (exponent < 1 || exponent > 5) {
    throw new Error('Exponent must be between 1 and 5')
  }
  return base ** exponent
}

export function formatExpression(base: number, exponent: number): string {
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
