import { describe, it, expect } from 'vitest'
import { initialSim, stepClaw, type ClawCfg, type ClawEvent, type ClawInput, type ClawPhase, type ClawSim } from './stateMachine'

const cfg: ClawCfg = {
  home: [0, 5, 0],
  topY: 5,
  minY: 1,
  bounds: { minX: -5, maxX: 5, minZ: -5, maxZ: 5 },
  speedX: 10,
  speedZ: 10,
  dropSpeed: 10,
  liftSpeed: 10,
  returnSpeed: 10,
  closeTime: 0.1,
  openTime: 0.1,
  settleTime: 0.1,
  resultTime: 0.1,
  roundTimeLimit: 100,
}

const DT = 0.05
const NONE: ClawInput = { up: false, down: false, left: false, right: false, drop: false }
const UP: ClawInput = { ...NONE, up: true }
const DOWN: ClawInput = { ...NONE, down: true }
const LEFT: ClawInput = { ...NONE, left: true }
const RIGHT: ClawInput = { ...NONE, right: true }
const DROP: ClawInput = { ...NONE, drop: true }
const UP_RIGHT: ClawInput = { ...NONE, up: true, right: true }

function run(sim: ClawSim, inputs: ClawInput[], useCfg: ClawCfg = cfg) {
  let s = sim
  const events: ClawEvent[] = []
  const phases: ClawPhase[] = [s.phase]
  for (const input of inputs) {
    const res = stepClaw(s, input, DT, useCfg)
    s = res.sim
    events.push(...res.events)
    phases.push(s.phase)
  }
  return { sim: s, events, phases }
}

/** 등장 순서대로 중복을 제거한 phase 시퀀스 */
function collapse(phases: ClawPhase[]): ClawPhase[] {
  const seen: ClawPhase[] = []
  for (const p of phases) {
    if (seen[seen.length - 1] !== p) seen.push(p)
  }
  return seen
}

describe('① 해피패스 전체 phase 순서', () => {
  it('IDLE → MOVING → DROPPING → GRABBING → LIFTING → RETURNING → RELEASING → RESULT → IDLE', () => {
    const inputs: ClawInput[] = [RIGHT, RIGHT, DROP, ...Array(60).fill(NONE)]
    const { phases } = run(initialSim(cfg), inputs)
    expect(collapse(phases)).toEqual([
      'IDLE',
      'MOVING',
      'DROPPING',
      'GRABBING',
      'LIFTING',
      'RETURNING',
      'RELEASING',
      'RESULT',
      'IDLE',
    ])
  })
})

describe('② 방향키를 놓아도 하강하지 않는다 (③ 요구사항 회귀 방지)', () => {
  it('MOVING 중 방향키를 전부 놓아도 DROPPING으로 넘어가지 않고 MOVING을 유지한다', () => {
    let sim = stepClaw(initialSim(cfg), RIGHT, DT, cfg).sim
    expect(sim.phase).toBe('MOVING')
    for (let i = 0; i < 30; i++) {
      sim = stepClaw(sim, NONE, DT, cfg).sim
    }
    expect(sim.phase).toBe('MOVING')
  })

  it('drop 입력이 들어와야만 DROPPING으로 전이한다', () => {
    let sim = stepClaw(initialSim(cfg), RIGHT, DT, cfg).sim
    sim = stepClaw(sim, NONE, DT, cfg).sim // 방향키 릴리스
    expect(sim.phase).toBe('MOVING')
    sim = stepClaw(sim, DROP, DT, cfg).sim
    expect(sim.phase).toBe('DROPPING')
  })
})

describe('③ 동시 입력(대각선) 이동', () => {
  it('up+right를 동시에 누르면 x/z가 같은 스텝에서 함께 이동한다', () => {
    const sim = stepClaw({ ...initialSim(cfg), phase: 'MOVING' }, UP_RIGHT, DT, cfg).sim
    expect(sim.x).toBeCloseTo(cfg.home[0] + cfg.speedX * DT)
    expect(sim.z).toBeCloseTo(cfg.home[2] - cfg.speedZ * DT)
  })
})

describe('④ 경계 클램프 (4방향 모두)', () => {
  it('MOVING은 bounds.maxX를 넘지 않는다 (right)', () => {
    let sim: ClawSim = { ...initialSim(cfg), phase: 'MOVING', x: cfg.bounds.maxX - 0.01 }
    for (let i = 0; i < 10; i++) sim = stepClaw(sim, RIGHT, DT, cfg).sim
    expect(sim.x).toBeLessThanOrEqual(cfg.bounds.maxX)
  })

  it('MOVING은 bounds.minX 아래로 내려가지 않는다 (left)', () => {
    let sim: ClawSim = { ...initialSim(cfg), phase: 'MOVING', x: cfg.bounds.minX + 0.01 }
    for (let i = 0; i < 10; i++) sim = stepClaw(sim, LEFT, DT, cfg).sim
    expect(sim.x).toBeGreaterThanOrEqual(cfg.bounds.minX)
  })

  it('MOVING은 bounds.minZ 아래로 내려가지 않는다 (up)', () => {
    let sim: ClawSim = { ...initialSim(cfg), phase: 'MOVING', z: cfg.bounds.minZ + 0.01 }
    for (let i = 0; i < 10; i++) sim = stepClaw(sim, UP, DT, cfg).sim
    expect(sim.z).toBeGreaterThanOrEqual(cfg.bounds.minZ)
  })

  it('MOVING은 bounds.maxZ를 넘지 않는다 (down)', () => {
    let sim: ClawSim = { ...initialSim(cfg), phase: 'MOVING', z: cfg.bounds.maxZ - 0.01 }
    for (let i = 0; i < 10; i++) sim = stepClaw(sim, DOWN, DT, cfg).sim
    expect(sim.z).toBeLessThanOrEqual(cfg.bounds.maxZ)
  })
})

