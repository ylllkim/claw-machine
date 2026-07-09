import { RigidBody, CuboidCollider } from '@react-three/rapier'

const CABINET_PINK = '#f25c8a'
const MARQUEE_YELLOW = '#ffd166'
const FLOOR_PURPLE = '#9b7ede'
const GLASS = '#bfe3ff'
const SHAFT_DARK = '#241b3a'
const POST_SILVER = '#cfd3dc'

/**
 * 캐비닛 전체 — 단일 fixed RigidBody 안에 컨테인먼트 콜라이더(PLAN §4 표)를 그대로 배치.
 * 비주얼은 자유도가 있으나 콜라이더 치수/위치는 PLAN 표를 그대로 따른다 (재계산 금지).
 */
export default function Machine() {
  return (
    <RigidBody type="fixed" colliders={false}>
      {/* ---- 컨테인먼트 콜라이더 (PLAN §4 표) ---- */}
      <CuboidCollider args={[1.6, 0.15, 0.7]} position={[0, -0.15, -0.4]} />
      <CuboidCollider args={[1.2, 0.15, 0.4]} position={[0.4, -0.15, 0.7]} />
      <CuboidCollider args={[0.15, 1.7, 1.4]} position={[-1.75, 1.7, 0]} />
      <CuboidCollider args={[0.15, 1.7, 1.4]} position={[1.75, 1.7, 0]} />
      <CuboidCollider args={[1.9, 1.7, 0.15]} position={[0, 1.7, -1.25]} />
      <CuboidCollider args={[1.9, 1.7, 0.15]} position={[0, 1.7, 1.25]} />
      <CuboidCollider args={[0.05, 0.19, 0.4]} position={[-0.8, 0.19, 0.7]} />
      <CuboidCollider args={[0.4, 0.19, 0.05]} position={[-1.2, 0.19, 0.3]} />
      <CuboidCollider args={[0.05, 0.6, 0.4]} position={[-0.8, -0.6, 0.7]} />
      <CuboidCollider args={[0.4, 0.6, 0.05]} position={[-1.2, -0.6, 0.3]} />
      <CuboidCollider args={[0.15, 0.6, 0.4]} position={[-1.75, -0.6, 0.7]} />
      <CuboidCollider args={[0.4, 0.6, 0.15]} position={[-1.2, -0.6, 1.25]} />
      <CuboidCollider args={[0.55, 0.15, 0.55]} position={[-1.2, -1.35, 0.7]} />

      {/* ---- 비주얼 (콜라이더와 별개) ---- */}
      {/* 바닥 A/B — 콜라이더와 동일 치수 */}
      <mesh receiveShadow position={[0, -0.15, -0.4]}>
        <boxGeometry args={[3.2, 0.3, 1.4]} />
        <meshStandardMaterial color={FLOOR_PURPLE} />
      </mesh>
      <mesh receiveShadow position={[0.4, -0.15, 0.7]}>
        <boxGeometry args={[2.4, 0.3, 0.8]} />
        <meshStandardMaterial color={FLOOR_PURPLE} />
      </mesh>

      {/* 샤프트 내부 (어두운 박스) */}
      <mesh position={[-1.2, -0.7, 0.7]}>
        <boxGeometry args={[0.75, 1.3, 0.75]} />
        <meshStandardMaterial color={SHAFT_DARK} side={2} />
      </mesh>

      {/* 캐비닛 베이스 (분홍) */}
      <mesh position={[0, -0.75, 0]}>
        <boxGeometry args={[3.9, 1.5, 3.0]} />
        <meshStandardMaterial color={CABINET_PINK} />
      </mesh>

      {/* 탑 하우징 */}
      <mesh position={[0, 2.5, 0]}>
        <boxGeometry args={[3.9, 0.6, 3.0]} />
        <meshStandardMaterial color={CABINET_PINK} />
      </mesh>
      {/* 마퀴 스트립 */}
      <mesh position={[0, 2.2, 1.35]}>
        <boxGeometry args={[3.7, 0.28, 0.08]} />
        <meshStandardMaterial color={MARQUEE_YELLOW} emissive={MARQUEE_YELLOW} emissiveIntensity={0.4} />
      </mesh>

      {/* 모서리 기둥 4개 */}
      {[
        [-1.85, -1.25],
        [1.85, -1.25],
        [-1.85, 1.25],
        [1.85, 1.25],
      ].map(([x, z], i) => (
        <mesh key={i} position={[x, 1.1, z]}>
          <boxGeometry args={[0.1, 2.2, 0.1]} />
          <meshStandardMaterial color={POST_SILVER} metalness={0.4} roughness={0.4} />
        </mesh>
      ))}

      {/* 유리 4면 (투명) */}
      <mesh position={[-1.9, 1.1, 0]}>
        <boxGeometry args={[0.02, 2.2, 2.4]} />
        <meshStandardMaterial color={GLASS} transparent opacity={0.15} />
      </mesh>
      <mesh position={[1.9, 1.1, 0]}>
        <boxGeometry args={[0.02, 2.2, 2.4]} />
        <meshStandardMaterial color={GLASS} transparent opacity={0.15} />
      </mesh>
      <mesh position={[0, 1.1, -1.4]}>
        <boxGeometry args={[3.7, 2.2, 0.02]} />
        <meshStandardMaterial color={GLASS} transparent opacity={0.15} />
      </mesh>
      <mesh position={[0, 1.1, 1.4]}>
        <boxGeometry args={[3.7, 2.2, 0.02]} />
        <meshStandardMaterial color={GLASS} transparent opacity={0.15} />
      </mesh>

      {/* 배출구 테두리 강조 */}
      <mesh position={[-1.2, 0.02, 0.7]}>
        <boxGeometry args={[0.82, 0.04, 0.82]} />
        <meshStandardMaterial color={MARQUEE_YELLOW} emissive={MARQUEE_YELLOW} emissiveIntensity={0.3} />
      </mesh>
    </RigidBody>
  )
}
