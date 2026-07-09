import { useEffect, useMemo, useRef } from 'react'
import type { ThreeEvent } from '@react-three/fiber'
import { RigidBody, BallCollider, CapsuleCollider, type RapierRigidBody } from '@react-three/rapier'
import { getType, EYE_COLOR, type PartSpec, type PlushieType } from '../catalog'
import { PRIZES } from '../config'
import type { PlushieInstance } from '../logic/layout'
import { useStore } from '../store'
import { registerPrize, unregisterPrize } from './prizeRegistry'

function partColor(part: PartSpec, type: PlushieType, primary: string): string {
  switch (part.slot ?? 'primary') {
    case 'primary': return primary
    case 'secondary': return type.secondary
    case 'accent': return type.accent
    case 'eye': return EYE_COLOR
  }
}

type PartProps = { part: PartSpec; color: string; onClick?: (e: ThreeEvent<MouseEvent>) => void }

function Part({ part, color, onClick }: PartProps) {
  return (
    <mesh
      castShadow
      position={[...part.pos]}
      rotation={part.rot ? [...part.rot] : undefined}
      scale={part.scale ? [...part.scale] : undefined}
      onClick={onClick}
    >
      {part.shape === 'sphere' ? (
        <sphereGeometry args={[part.radius, 20, 14]} />
      ) : part.shape === 'capsule' ? (
        <capsuleGeometry args={[part.radius, part.length ?? 0.1, 6, 12]} />
      ) : (
        <coneGeometry args={[part.radius, part.length ?? 0.1, 16]} />
      )}
      <meshStandardMaterial color={color} roughness={0.9} />
    </mesh>
  )
}

export default function Plushie({ instance }: { instance: PlushieInstance }) {
  const type = getType(instance.typeId)
  const primary = type.palette[instance.colorIndex % type.palette.length]
  const bodyRef = useRef<RapierRigidBody>(null)
  // 리렌더(예: 다른 인형 추가/제거로 배열 참조가 바뀔 때)마다 회전이 리셋되지 않도록 마운트 시 1회만 계산
  // 3축 모두 랜덤 — 전부 세운 채로 떨어지는 대신 제각각 기울어진 채로 낙하
  const initialRotation = useMemo<[number, number, number]>(
    () => [Math.random() * Math.PI * 2, Math.random() * Math.PI * 2, Math.random() * Math.PI * 2],
    [],
  )
  const massPerCollider = type.mass / type.colliders.length

  const mode = useStore((s) => s.mode)
  const removePlushie = useStore((s) => s.removePlushie)

  useEffect(() => {
    if (bodyRef.current) registerPrize(instance.uid, bodyRef.current)
    return () => unregisterPrize(instance.uid)
  }, [instance.uid])

  function handleClick(e: ThreeEvent<MouseEvent>) {
    if (mode !== 'operator') return
    e.stopPropagation()
    removePlushie(instance.uid)
  }

  return (
    <RigidBody
      ref={bodyRef}
      colliders={false}
      position={[...instance.pos]}
      {...(instance.quat ? { quaternion: [...instance.quat] } : { rotation: initialRotation })}
      linearDamping={PRIZES.linearDamping}
      angularDamping={PRIZES.angularDamping}
      canSleep
      ccd
      userData={{ uid: instance.uid }}
    >
      {type.colliders.map((c, i) =>
        c.shape === 'ball' ? (
          <BallCollider
            key={i}
            args={[c.radius]}
            position={[...c.pos]}
            friction={PRIZES.friction}
            restitution={PRIZES.restitution}
            mass={massPerCollider}
          />
        ) : (
          <CapsuleCollider
            key={i}
            args={[c.halfHeight, c.radius]}
            position={[...c.pos]}
            friction={PRIZES.friction}
            restitution={PRIZES.restitution}
            mass={massPerCollider}
          />
        ),
      )}
      {type.parts.map((p, i) => (
        <Part key={i} part={p} color={partColor(p, type, primary)} onClick={handleClick} />
      ))}
    </RigidBody>
  )
}
