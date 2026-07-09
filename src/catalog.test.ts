import { describe, it, expect } from 'vitest'
import { CATALOG, getType } from './catalog'

const HEX_RE = /^#[0-9a-fA-F]{6}$/

describe('CATALOG (R1.2)', () => {
  it('4종 이상의 인형이 정의되어 있다', () => {
    expect(CATALOG.length).toBeGreaterThanOrEqual(4)
  })

  it('모든 id가 유일하다', () => {
    const ids = CATALOG.map((t) => t.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('모든 타입은 parts/colliders가 비어있지 않다', () => {
    for (const t of CATALOG) {
      expect(t.parts.length).toBeGreaterThan(0)
      expect(t.colliders.length).toBeGreaterThan(0)
    }
  })

  it('score와 mass는 양수다', () => {
    for (const t of CATALOG) {
      expect(t.score).toBeGreaterThan(0)
      expect(t.mass).toBeGreaterThan(0)
    }
  })

  it('palette/secondary/accent 색상은 전부 #rrggbb 형식이다', () => {
    for (const t of CATALOG) {
      expect(t.palette.length).toBeGreaterThan(0)
      for (const c of t.palette) expect(c).toMatch(HEX_RE)
      expect(t.secondary).toMatch(HEX_RE)
      expect(t.accent).toMatch(HEX_RE)
    }
  })
})

describe('getType', () => {
  it('존재하는 id는 해당 타입을 반환한다', () => {
    expect(getType('bear').id).toBe('bear')
  })

  it('알 수 없는 id는 예외를 던진다', () => {
    expect(() => getType('does-not-exist')).toThrow()
  })
})
