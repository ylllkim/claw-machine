/**
 * 잡기 판정 순수 로직 — Three/Rapier 무의존, RNG 주입식으로 테스트 가능.
 */

export type Rng = () => number // [0, 1)

/** 그립 성공 여부. gripStrength는 0~1 확률. */
export function rollGrab(rng: Rng, gripStrength: number): boolean {
  const p = Math.min(1, Math.max(0, gripStrength))
  return rng() < p
}

/** 잡기 후보 — 인형 uid와 대표점(대략 몸통 중심) 월드 좌표 */
export type GrabCandidate = { uid: string; x: number; y: number; z: number }

/**
 * 손바닥 위치 기준 반경(radius) 내 최근접 후보의 uid. 없으면 null. (R3.1)
 * 거리는 3차원 유클리드, 경계값 포함.
 */
export function pickNearest(
  palm: readonly [number, number, number],
  candidates: readonly GrabCandidate[],
  radius: number,
): string | null {
  let bestUid: string | null = null
  let bestDist = Infinity
  for (const c of candidates) {
    const d = Math.hypot(c.x - palm[0], c.y - palm[1], c.z - palm[2])
    if (d <= radius && d < bestDist) {
      bestDist = d
      bestUid = c.uid
    }
  }
  return bestUid
}

/**
 * 성공한 그립이 운반 도중 "중간 낙하"할지, 한다면 진행률(0~1) 어느 시점인지 결정.
 * dropChance: 낙하 발생 확률 (0~1). 반환 null이면 끝까지 유지.
 */
export function rollMidDrop(rng: Rng, dropChance: number): number | null {
  const p = Math.min(1, Math.max(0, dropChance))
  if (rng() >= p) return null
  // 너무 초반/후반 낙하는 재미없음 → 진행률 0.2~0.9 구간
  return 0.2 + rng() * 0.7
}