describe('⑤ roundTimeLimit 자동 하강', () => {
  it('drop을 누르지 않아도 시간 초과 시 DROPPING으로 전이한다', () => {
    const shortCfg: ClawCfg = { ...cfg, roundTimeLimit: 0.2 }
    let sim = stepClaw(initialSim(shortCfg), RIGHT, DT, shortCfg).sim
    expect(sim.phase).toBe('MOVING')
    for (let i = 0; i < 10 && sim.phase === 'MOVING'; i++) {
      sim = stepClaw(sim, NONE, DT, shortCfg).sim
    }
    expect(sim.phase).toBe('DROPPING')
  })
})

describe('⑥ 이벤트는 라운드당 정확히 1회씩 방출된다', () => {
  it('GRAB_NOW / RELEASE_NOW / ROUND_END', () => {
    const inputs: ClawInput[] = [RIGHT, RIGHT, DROP, ...Array(60).fill(NONE)]
    const { events } = run(initialSim(cfg), inputs)
    expect(events.filter((e) => e.type === 'GRAB_NOW')).toHaveLength(1)
    expect(events.filter((e) => e.type === 'RELEASE_NOW')).toHaveLength(1)
    expect(events.filter((e) => e.type === 'ROUND_END')).toHaveLength(1)
  })
})

describe('⑦ MID_DROP', () => {
  const bigCfg: ClawCfg = { ...cfg, topY: 1000 } // LIFTING이 테스트 도중 끝나지 않도록

  function liftingSim(midDropAt: number | null): ClawSim {
    return {
      ...initialSim(bigCfg),
      phase: 'LIFTING',
      y: 0,
      holding: true,
      midDropAt,
      carryT: 0,
      carryTotal: 1,
    }
  }

  it('holding && midDropAt 설정 시 정확히 1회 발생하고 이후 재발출되지 않는다', () => {
    let sim = liftingSim(0.15) // carryT 0.05단위 증가 → 0.15/1.0 도달 시 발화
    const events: ClawEvent[] = []
    for (let i = 0; i < 40; i++) {
      const res = stepClaw(sim, NONE, DT, bigCfg)
      sim = res.sim
      events.push(...res.events)
    }
    expect(events.filter((e) => e.type === 'MID_DROP')).toHaveLength(1)
    expect(sim.midDropAt).toBeNull()
  })

  it('midDropAt이 null이면 발생하지 않는다', () => {
    let sim = liftingSim(null)
    const events: ClawEvent[] = []
    for (let i = 0; i < 40; i++) {
      const res = stepClaw(sim, NONE, DT, bigCfg)
      sim = res.sim
      events.push(...res.events)
    }
    expect(events.filter((e) => e.type === 'MID_DROP')).toHaveLength(0)
  })

  it('holding이 false면 midDropAt이 있어도 발생하지 않는다', () => {
    let sim = { ...liftingSim(0.15), holding: false }
    const events: ClawEvent[] = []
    for (let i = 0; i < 40; i++) {
      const res = stepClaw(sim, NONE, DT, bigCfg)
      sim = res.sim
      events.push(...res.events)
    }
    expect(events.filter((e) => e.type === 'MID_DROP')).toHaveLength(0)
  })
})

describe('⑧ RESULT → IDLE 복귀 및 리셋', () => {
  it('resultTime 경과 후 IDLE로 돌아가고 라운드 상태가 초기화된다', () => {
    const resultSim: ClawSim = {
      ...initialSim(cfg),
      phase: 'RESULT',
      phaseT: cfg.resultTime - 0.01,
      x: 3,
      z: -2,
      holding: true,
      midDropAt: 0.4,
      carryT: 5,
      carryTotal: 10,
    }
    const { sim } = stepClaw(resultSim, NONE, DT, cfg)
    expect(sim.phase).toBe('IDLE')
    expect(sim.holding).toBe(false)
    expect(sim.midDropAt).toBeNull()
    expect(sim.carryT).toBe(0)
    expect(sim.roundT).toBe(0)

    // 다음 스텝(IDLE 진입 후)에서 위치도 home으로 복귀한다
    const next = stepClaw(sim, NONE, DT, cfg).sim
    expect(next.x).toBe(cfg.home[0])
    expect(next.z).toBe(cfg.home[2])
    expect(next.closeAmount).toBe(0)
  })
})
