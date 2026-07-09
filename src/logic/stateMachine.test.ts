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
const NONE: ClawInput = { btnX: false, btnZ: false }
const BTN_X: ClawInput = { btnX: true, btnZ: false }
const BTN_Z: ClawInput = { btnX: false, btnZ: true }

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
  it('IDLE → MOVING_X → MOVING_Z → DROPPING → GRABBING → LIFTING → RETURNING → RELEASING → RESULT → IDLE', () => {
    const inputs: ClawInput[] = [BTN_X, BTN_X, BTN_Z, BTN_Z, ...Array(60).fill(NONE)]
    const { phases } = run(initialSim(cfg), inputs)
    expect(collapse(phases)).toEqual([
      'IDLE',
      'MOVING_X',
      'MOVING_Z',
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

describe('② 경계 클램프', () => {
  it('MOVING_X는 bounds.maxX를 넘지 않는다', () => {
    let sim: ClawSim = { ...initialSim(cfg), phase: 'MOVING_X', x: cfg.bounds.maxX - 0.01 }
    for (let i = 0; i < 10; i++) {
      sim = stepClaw(sim, BTN_X, DT, cfg).sim
    }
    expect(sim.x).toBeLessThanOrEqual(cfg.bounds.maxX)
  })

  it('MOVING_Z는 bounds.minZ 아래로 내려가지 않는다', () => {
    let sim: ClawSim = { ...initialSim(cfg), phase: 'MOVING_Z', z: cfg.bounds.minZ + 0.01 }
    for (let i = 0; i < 10; i++) {
      sim = stepClaw(sim, BTN_Z, DT, cfg).sim
    }
    expect(sim.z).toBeGreaterThanOrEqual(cfg.bounds.minZ)
  })
})

describe('③ roundTimeLimit 자동 하강', () => {
  it('버튼②를 누르지 않아도 시간 초과 시 DROPPING으로 전이한다', () => {
    const shortCfg: ClawCfg = { ...cfg, roundTimeLimit: 0.2 }
    let sim = stepClaw(initialSim(shortCfg), BTN_X, DT, shortCfg).sim
    expect(sim.phase).toBe('MOVING_X')
    for (let i = 0; i < 10 && sim.phase === 'MOVING_X'; i++) {
      sim = stepClaw(sim, NONE, DT, shortCfg).sim
    }
    expect(sim.phase).toBe('DROPPING')
  })
})

describe('④ 이벤트는 라운드당 정확히 1회씩 방출된다', () => {
  it('GRAB_NOW / RELEASE_NOW / ROUND_END', () => {
    const inputs: ClawInput[] = [BTN_X, BTN_X, BTN_Z, BTN_Z, ...Array(60).fill(NONE)]
    const { events } = run(initialSim(cfg), inputs)
    expect(events.filter((e) => e.type === 'GRAB_NOW')).toHaveLength(1)
    expect(events.filter((e) => e.type === 'RELEASE_NOW')).toHaveLength(1)
    expect(events.filter((e) => e.type === 'ROUND_END')).toHaveLength(1)
  })
})

describe('⑤ MID_DROP', () => {
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

describe('⑥ RESULT → IDLE 복귀 및 리셋', () => {
  it('resultTime 경과 후 IDLE로 돌아가고 라운드 상태가 초기화된다', () => {
    const resultSim: ClawSim = {
      ...initialSim(cfg),
      phase: 'RESULT',
      phaseT: cfg.resultTime - 0.01,
      x: 3,
      z: -2,
      zPressed: true,
      holding: true,
      midDropAt: 0.4,
      carryT: 5,
      carryTotal: 10,
    }
    const { sim } = stepClaw(resultSim, NONE, DT, cfg)
    expect(sim.phase).toBe('IDLE')
    expect(sim.zPressed).toBe(false)
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
