import { describe, it, expect } from 'vitest'
import { randomInstances, clampSpawnXZ, serializeLayout, parseLayout, type LayoutEntry } from './layout'
import { CATALOG, getType } from '../catalog'

/** 결정적 시드 RNG (테스트 전용) */
function mulberry32(seed: number): () => number {
  let a = seed
  return () => {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

const isInChute = (x: number, z: number) => x < -0.7 && z > 0.2

describe('randomInstances', () => {
  it('동일 시드는 동일 결과를 생성한다 (uid 제외 결정성)', () => {
    const a = randomInstances(mulberry32(42), 10)
    const b = randomInstances(mulberry32(42), 10)
    expect(a).toEqual(b)
  })

  it('요청한 개수만큼 생성한다', () => {
    expect(randomInstances(mulberry32(1), 15)).toHaveLength(15)
  })

  it('모든 위치는 배출구 구역을 피한다', () => {
    const instances = randomInstances(mulberry32(7), 50)
    for (const inst of instances) {
      const [x, , z] = inst.pos
      expect(isInChute(x, z)).toBe(false)
    }
  })

  it('typeId는 항상 카탈로그에 존재한다', () => {
    const ids = new Set(CATALOG.map((t) => t.id))
    const instances = randomInstances(mulberry32(3), 20)
    for (const inst of instances) expect(ids.has(inst.typeId)).toBe(true)
  })

  it('colorIndex는 해당 타입의 palette 범위 안이다', () => {
    const instances = randomInstances(mulberry32(9), 20)
    for (const inst of instances) {
      const palette = getType(inst.typeId).palette
      expect(inst.colorIndex).toBeGreaterThanOrEqual(0)
      expect(inst.colorIndex).toBeLessThan(palette.length)
    }
  })
})

describe('clampSpawnXZ (R5.2)', () => {
  it('범위를 벗어난 좌표를 스폰 경계로 클램프한다', () => {
    const result = clampSpawnXZ(100, -100)
    expect(result).not.toBeNull()
    const [x, z] = result!
    expect(x).toBeLessThanOrEqual(1.3)
    expect(z).toBeGreaterThanOrEqual(-0.85)
  })

  it('배출구 구역이면 null을 반환한다', () => {
    expect(clampSpawnXZ(-1.0, 0.5)).toBeNull()
  })

  it('안전한 좌표는 그대로(클램프 후) 반환한다', () => {
    expect(clampSpawnXZ(0, 0)).toEqual([0, 0])
  })
})

describe('serializeLayout / parseLayout (R5.5)', () => {
  const sample: LayoutEntry[] = [
    { typeId: 'bear', colorIndex: 0, pos: [0.1, 0.2, 0.3], quat: [0, 0, 0, 1] },
    { typeId: 'penguin', colorIndex: 2, pos: [-0.4, 0.2, 0.5], quat: [0, 0.7, 0, 0.7] },
  ]

  it('직렬화→역직렬화 라운드트립이 원본과 동일하다', () => {
    const json = serializeLayout(sample)
    expect(parseLayout(json)).toEqual(sample)
  })

  it('버전 필드를 포함한다', () => {
    const json = serializeLayout(sample)
    const data = JSON.parse(json)
    expect(typeof data.version).toBe('number')
  })

  it('버전이 다르면 null을 반환한다', () => {
    const json = JSON.stringify({ version: 999, items: sample })
    expect(parseLayout(json)).toBeNull()
  })

  it('미지의 typeId 항목은 제거하고 나머지는 유지한다', () => {
    const json = JSON.stringify({
      version: JSON.parse(serializeLayout([])).version,
      items: [...sample, { typeId: 'dragon', colorIndex: 0, pos: [0, 0, 0], quat: [0, 0, 0, 1] }],
    })
    expect(parseLayout(json)).toEqual(sample)
  })

  it('잘못된 JSON 문자열은 null을 반환한다', () => {
    expect(parseLayout('{not valid json')).toBeNull()
  })

  it('배열이 아닌 items는 null을 반환한다', () => {
    expect(parseLayout(JSON.stringify({ version: 1, items: 'nope' }))).toBeNull()
  })

  it('빈 배열도 정상적으로 라운드트립된다', () => {
    expect(parseLayout(serializeLayout([]))).toEqual([])
  })
})
