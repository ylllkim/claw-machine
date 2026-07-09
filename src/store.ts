import { create } from 'zustand'
import { getType } from './catalog'
import { GAME, PRIZES, STORAGE } from './config'
import { parseLayout, randomInstances, type PlushieInstance } from './logic/layout'

export type { PlushieInstance } from './logic/layout'

export type ClawPhase =
  | 'IDLE'
  | 'MOVING'
  | 'DROPPING'
  | 'GRABBING'
  | 'LIFTING'
  | 'RETURNING'
  | 'RELEASING'
  | 'RESULT'

export type Mode = 'play' | 'operator'

export type WonResult = { typeId: string; label: string; score: number } | null

let uidSeq = 0
export function nextUid(): string {
  uidSeq += 1
  return `p${uidSeq}`
}

function loadBest(): number {
  try {
    const raw = localStorage.getItem(STORAGE.best)
    return raw ? Number(raw) || 0 : 0
  } catch {
    return 0
  }
}

/** 저장된 레이아웃이 있으면 복원, 없거나 손상됐으면 무작위 채우기 (R5.5) */
function initialPlushies(): PlushieInstance[] {
  try {
    const raw = localStorage.getItem(STORAGE.layout)
    if (raw) {
      const entries = parseLayout(raw)
      if (entries && entries.length > 0) {
        return entries.map((entry) => ({ ...entry, uid: nextUid() }))
      }
    }
  } catch {
    // localStorage 사용 불가 환경 — 무작위 채우기로 폴백
  }
  return randomInstances(Math.random, PRIZES.count).map((inst) => ({ ...inst, uid: nextUid() }))
}

type Store = {
  mode: Mode
  plushies: PlushieInstance[]
  clawPhase: ClawPhase
  credits: number
  score: number
  best: number
  wonThisRound: WonResult
  gripStrength: number
  dropChance: number
  selectedTypeId: string
  showCelebration: boolean
  roundsPlayed: number

  setMode: (mode: Mode) => void
  setClawPhase: (phase: ClawPhase) => void
  spendCredit: () => void
  refillCredits: (amount?: number) => void
  registerWin: (uid: string) => void
  addPlushie: (instance: Omit<PlushieInstance, 'uid'>) => void
  removePlushie: (uid: string) => void
  setPlushies: (instances: PlushieInstance[]) => void
  setGrip: (value: number) => void
  setDrop: (value: number) => void
  setSelectedTypeId: (typeId: string) => void
  clearWonThisRound: () => void
  dismissCelebration: () => void
  retryChallenge: () => void
}

export const useStore = create<Store>()((set) => ({
  mode: 'play',
  plushies: initialPlushies(),
  clawPhase: 'IDLE',
  credits: GAME.startCredits,
  score: 0,
  best: loadBest(),
  wonThisRound: null,
  gripStrength: GAME.gripStrength,
  dropChance: GAME.dropChance,
  selectedTypeId: 'bear',
  showCelebration: false,
  roundsPlayed: 0,

  // 클로가 정지(IDLE)해 있을 때만 모드 전환 허용 — 운반 중(조인트 부착) 전환 시
  // 운영자 기능(비우기 등)이 살아있는 조인트의 바디를 지워 rapier가 크래시할 수 있음
  setMode: (mode) => set((s) => (s.clawPhase === 'IDLE' ? { mode } : {})),
  setClawPhase: (clawPhase) => set({ clawPhase }),
  spendCredit: () => set((s) => ({ credits: Math.max(0, s.credits - 1), roundsPlayed: s.roundsPlayed + 1 })),
  refillCredits: (amount = GAME.startCredits) => set((s) => ({ credits: s.credits + amount })),

  registerWin: (uid) =>
    set((s) => {
      const target = s.plushies.find((p) => p.uid === uid)
      if (!target) return {}
      const type = getType(target.typeId)
      const score = s.score + type.score
      const best = Math.max(s.best, score)
      try {
        localStorage.setItem(STORAGE.best, String(best))
      } catch {
        // localStorage 사용 불가 환경 — 조용히 무시
      }
      const plushies = s.plushies.filter((p) => p.uid !== uid)
      return {
        plushies,
        score,
        best,
        wonThisRound: { typeId: type.id, label: type.label, score: type.score },
        showCelebration: plushies.length === 0,
      }
    }),

  addPlushie: (instance) => set((s) => ({ plushies: [...s.plushies, { ...instance, uid: nextUid() }] })),
  removePlushie: (uid) => set((s) => ({ plushies: s.plushies.filter((p) => p.uid !== uid) })),
  setPlushies: (plushies) => set({ plushies }),
  setGrip: (gripStrength) => set({ gripStrength }),
  setDrop: (dropChance) => set({ dropChance }),
  setSelectedTypeId: (selectedTypeId) => set({ selectedTypeId }),
  clearWonThisRound: () => set({ wonThisRound: null }),
  dismissCelebration: () => set({ showCelebration: false }),
  retryChallenge: () =>
    set(() => ({
      score: 0,
      roundsPlayed: 0,
      showCelebration: false,
      plushies: randomInstances(Math.random, PRIZES.count).map((inst) => ({ ...inst, uid: nextUid() })),
    })),
}))

// 개발 중 브라우저 콘솔/자동화에서 상태 확인·튜닝용 (프로덕션 빌드에서는 제외됨)
if (import.meta.env.DEV) {
  ;(globalThis as Record<string, unknown>).__clawStore = useStore
}
