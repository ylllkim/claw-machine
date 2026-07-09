import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { useRapier, type RapierRigidBody } from '@react-three/rapier'
import type { ImpulseJoint } from '@dimforge/rapier3d-compat'
import { CLAW } from '../config'
import { useStore } from '../store'
import { controlsState } from '../hooks/useControls'
import { initialSim, stepClaw, type ClawSim } from '../logic/stateMachine'
import { pickNearest, rollGrab, rollMidDrop, type GrabCandidate } from '../logic/grab'
import { allPrizeBodies } from './prizeRegistry'
import Claw, { type ClawVisual } from './Claw'

const MAX_DT = 0.05 // 탭 전환 등으로 인한 큰 delta 스파이크 방지

export default function ClawStateMachine() {
  const bodyRef = useRef<RapierRigidBody>(null)
  const simRef = useRef<ClawSim>(initialSim(CLAW))
  const jointRef = useRef<ImpulseJoint | null>(null)
  const visualRef = useRef<ClawVisual>({
    close: 0,
    x: CLAW.home[0],
    y: CLAW.home[1],
    z: CLAW.home[2],
  })

  const { world, rapier } = useRapier()

  const mode = useStore((s) => s.mode)
  const modeRef = useRef(mode)
  modeRef.current = mode

  const credits = useStore((s) => s.credits)
  const creditsRef = useRef(credits)
  creditsRef.current = credits

  const gripStrength = useStore((s) => s.gripStrength)
  const gripRef = useRef(gripStrength)
  gripRef.current = gripStrength

  const dropChance = useStore((s) => s.dropChance)
  const dropRef = useRef(dropChance)
  dropRef.current = dropChance

  const setClawPhase = useStore((s) => s.setClawPhase)
  const spendCredit = useStore((s) => s.spendCredit)
  const clearWonThisRound = useStore((s) => s.clearWonThisRound)

  /** GRAB_NOW: 손바닥 반경 내 최근접 인형에 확률 판정 후 스페리컬 조인트 부착 (PLAN §7) */
  function tryGrab(sim: ClawSim) {
    const clawBody = bodyRef.current
    if (!clawBody) return

    const palm: readonly [number, number, number] = [sim.x, sim.y + CLAW.palmOffsetY, sim.z]
    const candidates: GrabCandidate[] = []
    for (const [uid, body] of allPrizeBodies()) {
      const t = body.translation()
      candidates.push({ uid, x: t.x, y: t.y + CLAW.candidateCenterY, z: t.z })
    }

    const uid = pickNearest(palm, candidates, CLAW.grabRadius)
    if (!uid) return
    if (!rollGrab(Math.random, gripRef.current)) return

    const prizeBody = allPrizeBodies().get(uid)
    if (!prizeBody) return
    prizeBody.wakeUp()
    const params = rapier.JointData.spherical(
      { x: 0, y: CLAW.palmOffsetY, z: 0 },
      { x: CLAW.grabAnchorLocal[0], y: CLAW.grabAnchorLocal[1], z: CLAW.grabAnchorLocal[2] },
    )
    jointRef.current = world.createImpulseJoint(params, clawBody, prizeBody, true)
    sim.holding = true
    sim.midDropAt = rollMidDrop(Math.random, dropRef.current)
  }

  /** MID_DROP / RELEASE_NOW: 조인트 해제 → 인형 자유 낙하 */
  function releaseJoint(sim: ClawSim) {
    if (jointRef.current) {
      world.removeImpulseJoint(jointRef.current, true)
      jointRef.current = null
    }
    sim.holding = false
  }

  useFrame((_, rawDt) => {
    if (modeRef.current === 'operator') return
    const dt = Math.min(rawDt, MAX_DT)
    const prevPhase = simRef.current.phase

    const canStart = prevPhase !== 'IDLE' || creditsRef.current > 0
    const input = {
      up: controlsState.up && canStart,
      down: controlsState.down && canStart,
      left: controlsState.left && canStart,
      right: controlsState.right && canStart,
      drop: controlsState.drop,
    }

    const { sim, events } = stepClaw(simRef.current, input, dt, CLAW)
    simRef.current = sim

    const body = bodyRef.current
    if (body) body.setNextKinematicTranslation({ x: sim.x, y: sim.y, z: sim.z })

    visualRef.current.close = sim.closeAmount
    visualRef.current.x = sim.x
    visualRef.current.y = sim.y
    visualRef.current.z = sim.z

    if (sim.phase !== prevPhase) {
      setClawPhase(sim.phase)
      if (prevPhase === 'IDLE' && sim.phase === 'MOVING') spendCredit()
      // 결과 토스트(Hud)는 RESULT 동안 wonThisRound를 반응형으로 읽는다 — 다음 라운드를 위해 여기서 정리
      if (prevPhase === 'RESULT' && sim.phase === 'IDLE') clearWonThisRound()
    }

    for (const ev of events) {
      switch (ev.type) {
        case 'GRAB_NOW':
          tryGrab(sim)
          break
        case 'MID_DROP':
        case 'RELEASE_NOW':
          releaseJoint(sim)
          break
      }
    }
  })

  return <Claw bodyRef={bodyRef} visualRef={visualRef} />
}
