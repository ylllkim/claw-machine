/**
 * 인형 카탈로그 — 순수 데이터 (Three/Rapier 무의존, vitest 테스트 대상).
 * 종류 추가 = 이 배열에 데이터 1건 추가.
 */

export type ColorSlot = 'primary' | 'secondary' | 'accent' | 'eye'

export type PartSpec = {
  shape: 'sphere' | 'capsule' | 'cone'
  pos: readonly [number, number, number]
  radius: number
  /** capsule/cone 전용: 원통부 길이(capsule) 또는 높이(cone) */
  length?: number
  scale?: readonly [number, number, number]
  rot?: readonly [number, number, number]
  /** 색상 슬롯 (기본 primary) */
  slot?: ColorSlot
}

export type ColliderSpec =
  | { shape: 'ball'; pos: readonly [number, number, number]; radius: number }
  | { shape: 'capsule'; pos: readonly [number, number, number]; radius: number; halfHeight: number }

export type PlushieType = {
  id: string
  label: string
  /** 획득 점수 (희귀도) */
  score: number
  mass: number
  /** primary 색상 후보 풀 — 인스턴스마다 랜덤 선택 */
  palette: readonly string[]
  secondary: string
  accent: string
  parts: readonly PartSpec[]
  colliders: readonly ColliderSpec[]
}

const EYE = '#2b2b2b'

/** 양쪽 눈 파츠 생성 헬퍼 */
const eyes = (dx: number, y: number, z: number): PartSpec[] => [
  { shape: 'sphere', pos: [-dx, y, z], radius: 0.018, slot: 'eye' },
  { shape: 'sphere', pos: [dx, y, z], radius: 0.018, slot: 'eye' },
]

