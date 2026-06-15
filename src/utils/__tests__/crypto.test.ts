import { describe, it, expect } from 'vitest'
import { md5, sha256 } from '../crypto'

describe('md5', () => {
  it('produces RFC 1321 compliant MD5 hash', () => {
    expect(md5('')).toBe('d41d8cd98f00b204e9800998ecf8427e')
    expect(md5('hello')).toBe('5d41402abc4b2a76b9719d911017c592')
    expect(md5('51NOVA')).toBe('c68572179a9b25a551fa555b120b89b1')
  })

  it('returns 32-character hex string', () => {
    const result = md5('test-data-123')
    expect(result).toHaveLength(32)
    expect(/^[0-9a-f]{32}$/.test(result)).toBe(true)
  })

  it('handles UTF-8 characters', () => {
    const result = md5('你好世界')
    expect(result).toHaveLength(32)
  })
})

describe('sha256', () => {
  it('produces 64-character hex string', async () => {
    const result = await sha256('test')
    expect(result).toHaveLength(64)
    expect(/^[0-9a-f]{64}$/.test(result)).toBe(true)
  })
})
