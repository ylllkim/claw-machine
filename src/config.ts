/**
 * 모든 튜닝값 집중 파일 — 매직넘버는 여기로 (SPEC 아키텍처 규칙 2).
 * 단위: 대략 미터. 기계 내부 바닥 윗면이 y=0.
 */

export const MACHINE = {
  /** 인형 구덩이 내부 절반 크기 */
  innerHalfX: 1.6,
  innerHalfZ: 1.1,
  /** 보이지 않는 컨테인먼트 콜라이더 두께 (얇으면 터널링 — SPEC 규칙 4) */
  wallThickness: 0.15,
  /** 컨테인먼트 벽 높이 (클로 이동 영역까지 포함) */
  wallHeight: 3.4,
  /** 유리 비주얼 높이 */
  glassHeight: 2.2,
  /** 배출구 (앞-왼쪽 코너, 바닥에 뚫린 구멍) */
  chute: {
    minX: -1.6,
    maxX: -0.8,
    minZ: 0.3,
    maxZ: 1.1,
    /** 구덩이 쪽 낮은 가드 벽 높이 (인형이 굴러 들어가지 않게) */
    guardHeight: 0.38,
    /** 구멍 아래 샤프트 깊이 */
    depth: 1.2,
    /** 승리 판정 센서 (샤프트 내부) — half extents / 중심 위치 */
    sensorArgs: [0.35, 0.15, 0.35] as const,
    sensorPos: [-1.2, -0.7, 0.7] as const,
  },
} as const

export const PRIZES = {
  count: 20,
  /** 초기 낙하 스폰 영역 (배출구 상공 제외는 코드에서 처리) */
  spawn: { minX: -1.3, maxX: 1.3, minZ: -0.85, maxZ: 0.85, minY: 1.2, maxY: 2.8 },
  /** 물리 튜닝 — 봉제인형답게 튀지 않고 둔하게 */
  linearDamping: 0.5,
  angularDamping: 1.5,
  friction: 0.8,
  restitution: 0.05,
} as const

/** 콜라이더 와이어프레임 표시 (개발용) */
export const DEBUG_PHYSICS = false

export const CLAW = {
  // 유리 내부(0~MACHINE.glassHeight=2.2)에서도 마퀴 스트립(y 2.06~2.34)·탑 하우징(y 2.2~2.8)과
  // 겹치지 않는 높이로 클로/갠트리를 배치 — topY 이상은 전부 이 마진 아래여야 함
  home: [-1.2, 1.75, 0.7] as const, // 배출구 상공 = 시작/복귀 위치
  topY: 1.75,
  minY: 0.72, // 하강 최저점 (허브 기준)
  railY: 1.95, // 고정 레일 높이 (Claw.tsx 갠트리 비주얼)
  trolleyY: 1.9, // 트롤리 높이 — topY보다 위, railY 이하
  bounds: { minX: -1.35, maxX: 1.35, minZ: -0.9, maxZ: 0.9 },
  speedX: 0.9,
  speedZ: 0.9, // 버튼 홀드 이동 속도 m/s
  dropSpeed: 1.6,
  liftSpeed: 1.4,
  returnSpeed: 1.2,
  closeTime: 0.45,
  openTime: 0.35, // 손가락 개폐 시간(s)
  palmOffsetY: -0.3, // 허브→손바닥 로컬 오프셋
  grabRadius: 0.45, // 손바닥 기준 후보 탐색 반경
  grabAnchorLocal: [0, 0.4, 0] as const, // 인형 로컬 부착점(머리 근처 → 달랑거림)
  candidateCenterY: 0.25, // 후보 대표점: 바디 translation + y 보정(인형 몸통 중심 근사)
  settleTime: 1.4,
  resultTime: 2.2, // 릴리스 후 안착 대기 / 결과 표시(s)
  roundTimeLimit: 20, // 라운드 시작 후 초과 시 자동 하강(s)
} as const

export const GAME = { startCredits: 10, gripStrength: 0.65, dropChance: 0.3 } as const

export const KEYS = {
  up: ['ArrowUp', 'KeyW'],
  down: ['ArrowDown', 'KeyS'],
  left: ['ArrowLeft', 'KeyA'],
  right: ['ArrowRight', 'KeyD'],
  drop: ['Space', 'KeyX'],
} as const

export const STORAGE = { best: 'claw.best', layout: 'claw.layout' } as const

/** 운영자 모드 배치 — 클릭 지점 상공에서 낙하시켜 안착시킨다 */
export const OPERATOR = { spawnY: 2.0 } as const
