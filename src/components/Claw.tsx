import { useRef } from 'react'
import type { RefObject } from 'react'
import { CatmullRomCurve3, Vector3, type Group, type Mesh } from 'three'
import { useFrame } from '@react-three/fiber'
import { RigidBody, type RapierRigidBody } from '@react-three/rapier'
import { CLAW } from '../config'

/** ClawStateMachine이 매 프레임 갱신하고 Claw가 읽는 비반응형 공유 상태 */
export type ClawVisual = { close: number; x: number; y: number; z: number }

type Props = {
  bodyRef: RefObject<RapierRigidBody | null>
  visualRef: RefObject<ClawVisual>
}

const FINGER_COUNT = 3
// 열림: 바깥쪽으로 ~35도, 닫힘: 거의 수직(살짝 안쪽) — 회전축 기준 양수=바깥쪽, 음수=안쪽(피벗 로컬 프레임)
const OPEN_ANGLE = 0.61
const CLOSED_ANGLE = -0.05
const RAIL_Y = CLAW.railY
const TROLLEY_Y = CLAW.trolleyY
const HOME: [number, number, number] = [CLAW.home[0], CLAW.home[1], CLAW.home[2]]

/**
 * 곡선형 갈고리 손가락 — 상단 연결부(피벗 원점)에서 바깥쪽으로 휘었다가
 * 끝에서 살짝 안쪽으로 말리는 형태. 피벗의 rotation-z로 전체를 강체 회전시켜 개폐한다.
 */
const FINGER_CURVE = new CatmullRomCurve3([
  new Vector3(0, 0, 0),
  new Vector3(0.072, -0.12, 0),
  new Vector3(0.12, -0.24, 0),
  new Vector3(0.096, -0.312, 0),
])

export default function Claw({ bodyRef, visualRef }: Props) {
  const fingerRefs = useRef<(Group | null)[]>([])
  const crossbarRef = useRef<Mesh>(null)
  const trolleyRef = useRef<Mesh>(null)
  const cableRef = useRef<Mesh>(null)

  useFrame(() => {
    const v = visualRef.current
    const angle = OPEN_ANGLE + (CLOSED_ANGLE - OPEN_ANGLE) * v.close
    for (const g of fingerRefs.current) {
      if (g) g.rotation.z = angle
    }
    if (crossbarRef.current) crossbarRef.current.position.x = v.x
    if (trolleyRef.current) trolleyRef.current.position.set(v.x, TROLLEY_Y, v.z)
    if (cableRef.current) {
      const length = Math.max(0.01, TROLLEY_Y - v.y)
      cableRef.current.scale.y = length
      cableRef.current.position.set(v.x, v.y + length / 2, v.z)
    }
  })

  return (
    <>
      {/* 고정 레일 2개 */}
      <mesh position={[0, RAIL_Y, -1.0]}>
        <boxGeometry args={[2.9, 0.06, 0.06]} />
        <meshStandardMaterial color="#8a8f9c" metalness={0.5} roughness={0.4} />
      </mesh>
      <mesh position={[0, RAIL_Y, 1.0]}>
        <boxGeometry args={[2.9, 0.06, 0.06]} />
        <meshStandardMaterial color="#8a8f9c" metalness={0.5} roughness={0.4} />
      </mesh>
      {/* 크로스바 (Z방향 바, x는 클로를 따라감) — Z/Y는 레일 중앙·높이에 고정, X만 useFrame에서 갱신 */}
      <mesh ref={crossbarRef} position={[HOME[0], RAIL_Y, 0]}>
        <boxGeometry args={[0.06, 0.06, 2.1]} />
        <meshStandardMaterial color="#8a8f9c" metalness={0.5} roughness={0.4} />
      </mesh>
      {/* 트롤리 */}
      <mesh ref={trolleyRef} position={HOME}>
        <boxGeometry args={[0.16, 0.08, 0.16]} />
        <meshStandardMaterial color="#5c6270" metalness={0.6} roughness={0.3} />
      </mesh>
      {/* 트롤리→허브 케이블 */}
      <mesh ref={cableRef} position={HOME}>
        <cylinderGeometry args={[0.02, 0.02, 1, 8]} />
        <meshStandardMaterial color="#3a3d46" />
      </mesh>

      {/* 클로 본체 — 콜라이더 없음(의도된 설계, PLAN §4) */}
      <RigidBody ref={bodyRef} type="kinematicPosition" colliders={false} position={HOME}>
        <mesh>
          <cylinderGeometry args={[0.12, 0.12, 0.14, 16]} />
          <meshStandardMaterial color="#d8dbe2" metalness={0.6} roughness={0.3} />
        </mesh>
        {Array.from({ length: FINGER_COUNT }).map((_, i) => (
          <group key={i} rotation-y={(i * Math.PI * 2) / FINGER_COUNT}>
            <group
              ref={(el) => {
                fingerRefs.current[i] = el
              }}
              position={[0.1, -0.05, 0]}
              rotation-z={OPEN_ANGLE}
            >
              <mesh>
                <tubeGeometry args={[FINGER_CURVE, 20, 0.025, 8, false]} />
                <meshStandardMaterial color="#c8ccd6" metalness={0.6} roughness={0.35} />
              </mesh>
            </group>
          </group>
        ))}
      </RigidBody>
    </>
  )
}
