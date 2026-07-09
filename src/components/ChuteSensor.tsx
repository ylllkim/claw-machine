import { RigidBody, CuboidCollider } from '@react-three/rapier'
import { MACHINE } from '../config'
import { useStore } from '../store'

/**
 * 배출구 샤프트 내부의 승리 판정 센서 (R3.5).
 * 인형 콜라이더가 진입하면 userData.uid로 식별해 registerWin —
 * 인형은 콜라이더가 2개라 중복 진입할 수 있지만 registerWin이 이미 제거된 uid는 무시한다.
 */
export default function ChuteSensor() {
  const registerWin = useStore((s) => s.registerWin)
  const { sensorArgs, sensorPos } = MACHINE.chute

  return (
    <RigidBody type="fixed" colliders={false}>
      <CuboidCollider
        sensor
        args={[...sensorArgs]}
        position={[...sensorPos]}
        onIntersectionEnter={(e) => {
          const data = e.other.rigidBody?.userData as { uid?: string } | undefined
          if (data?.uid) registerWin(data.uid)
        }}
      />
    </RigidBody>
  )
}
