import { describe, it, expect, beforeEach } from 'vitest'
import { getDeviceId, generateRecoveryCode, parseRecoveryCode, restoreFromCode, clearDeviceId } from '../device'

const DEVICE_KEY = '51nova_device_id'

beforeEach(() => {
  localStorage.clear()
})

describe('getDeviceId', () => {
  it('generates a 32-character hex string when none exists', () => {
    const id = getDeviceId()
    expect(id).toHaveLength(32)
    expect(/^[0-9a-f]{32}$/.test(id)).toBe(true)
  })

  it('persists to localStorage', () => {
    const id = getDeviceId()
    expect(localStorage.getItem(DEVICE_KEY)).toBe(id)
  })

  it('returns the same ID on subsequent calls', () => {
    const id1 = getDeviceId()
    const id2 = getDeviceId()
    expect(id1).toBe(id2)
  })
})

describe('recovery code', () => {
  it('generateRecoveryCode produces valid code', () => {
    const id = getDeviceId()
    const code = generateRecoveryCode(id)
    expect(code.length).toBeGreaterThan(24)
  })

  it('parseRecoveryCode round-trips correctly', () => {
    const id = getDeviceId()
    const code = generateRecoveryCode(id)
    const parsed = parseRecoveryCode(code)
    expect(parsed).toBe(id)
  })

  it('parseRecoveryCode returns null for invalid code', () => {
    expect(parseRecoveryCode('')).toBeNull()
    expect(parseRecoveryCode('abc')).toBeNull()
    expect(parseRecoveryCode('a'.repeat(20))).toBeNull()
  })

  it('restoreFromCode sets localStorage', () => {
    const id = getDeviceId()
    const code = generateRecoveryCode(id)
    clearDeviceId()
    expect(restoreFromCode(code)).toBe(true)
    expect(localStorage.getItem(DEVICE_KEY)).toBe(id)
  })

  it('restoreFromCode returns false for invalid code', () => {
    expect(restoreFromCode('invalid')).toBe(false)
  })
})
