import { describe, expect, it } from 'vitest'
import { canDealDamage, resolveHitDamage } from './damageRules'

describe('versus damage rules', () => {
  it('stronger can hurt weaker', () => {
    expect(canDealDamage(25, 9)).toBe(true)
    const hit = resolveHitDamage(25, 9, '5²', '3²', 'punch')
    expect(hit.blocked).toBe(false)
    expect(hit.damage).toBeGreaterThan(0)
  })

  it('weaker cannot hurt stronger', () => {
    expect(canDealDamage(9, 25)).toBe(false)
    const hit = resolveHitDamage(9, 25, '3²', '5²', 'ability')
    expect(hit.blocked).toBe(true)
    expect(hit.damage).toBe(0)
    expect(hit.expression).toContain('BLOCKED')
  })

  it('equal powers can damage each other', () => {
    expect(canDealDamage(16, 16)).toBe(true)
    const hit = resolveHitDamage(16, 16, '2⁴', '4²', 'punch')
    expect(hit.blocked).toBe(false)
    expect(hit.damage).toBeGreaterThan(0)
    expect(hit.expression).toContain('EQUAL')
  })

  it('abilities hit harder than punches when allowed', () => {
    const punch = resolveHitDamage(100, 10, '10²', '10¹', 'punch')
    const ability = resolveHitDamage(100, 10, '10²', '10¹', 'ability')
    expect(ability.damage).toBeGreaterThan(punch.damage)
  })
})
