/**
 * 클로 상태머신 — 순수 함수 (Three/Rapier/React 임포트 금지, PLAN §6).
 * 물리 반영(setNextKinematicTranslation 등)과 그랩 성공 판정은 컴포넌트(ClawStateMachine.tsx)의 몫.
 */

export type ClawPhase =
  | 'IDLE'
  | 'MOVING'
  | 'DROPPING'
  | 'GRABBING'
  | 'LIFTING'
  | 'RETURNING'
  | 'RELEASING'
  | 'RESULT'

/** CLAW 설정값의 구조적 타입 — src/config.ts의 CLAW 상수가 이 형태를 만족 */
export type ClawCfg = {
  readonly home: readonly [number, number, number]
  readonly topY: number
  readonly minY: number
  readonly bounds: {
    readonly minX: number
    readonly maxX: number
    readonly minZ: number
    readonly maxZ: number
  }
  readonly speedX: number
  readonly speedZ: number
  readonly dropSpeed: number
  readonly liftSpeed: number
  readonly returnSpeed: number
  readonly closeTime: number
  readonly openTime: number
  readonly settleTime: number
  readonly resultTime: number
  readonly roundTimeLimit: number
}

export type ClawSim = {
  phase: ClawPhase
  x: number
  y: number
  z: number
  /** 0=열림 1=닫힘 */
  closeAmount: number
  /** 현재 phase 경과 시간(s) */
  phaseT: number
  /** 라운드(이동 시작~결과) 경과 시간(s) */
  roundT: number
  /** 조인트 부착 여부 — 컴포넌트가 설정(Phase 3) */
  holding: boolean
  /** 운반 진행률 임계값(0~1) — 컴포넌트가 설정(Phase 3) */
  midDropAt: number | null
  carryT: number
  carryTotal: number
}

/** 방향패드(4방향) + 별도 하강 버튼 — 실제 조이스틱 조작에 대응 */
export type ClawInput = {
  up: boolean
  down: boolean
  left: boolean
  right: boolean
  drop: boolean
}

export type ClawEvent = { type: 'GRAB_NOW' | 'MID_DROP' | 'RELEASE_NOW' | 'ROUND_END' }

export function initialSim(cfg: ClawCfg): ClawSim {
  return {
    phase: 'IDLE',
    x: cfg.home[0],
    y: cfg.home[1],
    z: cfg.home[2],
    closeAmount: 0,
    phaseT: 0,
    roundT: 0,
    holding: false,
    midDropAt: null,
    carryT: 0,
    carryTotal: 0,
  }
}

function clamp(v: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, v))
}

function checkMidDrop(sim: ClawSim, events: ClawEvent[]): void {
  if (
    sim.holding &&
    sim.midDropAt !== null &&
    sim.carryTotal > 0 &&
    sim.carryT / sim.carryTotal >= sim.midDropAt
  ) {
    events.push({ type: 'MID_DROP' })
    sim.midDropAt = null
  }
}

export function stepClaw(
  sim: ClawSim,
  input: ClawInput,
  dt: number,
  cfg: ClawCfg,
): { sim: ClawSim; events: ClawEvent[] } {
  const s: ClawSim = { ...sim }
  const events: ClawEvent[] = []
  s.phaseT += dt

  switch (s.phase) {
    case 'IDLE': {
      s.x = cfg.home[0]
      s.y = cfg.home[1]
      s.z = cfg.home[2]
      s.closeAmount = 0
      if (input.up || input.down || input.left || input.right) {
        s.phase = 'MOVING'
        s.phaseT = 0
        s.roundT = 0
      }
      break
    }
    case 'MOVING': {
      s.roundT += dt
      if (input.right) s.x = clamp(s.x + cfg.speedX * dt, cfg.bounds.minX, cfg.bounds.maxX)
      if (input.left) s.x = clamp(s.x - cfg.speedX * dt, cfg.bounds.minX, cfg.bounds.maxX)
      if (input.up) s.z = clamp(s.z - cfg.speedZ * dt, cfg.bounds.minZ, cfg.bounds.maxZ)
      if (input.down) s.z = clamp(s.z + cfg.speedZ * dt, cfg.bounds.minZ, cfg.bounds.maxZ)
      if (input.drop) {
        s.phase = 'DROPPING'
        s.phaseT = 0
      } else if (s.roundT > cfg.roundTimeLimit) {
        s.phase = 'DROPPING'
        s.phaseT = 0
      }
      break
    }
    case 'DROPPING': {
      s.roundT += dt
      s.y -= cfg.dropSpeed * dt
      if (s.y <= cfg.minY) {
        s.y = cfg.minY
        s.phase = 'GRABBING'
        s.phaseT = 0
      }
      break
    }
    case 'GRABBING': {
      s.roundT += dt
      s.closeAmount = Math.min(1, s.phaseT / cfg.closeTime)
      if (s.phaseT >= cfg.closeTime) {
        s.closeAmount = 1
        events.push({ type: 'GRAB_NOW' })
        s.phase = 'LIFTING'
        s.phaseT = 0
        s.carryT = 0
        const liftDist = Math.max(0, cfg.topY - s.y)
        const returnDist = Math.hypot(s.x - cfg.home[0], s.z - cfg.home[2])
        s.carryTotal = liftDist / cfg.liftSpeed + returnDist / cfg.returnSpeed
      }
      break
    }
    case 'LIFTING': {
      s.roundT += dt
      s.y += cfg.liftSpeed * dt
      s.carryT += dt
      checkMidDrop(s, events)
      if (s.y >= cfg.topY) {
        s.y = cfg.topY
        s.phase = 'RETURNING'
        s.phaseT = 0
      }
      break
    }
    case 'RETURNING': {
      s.roundT += dt
      const dx = cfg.home[0] - s.x
      const dz = cfg.home[2] - s.z
      const dist = Math.hypot(dx, dz)
      s.carryT += dt
      if (dist > 1e-6) {
        const step = Math.min(dist, cfg.returnSpeed * dt)
        s.x += (dx / dist) * step
        s.z += (dz / dist) * step
      }
      checkMidDrop(s, events)
      const newDist = Math.hypot(cfg.home[0] - s.x, cfg.home[2] - s.z)
      if (newDist < 0.02) {
        s.x = cfg.home[0]
        s.z = cfg.home[2]
        events.push({ type: 'RELEASE_NOW' })
        s.phase = 'RELEASING'
        s.phaseT = 0
      }
      break
    }
    case 'RELEASING': {
      s.roundT += dt
      s.closeAmount = 1 - Math.min(1, s.phaseT / cfg.openTime)
      if (s.phaseT >= cfg.openTime + cfg.settleTime) {
        events.push({ type: 'ROUND_END' })
        s.phase = 'RESULT'
        s.phaseT = 0
      }
      break
    }
    case 'RESULT': {
      if (s.phaseT >= cfg.resultTime) {
        s.phase = 'IDLE'
        s.phaseT = 0
        s.roundT = 0
        s.holding = false
        s.midDropAt = null
        s.carryT = 0
        s.carryTotal = 0
      }
      break
    }
  }

  return { sim: s, events }
}
