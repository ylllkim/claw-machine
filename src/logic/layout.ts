import { CATALOG, getType } from '../catalog'
import { PRIZES } from '../config'

export type PlushieInstance = {
  uid: string
  typeId: string
  colorIndex: number
  pos: readonly [number, number, number]
  quat?: readonly [number, number, number, number]
}

export type Rng = () => number

/** 배출구 구역(샤프트 상공) — 스폰/배치 금지 구역. Machine.tsx 콜라이더 배치와 별개의 관대한 마진 */
function isInChuteZone(x: number, z: number): boolean {
  return x < -0.7 && z > 0.2
}

/**
 * 임의 좌표를 스폰 가능 영역 내부로 클램프.
 * 클램프 후에도 배출구 구역이면 배치 불가로 간주해 null 반환 (R5.2).
 */
export function clampSpawnXZ(x: number, z: number): [number, number] | null {
  const { spawn } = PRIZES
  const cx = Math.min(spawn.maxX, Math.max(spawn.minX, x))
  const cz = Math.min(spawn.maxZ, Math.max(spawn.minZ, z))
  if (isInChuteZone(cx, cz)) return null
  return [cx, cz]
}

/** 저장 가능한 레이아웃 항목 — uid는 재발급되므로 포함하지 않음, quat은 필수(안착된 회전) */
export type LayoutEntry = {
  typeId: string
  colorIndex: number
  pos: readonly [number, number, number]
  quat: readonly [number, number, number, number]
}

const LAYOUT_VERSION = 1

/** 레이아웃을 JSON 문자열로 직렬화 (R5.5). */
export function serializeLayout(items: readonly LayoutEntry[]): string {
  return JSON.stringify({ version: LAYOUT_VERSION, items })
}

function isFiniteTuple(value: unknown, length: number): boolean {
  return Array.isArray(value) && value.length === length && value.every((n) => typeof n === 'number' && Number.isFinite(n))
}

/**
 * JSON 문자열을 레이아웃으로 역직렬화. 버전 불일치·잘못된 JSON·잘못된 형태는 null.
 * 미지의 typeId를 가진 항목은 조용히 제거하고 나머지는 유지한다 (R5.2/R5.5).
 */
export function parseLayout(json: string): LayoutEntry[] | null {
  let data: unknown
  try {
    data = JSON.parse(json)
  } catch {
    return null
  }
  if (typeof data !== 'object' || data === null) return null
  const { version, items } = data as { version?: unknown; items?: unknown }
  if (version !== LAYOUT_VERSION || !Array.isArray(items)) return null

  const knownIds = new Set(CATALOG.map((t) => t.id))
  const result: LayoutEntry[] = []
  for (const raw of items) {
    if (typeof raw !== 'object' || raw === null) continue
    const r = raw as Record<string, unknown>
    if (typeof r.typeId !== 'string' || !knownIds.has(r.typeId)) continue
    if (typeof r.colorIndex !== 'number') continue
    if (!isFiniteTuple(r.pos, 3) || !isFiniteTuple(r.quat, 4)) continue
    result.push({
      typeId: r.typeId,
      colorIndex: r.colorIndex,
      pos: r.pos as [number, number, number],
      quat: r.quat as [number, number, number, number],
    })
  }
  return result
}

/**
 * 결정적(rng 주입) 인형 인스턴스 생성. uid는 포함하지 않음(발급은 store 담당).
 */
export function randomInstances(rng: Rng, count: number): Omit<PlushieInstance, 'uid'>[] {
  const { spawn } = PRIZES
  const result: Omit<PlushieInstance, 'uid'>[] = []

  for (let i = 0; i < count; i++) {
    let x: number = spawn.minX
    let z: number = spawn.minZ
    for (let attempt = 0; attempt < 20; attempt++) {
      const tx = spawn.minX + rng() * (spawn.maxX - spawn.minX)
      const tz = spawn.minZ + rng() * (spawn.maxZ - spawn.minZ)
      if (!isInChuteZone(tx, tz)) {
        x = tx
        z = tz
        break
      }
    }
    const y = spawn.minY + rng() * (spawn.maxY - spawn.minY)
    const typeId = CATALOG[Math.floor(rng() * CATALOG.length) % CATALOG.length].id
    const colorIndex = Math.floor(rng() * getType(typeId).palette.length)
    result.push({ typeId, colorIndex, pos: [x, y, z] })
  }

  return result
}
