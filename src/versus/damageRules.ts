/**
 * Local multiplayer damage: math power gates whether hits hurt.
 * Rule (shown in UI): attacker power > defender → damage;
 * attacker < defender → visual hit only (0 HP);
 * equal powers → both can damage.
 */

export type HitKind = 'punch' | 'ability'

export interface DamageResult {
  damage: number
  blocked: boolean
  /** Human-readable math gate, e.g. "5²=25 > 3²=9" */
  expression: string
}

export function canDealDamage(attackerPower: number, defenderPower: number): boolean {
  return attackerPower >= defenderPower
}

export function formatPowerGate(
  attackerPower: number,
  defenderPower: number,
  attackerExpr: string,
  defenderExpr: string,
): string {
  if (attackerPower > defenderPower) {
    return `${attackerExpr}=${attackerPower} > ${defenderExpr}=${defenderPower}`
  }
  if (attackerPower < defenderPower) {
    return `${attackerExpr}=${attackerPower} < ${defenderExpr}=${defenderPower} · BLOCKED`
  }
  return `${attackerExpr}=${attackerPower} = ${defenderExpr}=${defenderPower} · EQUAL`
}

/** Punch / ability damage. Weaker never hurts stronger; equal may hurt. */
export function resolveHitDamage(
  attackerPower: number,
  defenderPower: number,
  attackerExpr: string,
  defenderExpr: string,
  kind: HitKind,
): DamageResult {
  const expression = formatPowerGate(attackerPower, defenderPower, attackerExpr, defenderExpr)
  if (!canDealDamage(attackerPower, defenderPower)) {
    return { damage: 0, blocked: true, expression }
  }

  const safeDef = Math.max(1, defenderPower)
  const ratio = Math.min(2.5, Math.max(1, attackerPower / safeDef))
  const base = kind === 'ability' ? 16 : 8
  const damage = Math.max(1, Math.round(base + ratio * (kind === 'ability' ? 6 : 3)))
  return { damage, blocked: false, expression }
}

export const VERSUS_RULES_COPY =
  'Stronger power deals damage. Weaker hits land but deal 0. Equal powers can both hurt.'

export const MATCH_SECONDS = 90
export const MAX_HP = 100