export const CATALOG: readonly PlushieType[] = [
  {
    id: 'bear',
    label: '곰돌이',
    score: 10,
    mass: 1.0,
    palette: ['#c68958', '#f2a0b5', '#8fb7e8', '#b9a0e8'],
    secondary: '#f7e3c8',
    accent: '#e8747c',
    parts: [
      { shape: 'capsule', pos: [0, 0.2, 0], radius: 0.16, length: 0.1 }, // 몸통
      { shape: 'sphere', pos: [0, 0.44, 0], radius: 0.14 }, // 머리
      { shape: 'sphere', pos: [-0.1, 0.55, 0], radius: 0.05 }, // 귀
      { shape: 'sphere', pos: [0.1, 0.55, 0], radius: 0.05 },
      { shape: 'sphere', pos: [0, 0.4, 0.11], radius: 0.06, slot: 'secondary' }, // 주둥이
      { shape: 'sphere', pos: [-0.17, 0.24, 0.03], radius: 0.055 }, // 팔
      { shape: 'sphere', pos: [0.17, 0.24, 0.03], radius: 0.055 },
      { shape: 'sphere', pos: [-0.09, 0.05, 0.06], radius: 0.06 }, // 다리
      { shape: 'sphere', pos: [0.09, 0.05, 0.06], radius: 0.06 },
      ...eyes(0.055, 0.47, 0.12),
    ],
    colliders: [
      { shape: 'capsule', pos: [0, 0.24, 0], radius: 0.18, halfHeight: 0.08 },
      { shape: 'ball', pos: [0, 0.46, 0], radius: 0.15 },
    ],
  },
  {
    id: 'rabbit',
    label: '토끼',
    score: 15,
    mass: 0.8,
    palette: ['#f5f0ea', '#f2b8c6', '#cfc3e8'],
    secondary: '#f7d4dd',
    accent: '#e8747c',
    parts: [
      { shape: 'capsule', pos: [0, 0.17, 0], radius: 0.14, length: 0.08 }, // 몸통
      { shape: 'sphere', pos: [0, 0.38, 0], radius: 0.12 }, // 머리
      { shape: 'capsule', pos: [-0.055, 0.56, -0.01], radius: 0.035, length: 0.14, rot: [0, 0, 0.12] }, // 긴 귀
      { shape: 'capsule', pos: [0.055, 0.56, -0.01], radius: 0.035, length: 0.14, rot: [0, 0, -0.12] },
      { shape: 'sphere', pos: [0, 0.34, 0.1], radius: 0.045, slot: 'secondary' }, // 주둥이
      { shape: 'sphere', pos: [-0.14, 0.2, 0.03], radius: 0.045 }, // 팔
      { shape: 'sphere', pos: [0.14, 0.2, 0.03], radius: 0.045 },
      { shape: 'sphere', pos: [0, 0.14, -0.14], radius: 0.05, slot: 'secondary' }, // 꼬리
      ...eyes(0.05, 0.41, 0.1),
    ],
    colliders: [
      { shape: 'ball', pos: [0, 0.19, 0], radius: 0.17 },
      { shape: 'ball', pos: [0, 0.4, 0], radius: 0.13 },
    ],
  },
  {
    id: 'cat',
    label: '고양이',
    score: 15,
    mass: 0.9,
    palette: ['#8d8d94', '#e8b04b', '#4a4a52', '#f5f0ea'],
    secondary: '#f7e3c8',
    accent: '#e89b4b',
    parts: [
      { shape: 'capsule', pos: [0, 0.17, 0], radius: 0.14, length: 0.08 }, // 몸통
      { shape: 'sphere', pos: [0, 0.38, 0], radius: 0.13 }, // 머리
      { shape: 'cone', pos: [-0.085, 0.53, 0], radius: 0.045, length: 0.09, rot: [0, 0, 0.15] }, // 뾰족 귀
      { shape: 'cone', pos: [0.085, 0.53, 0], radius: 0.045, length: 0.09, rot: [0, 0, -0.15] },
      { shape: 'sphere', pos: [0, 0.34, 0.1], radius: 0.05, slot: 'secondary' }, // 주둥이
      { shape: 'capsule', pos: [0, 0.15, -0.16], radius: 0.05, length: 0.1, rot: [0.3, 0, 0] }, // 꼬리(짧고 통통하게)
      { shape: 'sphere', pos: [-0.13, 0.19, 0.03], radius: 0.045 }, // 팔
      { shape: 'sphere', pos: [0.13, 0.19, 0.03], radius: 0.045 },
      ...eyes(0.05, 0.41, 0.11),
    ],
    colliders: [
      { shape: 'ball', pos: [0, 0.19, 0], radius: 0.17 },
      { shape: 'ball', pos: [0, 0.4, 0], radius: 0.14 },
    ],
  },
  {
    id: 'penguin',
    label: '펭귄',
    score: 20,
    mass: 1.2,
    palette: ['#2f3550', '#3d3d46', '#4b6ea8'],
    secondary: '#f5f0ea',
    accent: '#e8a04b',
    parts: [
      { shape: 'sphere', pos: [0, 0.22, 0], radius: 0.18, scale: [1, 1.25, 1] }, // 몸통
      { shape: 'sphere', pos: [0, 0.21, 0.055], radius: 0.15, scale: [0.9, 1.15, 0.9], slot: 'secondary' }, // 배
      { shape: 'sphere', pos: [0, 0.36, 0.12], radius: 0.055, scale: [1, 0.7, 1], slot: 'accent' }, // 부리
      { shape: 'sphere', pos: [-0.17, 0.24, 0], radius: 0.06, scale: [0.5, 1.3, 0.9] }, // 날개
      { shape: 'sphere', pos: [0.17, 0.24, 0], radius: 0.06, scale: [0.5, 1.3, 0.9] },
      { shape: 'sphere', pos: [-0.07, 0.02, 0.06], radius: 0.05, scale: [1, 0.5, 1.4], slot: 'accent' }, // 발
      { shape: 'sphere', pos: [0.07, 0.02, 0.06], radius: 0.05, scale: [1, 0.5, 1.4], slot: 'accent' },
      ...eyes(0.06, 0.4, 0.14),
    ],
    colliders: [{ shape: 'capsule', pos: [0, 0.23, 0], radius: 0.18, halfHeight: 0.06 }],
  },
  {
    id: 'chick',
    label: '병아리',
    score: 10,
    mass: 0.6,
    palette: ['#f7d54b', '#f7b84b', '#fce8a0'],
    secondary: '#fcf3d0',
    accent: '#e8894b',
    parts: [
      { shape: 'sphere', pos: [0, 0.16, 0], radius: 0.15 }, // 몸통
      { shape: 'sphere', pos: [0, 0.36, 0], radius: 0.11 }, // 머리
      { shape: 'sphere', pos: [0, 0.34, 0.1], radius: 0.035, scale: [1, 0.7, 1.2], slot: 'accent' }, // 부리
      { shape: 'sphere', pos: [-0.13, 0.17, 0], radius: 0.05, scale: [0.5, 1, 0.9] }, // 날개
      { shape: 'sphere', pos: [0.13, 0.17, 0], radius: 0.05, scale: [0.5, 1, 0.9] },
      { shape: 'sphere', pos: [0, 0.46, 0], radius: 0.03, scale: [0.6, 1.4, 0.6] }, // 머리깃
      ...eyes(0.05, 0.38, 0.09),
    ],
    colliders: [
      { shape: 'ball', pos: [0, 0.17, 0], radius: 0.16 },
      { shape: 'ball', pos: [0, 0.37, 0], radius: 0.12 },
    ],
  },
] as const

const byId = new Map(CATALOG.map((t) => [t.id, t]))

export function getType(id: string): PlushieType {
  const t = byId.get(id)
  if (!t) throw new Error(`알 수 없는 인형 종류: ${id}`)
  return t
}

export { EYE as EYE_COLOR }
