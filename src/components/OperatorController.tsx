import type { ThreeEvent } from '@react-three/fiber'
import { getType } from '../catalog'
import { MACHINE, OPERATOR } from '../config'
import { clampSpawnXZ } from '../logic/layout'
import { useStore } from '../store'

/**
 * 운영자 모드에서만 마운트되는(App.tsx) 배치용 투명 평면 — 바닥 높이(y=0)에 깔아
 * 클릭 지점의 x/z를 그대로 배치 좌표로 쓴다(화면상 클릭 위치와 배치 위치가 시각적으로 일치).
 * PLAN §2: 보이지 않는 클릭 평면은 opacity=0 + depthWrite=false로, visible은 유지해야 raycast된다.
 */
export default function OperatorController() {
  const selectedTypeId = useStore((s) => s.selectedTypeId)
  const addPlushie = useStore((s) => s.addPlushie)

  function handleClick(e: ThreeEvent<MouseEvent>) {
    e.stopPropagation()
    const clamped = clampSpawnXZ(e.point.x, e.point.z)
    if (!clamped) return // 배출구 구역 — 배치 거부 (R5.2)
    const [x, z] = clamped
    const palette = getType(selectedTypeId).palette
    const colorIndex = Math.floor(Math.random() * palette.length)
    addPlushie({ typeId: selectedTypeId, colorIndex, pos: [x, OPERATOR.spawnY, z] })
  }

  return (
    <mesh rotation-x={-Math.PI / 2} position={[0, 0.01, 0]} onClick={handleClick}>
      <planeGeometry args={[MACHINE.innerHalfX * 2, MACHINE.innerHalfZ * 2]} />
      <meshBasicMaterial transparent opacity={0} depthWrite={false} />
    </mesh>
  )
}
