import { describe, it, expect } from 'vitest'
import { pickNearest, rollGrab, rollMidDrop, type GrabCandidate } from './grab'

const always = (v: number) => () => v

describe('rollGrab (R3.2)', () => {
  it('rng < gripStrength 이면 성공', () => {
    expect(rollGrab(always(0.29), 0.3)).toBe(true)
  })
  it('rng >= gripStrength 이면 실패', () => {
    expect(rollGrab(always(0.3), 0.3)).toBe(false)
  })
  it('gripStrength=1 이면 항상 성공, 0이면 항상 실패', () => {
    expect(rollGrab(always(0.999), 1)).toBe(true)
    expect(rollGrab(always(0), 0)).toBe(false)
  })
  it('범위 밖 gripStrength는 0~1로 클램프', () => {
    expect(rollGrab(always(0.5), 2)).toBe(true)
    expect(rollGrab(always(0.5), -1)).toBe(false)
  })
})

describe('pickNearest (R3.1)', () => {
  const palm: readonly [number, number, number] = [0, 1, 0]
  const c = (uid: string, x: number, y: number, z: number): GrabCandidate => ({ uid, x, y, z })

  it('반경 내 최근접 인형의 uid를 반환', () => {
    const candidates = [c('far', 0.4, 1, 0), c('near', 0.1, 1, 0), c('mid', 0, 1.2, 0)]
    expect(pickNearest(palm, candidates, 0.45)).toBe('near')
  })
  it('전부 반경 밖이면 null', () => {
    expect(pickNearest(palm, [c('a', 2, 1, 0), c('b', 0, 3, 0)], 0.45)).toBe(null)
  })
  it('빈 배열이면 null', () => {
    expect(pickNearest(palm, [], 0.45)).toBe(null)
  })
  it('거리는 3차원으로 계산 (y축 포함)', () => {
    // xz는 가깝지만 y가 멀면 제외
    expect(pickNearest(palm, [c('below', 0, 0.2, 0)], 0.45)).toBe(null)
    expect(pickNearest(palm, [c('close', 0.2, 1.2, 0.2)], 0.45)).toBe('close')
  })
  it('정확히 반경 경계는 포함', () => {
    expect(pickNearest(palm, [c('edge', 0.45, 1, 0)], 0.45)).toBe('edge')
  })
})

describe('rollMidDrop (R3.4)', () => {
  it('낙하 미발생 시 null', () => {
    expect(rollMidDrop(always(0.9), 0.5)).toBe(null)
  })
  it('발생 시 진행률은 0.2~0.9 구간', () => {
    for (const v of [0, 0.3, 0.6, 0.99]) {
      const seq = [0, v] // 첫 호출: 발생 판정, 둘째: 시점
      let i = 0
      const rng = () => seq[Math.min(i++, seq.length - 1)]
      const t = rollMidDrop(rng, 1)
      expect(t).not.toBe(null)
      expect(t!).toBeGreaterThanOrEqual(0.2)
      expect(t!).toBeLessThanOrEqual(0.9)
    }
  })
})
