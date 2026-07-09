import { useFrame } from '@react-three/fiber'
import { PRIZES } from '../config'
import { useStore } from '../store'
import { allPrizeBodies } from './prizeRegistry'
import Plushie from './Plushie'

/** 겹쳐 쌓인 인형을 뽑아낼 때 솔버가 만들 수 있는 폭발적 속도를 매 프레임 상한선으로 억제 */
function clampVelocities() {
  for (const body of allPrizeBodies().values()) {
    const lv = body.linvel()
    const lvMag = Math.hypot(lv.x, lv.y, lv.z)
    if (lvMag > PRIZES.maxLinvel) {
      const scale = PRIZES.maxLinvel / lvMag
      body.setLinvel({ x: lv.x * scale, y: lv.y * scale, z: lv.z * scale }, true)
    }
    const av = body.angvel()
    const avMag = Math.hypot(av.x, av.y, av.z)
    if (avMag > PRIZES.maxAngvel) {
      const scale = PRIZES.maxAngvel / avMag
      body.setAngvel({ x: av.x * scale, y: av.y * scale, z: av.z * scale }, true)
    }
  }
}

export default function Prizes() {
  const plushies = useStore((s) => s.plushies)
  useFrame(clampVelocities)
  return (
    <>
      {plushies.map((p) => (
        <Plushie key={p.uid} instance={p} />
      ))}
    </>
  )
}
