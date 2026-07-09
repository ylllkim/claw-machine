import type { RapierRigidBody } from '@react-three/rapier'

/**
 * uid → 리지드바디 레지스트리 (비반응형).
 * 잡기(Phase 3)·레이아웃 저장(Phase 5)에서 물리 바디에 직접 접근할 때 사용.
 */
const registry = new Map<string, RapierRigidBody>()

export function registerPrize(uid: string, body: RapierRigidBody) {
  registry.set(uid, body)
}

export function unregisterPrize(uid: string) {
  registry.delete(uid)
}

export function getPrizeBody(uid: string): RapierRigidBody | undefined {
  return registry.get(uid)
}

export function allPrizeBodies(): ReadonlyMap<string, RapierRigidBody> {
  return registry
}

// 개발 중 자동화/콘솔 디버깅용 (프로덕션 빌드에서는 제외됨)
if (import.meta.env.DEV) {
  ;(globalThis as Record<string, unknown>).__prizeBodies = registry
}
