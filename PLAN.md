# 인형뽑기 — 구현 지시서 (v3, Sonnet 실행용)

## Context

3D 인형뽑기 게임. 사내 교육용 재미 프로젝트, 바이브 코딩, 1차 목표는 로컬 실행(`npm run dev`), Vercel 배포는 마지막에만. 라이선스는 MIT/Apache/CC0만.
**이 문서는 Sonnet이 그대로 따라 구현할 수 있도록 모든 결정·좌표·API를 명시한 지시서다. 여기 적힌 값과 규약을 임의로 재설계하지 말 것.** 프로젝트 스펙·수용 기준은 `SPEC.md`(이 문서와 함께 유지·갱신, 리포지토리 루트). "왜 이렇게 결정했는지"는 `DECISIONS.md` 참고.

## 현재 상태 (2026-07-08 기준, Phase 0 완료 + Phase 1 일부)

**완료·검증됨** (`npm test` 6개 통과, `npm run build` 통과):
- 스캐폴드: `package.json`(deps 설치됨 — 버전 변경 금지), `tsconfig.json`, `vite.config.ts`(vitest 설정 포함), `index.html`, `src/main.tsx`
- `src/App.tsx` — Phase 0 데모(낙하 큐브). **Phase 1에서 교체 대상**
- `src/config.ts` — MACHINE/PRIZES/DEBUG_PHYSICS 정의됨. **CLAW/GAME/KEYS/STORAGE 추가 필요** (아래 §3)
- `src/catalog.ts` — 인형 5종(bear/rabbit/cat/penguin/chick) 데이터 완성. 테스트 미작성
- `src/logic/grab.ts` + `grab.test.ts` — `rollGrab`, `rollMidDrop` 완료. **`pickNearest` 추가 필요**
- `SPEC.md` — 작성됨. **§8의 개정 필요**
- Task 목록: #2(Phase 1) in_progress, #3~#7 pending

**미작성 파일**: `store.ts`, `logic/stateMachine.ts`, `logic/layout.ts`, `hooks/useControls.ts`, `components/`(Machine, Claw, ClawStateMachine, Prizes, Plushie, ChuteSensor, OperatorController, prizeRegistry), `ui/`(Hud, OperatorPanel, DebugPanel)

---

## §1. 절대 규칙

1. **가장 먼저 `npm i -D @types/three` 실행** — three@0.185는 타입 미내장. 지금까지는 three를 직접 import한 코드가 없어 빌드가 통과했을 뿐, Phase 1부터 필요
2. `src/logic/` 은 **Three/Rapier/React import 금지** — 순수 함수만, 전부 vitest 대상
3. 매직넘버는 전부 `src/config.ts` — 컴포넌트에 숫자 리터럴 하드코딩 금지
4. 클로 이동은 반드시 `body.setNextKinematicTranslation({x,y,z})` (직접 setTranslation 금지)
5. **zustand에 매 프레임 쓰기 금지** — 클로 시뮬 상태는 `useRef`로 보관, phase가 바뀔 때만 store 반영
6. 타이머는 dt 누적(초) 기반 — `setTimeout` 금지
7. 의존성 추가/버전 변경 금지 (예외: @types/three)
8. 각 Phase 완료 시 `SPEC.md`의 해당 체크박스·진행 표를 갱신

## §2. TS/라이브러리 함정 치트시트 (검증 완료 — 그대로 사용)

- `tsconfig`: `verbatimModuleSyntax: true` → **타입은 반드시 `import type`** (`import type { RapierRigidBody } from '@react-three/rapier'`). `noUnusedLocals/Parameters: true` → 미사용 import 하나로 빌드 실패
- **인자 순서 주의 (서로 다름!)**
  - three `<capsuleGeometry args={[radius, length, capSeg, radialSeg]} />`
  - rapier `<CapsuleCollider args={[halfHeight, radius]} />` (d.ts로 확인됨)
  - `<CuboidCollider args={[hx, hy, hz]} />` — **half extents**
  - `<BallCollider args={[radius]} />`
- 조인트 (rapier compat d.ts로 시그니처 확인됨):
  ```ts
  const { world, rapier } = useRapier()
  const j = world.createImpulseJoint(rapier.JointData.spherical(anchor1, anchor2), body1, body2, true)
  world.removeImpulseJoint(j, true)   // anchor는 각 바디 로컬 좌표 {x,y,z}
  ```
- `<RigidBody userData={{ uid }}>` 지원 → 센서 이벤트에서 `other.rigidBody?.userData` 로 식별
- 센서: `<CuboidCollider sensor onIntersectionEnter={(e) => ...} />`
- zustand v5 커리드: `create<State>()((set, get) => ({...}))`
- R3F 이벤트 타입: `import type { ThreeEvent } from '@react-three/fiber'`
- 보이지 않는 클릭 평면: `visible={false}` 메시는 raycast 안 됨 → `visible` 유지 + `<meshBasicMaterial transparent opacity={0} depthWrite={false} />`
- 콜라이더 시각화: `<Physics debug={DEBUG_PHYSICS}>` — 물리 문제 디버깅 시 config에서 켜기

## §3. config.ts에 추가할 상수 (이 값 그대로)

```ts
export const CLAW = {
  home: [-1.2, 2.4, 0.7] as const,  // 배출구 상공 = 시작/복귀 위치
  topY: 2.4,
  minY: 0.72,                        // 하강 최저점 (허브 기준)
  bounds: { minX: -1.35, maxX: 1.35, minZ: -0.9, maxZ: 0.9 },
  speedX: 0.9, speedZ: 0.9,          // 버튼 홀드 이동 속도 m/s
  dropSpeed: 1.6, liftSpeed: 1.4, returnSpeed: 1.2,
  closeTime: 0.45, openTime: 0.35,   // 손가락 개폐 시간(s)
  palmOffsetY: -0.3,                 // 허브→손바닥 로컬 오프셋
  grabRadius: 0.45,                  // 손바닥 기준 후보 탐색 반경
  grabAnchorLocal: [0, 0.4, 0] as const, // 인형 로컬 부착점(머리 근처 → 달랑거림)
  settleTime: 1.4, resultTime: 2.2,  // 릴리스 후 안착 대기 / 결과 표시(s)
  roundTimeLimit: 20,                // 라운드 시작 후 초과 시 자동 하강(s)
} as const
export const GAME = { startCredits: 10, gripStrength: 0.65, dropChance: 0.3 } as const
export const KEYS = { btnX: ['ArrowRight', 'KeyZ'], btnZ: ['ArrowUp', 'KeyX'] } as const
export const STORAGE = { best: 'claw.best', layout: 'claw.layout' } as const
```

## §4. 기계 기하 — 고정 콜라이더 표 (재계산 금지, 그대로 사용)

내부 공간 x∈[-1.6,1.6], z∈[-1.1,1.1], 바닥 윗면 y=0. 배출구 구멍: x∈[-1.6,-0.8], z∈[0.3,1.1] (앞-왼쪽 코너, 바닥에 뚫림). `Machine.tsx`의 단일 `<RigidBody type="fixed" colliders={false}>` 안에 CuboidCollider로:

| 용도 | args (half) | position |
|---|---|---|
| 바닥 A (구멍 뒤쪽 전체) | [1.6, 0.15, 0.7] | [0, -0.15, -0.4] |
| 바닥 B (구멍 오른쪽) | [1.2, 0.15, 0.4] | [0.4, -0.15, 0.7] |
| 외벽 좌/우 | [0.15, 1.7, 1.4] | [∓1.75, 1.7, 0] |
| 외벽 뒤/앞 | [1.9, 1.7, 0.15] | [0, 1.7, ∓1.25] |
| 슈트 가드 (x=-0.8 경계, 낮은 벽) | [0.05, 0.19, 0.4] | [-0.8, 0.19, 0.7] |
| 슈트 가드 (z=0.3 경계) | [0.4, 0.19, 0.05] | [-1.2, 0.19, 0.3] |
| 샤프트 내벽 x측 / z측 | [0.05, 0.6, 0.4] / [0.4, 0.6, 0.05] | [-0.8, -0.6, 0.7] / [-1.2, -0.6, 0.3] |
| 샤프트 외벽 좌 / 앞 | [0.15, 0.6, 0.4] / [0.4, 0.6, 0.15] | [-1.75, -0.6, 0.7] / [-1.2, -0.6, 1.25] |
| 샤프트 바닥 | [0.55, 0.15, 0.55] | [-1.2, -1.35, 0.7] |

**배출구 센서** (`ChuteSensor.tsx`): `<CuboidCollider sensor args={[0.35, 0.15, 0.35]} position={[-1.2, -0.7, 0.7]} />`

**비주얼** (콜라이더와 별개, 자유도 있음): 분홍(#f25c8a) 캐비닛 베이스 박스(y −1.5~0)·탑 하우징(y 2.2~2.8)·노랑(#ffd166) 마퀴 스트립, 4모서리 기둥, 유리 4면(두께 0.02, `transparent opacity 0.15`, y 0~2.2), 바닥 비주얼은 콜라이더 A·B와 동일 치수의 보라(#9b7ede) 박스, 구멍 테두리 강조 스트립 + 샤프트 내부 어두운 박스. 갠트리: 고정 레일 2개(X방향 바, z=±1.0, y=2.95), 크로스바(Z방향, x=클로 x), 트롤리 박스(클로 x,z, y=2.93), 트롤리→허브 케이블(반지름 0.02 실린더, 길이/위치를 매 프레임 갱신). 갠트리 비주얼은 RigidBody 밖에서 ref로 갱신.

**클로 비주얼**: 은색 허브(실린더 r0.12) + 손가락 3개(120° 배치: `<group rotation-y={i*2π/3}><group position={[0.1,-0.05,0]} rotation-z={-lerp(0.55, 0.12, close)}><mesh position={[0,-0.17,0]}>capsule r0.03 len0.28`). **v1 클로는 콜라이더 없음** (의도된 결정 — 물리 간섭/튕김 방지). 손가락이 인형을 시각적으로 관통하는 프레임은 허용.

**카메라/조명**: camera `position=[0,2.4,5.2] fov=42`. ambient 0.5 + directional [5,8,5] 1.2 castShadow + 기계 내부 pointLight [0,2.0,0] 0.6. OrbitControls(drei): `target=[0,1.1,0]` `enablePan={false}` `minDistance=3 maxDistance=8` `minPolarAngle=0.9 maxPolarAngle=1.5` `minAzimuthAngle=-0.7 maxAzimuthAngle=0.7`

## §5. 데이터 모델

```ts
// store.ts (zustand)
export type PlushieInstance = {
  uid: string; typeId: string; colorIndex: number
  pos: [number, number, number]
  quat?: [number, number, number, number]   // 레이아웃 복원용
}
type Store = {
  mode: 'play' | 'operator'          // 토글은 clawPhase==='IDLE'일 때만 허용
  plushies: PlushieInstance[]
  clawPhase: ClawPhase               // HUD 표시용 미러 (전이 시에만 갱신)
  credits: number; score: number; best: number   // best = 최고 누적 점수 (localStorage)
  wonThisRound: { score: number } | null
  gripStrength: number; dropChance: number       // 디버그 패널이 조절
  selectedTypeId: string             // 운영자 팔레트 선택
  toast: string | null
  // actions: setMode/setClawPhase/spendCredit/refillCredits/registerWin(uid)/
  //          addPlushie/removePlushie/setPlushies/setGrip/setDrop/setToast/...
}
```
- `registerWin(uid)`: plushies에서 제거 + `score += getType(typeId).score` + `wonThisRound` 설정 + best 갱신(localStorage 저장)
- uid 발급: 모듈 카운터 `p${++seq}`
- `components/prizeRegistry.ts`: `Map<string, RapierRigidBody>` + `register/unregister/entries` — Plushie가 마운트 시 등록, 언마운트 시 해제. 잡기 후보 탐색·레이아웃 저장이 이 맵을 읽음
- 입력 공유: `hooks/useControls.ts`가 모듈 싱글턴 `controlsState = { btnX: false, btnZ: false }`를 keydown/keyup(KEYS)으로 갱신. HUD 터치 버튼도 같은 객체를 pointerdown/up/**cancel/leave**로 갱신 (React 상태 아님 — 리렌더 유발 금지)

## §6. 상태머신 — `logic/stateMachine.ts` (순수, 테스트 필수)

```ts
export type ClawPhase = 'IDLE'|'MOVING_X'|'MOVING_Z'|'DROPPING'|'GRABBING'|'LIFTING'|'RETURNING'|'RELEASING'|'RESULT'
export type ClawSim = {
  phase: ClawPhase; x: number; y: number; z: number
  closeAmount: number                 // 0=열림 1=닫힘
  phaseT: number; roundT: number      // 현재 phase 경과 / 라운드 경과(s)
  zPressed: boolean                   // MOVING_Z에서 btnZ가 눌린 적 있는가
  holding: boolean                    // 조인트 부착 중 (컴포넌트가 설정)
  midDropAt: number | null            // 운반 진행률 임계 (컴포넌트가 설정)
  carryT: number; carryTotal: number  // 운반 진행률 계산용
}
export type ClawInput = { btnX: boolean; btnZ: boolean }
export type ClawEvent = { type: 'GRAB_NOW'|'MID_DROP'|'RELEASE_NOW'|'ROUND_END' }
export function initialSim(cfg: ClawCfg): ClawSim   // pos=home, 전부 0/false/null
export function stepClaw(sim: ClawSim, input: ClawInput, dt: number, cfg: ClawCfg): { sim: ClawSim; events: ClawEvent[] }
```
`ClawCfg`는 §3 CLAW의 구조적 타입(주입식 — 테스트에서 짧은 시간값 사용 가능).

**전이 표** (매 스텝 `phaseT += dt`; MOVING_X부터 RESULT 전까지 `roundT += dt`):

| phase | 매 스텝 동작 | 전이 |
|---|---|---|
| IDLE | pos=home, close=0 | `input.btnX` → MOVING_X (roundT=0) |
| MOVING_X | btnX 홀드 중 `x += speedX·dt` (maxX 클램프). 재홀드 허용(관대 정책) | `input.btnZ` → MOVING_Z · `roundT>limit` → DROPPING |
| MOVING_Z | btnZ 홀드 중 `z -= speedZ·dt` (minZ 클램프); btnZ면 `zPressed=true` | `zPressed && !input.btnZ` → DROPPING · `roundT>limit` → DROPPING |
| DROPPING | `y -= dropSpeed·dt` | `y<=minY` → GRABBING (y=minY 고정) |
| GRABBING | `close = min(1, phaseT/closeTime)` | `phaseT>=closeTime` → LIFTING + **GRAB_NOW**. LIFTING 진입 시 `carryT=0; carryTotal=(topY−y)/liftSpeed + dist(x,z→home)/returnSpeed` |
| LIFTING | `y += liftSpeed·dt`; `carryT += dt` | `y>=topY` → RETURNING (y=topY 고정) |
| RETURNING | home 방향 등속 `returnSpeed·dt`; `carryT += dt` | `dist<0.02` → RELEASING (pos=home 고정) + **RELEASE_NOW** |
| (LIFT·RETURN 공통) | `holding && midDropAt!==null && carryT/carryTotal>=midDropAt` → **MID_DROP** 방출 + `midDropAt=null` | |
| RELEASING | `close = 1 − min(1, phaseT/openTime)` | `phaseT >= openTime+settleTime` → RESULT + **ROUND_END** |
| RESULT | 유지 | `phaseT>=resultTime` → IDLE (zPressed/holding/midDropAt/carry* 리셋) |

**테스트 (stateMachine.test.ts)**: ① 해피패스 전체 phase 순서 (버튼 시퀀스를 dt=0.05로 시뮬) ② x/z 경계 클램프 ③ btnZ를 안 누르면 roundTimeLimit에 자동 DROPPING ④ GRAB_NOW/RELEASE_NOW/ROUND_END 정확히 1회 방출 ⑤ holding+midDropAt 설정 시 MID_DROP 1회 방출, 미설정 시 미방출 ⑥ RESULT 후 IDLE 복귀·리셋 확인.

## §7. React 물리 연동 — `components/ClawStateMachine.tsx`

- `simRef = useRef(initialSim(CLAW))`, `jointRef = useRef<ImpulseJoint|null>(null)`, 클로 RigidBody ref
- `useFrame((_, dt) )`: `mode==='operator'`면 스킵. `input = { btnX: controlsState.btnX && (phase!=='IDLE' || credits>0), btnZ: ... }` → `stepClaw` → `setNextKinematicTranslation({x,y,z})` → 손가락 close는 Claw 비주얼 ref로 전달(예: `clawVisualRef.current.close = sim.closeAmount`) → phase 변화 시에만 store 반영. IDLE→MOVING_X 전이 감지 시 `spendCredit()`
- **GRAB_NOW**: `palm = [x, y+palmOffsetY, z]`; prizeRegistry 순회 → 후보 `{uid, cx, cy, cz}` (바디 translation + y+0.25 중심 보정) → `pickNearest(palm, 후보, grabRadius)` (logic/grab.ts에 추가, 테스트: 최근접 선택·반경 밖 null·빈 배열 null) → `rollGrab(Math.random, gripStrength)` 성공 시 `createImpulseJoint(spherical({x:0,y:palmOffsetY,z:0}, {x:0,y:0.4,z:0}), clawBody, prizeBody, true)` + `holding=true` + `midDropAt=rollMidDrop(Math.random, dropChance)`
- **MID_DROP / RELEASE_NOW**: jointRef 있으면 `removeImpulseJoint(joint, true)` + null + `holding=false`
- **ROUND_END**: `wonThisRound` 읽어 toast(“🎉 {label} 획득! +{score}점” / “아쉬워요…”), 이후 RESULT→IDLE 전이에서 `wonThisRound=null`
- `ChuteSensor`: `onIntersectionEnter`에서 `other.rigidBody?.userData?.uid` → `registerWin(uid)` (RigidBody 언마운트로 제거 — 조인트는 이 시점에 항상 이미 해제됨)

## §8. SPEC.md 개정 (Phase 1 시작 전에 반영)

1. 진행 표: Phase 0 → ✅
2. **R2.5 추가**: `[T]` 라운드 시작 후 `roundTimeLimit`(20s) 초과 시 자동 하강. R2.1/R2.2에 "재홀드 허용(관대 정책)" 명시
3. **R3.1 수정**: "손바닥 센서" → "손바닥 기준 반경(`grabRadius`) 내 최근접 인형 — `[T]` `pickNearest` 순수 함수"
4. **R3.5 보강**: 승리 시 해당 인형 제거 + 타입 score 가산 명시
5. **R4.1 크레딧 경제 명시**: 시작 10, 판당 1 차감, 0이면 시작 불가, HUD "코인 채우기" 버튼으로 리필. best = 최고 누적 점수
6. **R5.1 보강**: 모드 토글은 clawPhase가 IDLE일 때만 허용
7. **R5.2 보강**: `[T]` 배치 좌표는 `clampSpawnXZ`(내부로 클램프, 배출구 구역이면 null=배치 거부)

## §9. Phase별 남은 작업 (순서대로, 각 Phase 끝에 `npm test` + `npm run build` 통과 필수)

### Phase 1 — 카탈로그 + 구덩이 (R1) ※ 진행 중
1. `npm i -D @types/three` → §8 SPEC 개정 → `config.ts`에 §3 추가
2. `catalog.test.ts`: 종류 ≥4·id 유일·parts/colliders 비어있지 않음·score/mass>0·palette 전부 `#rrggbb` 형식·`getType` 미지id throw
3. `logic/layout.ts`(+테스트): `randomInstances(rng, count)` — rng 주입, uid 제외한 결정성 테스트; 스폰은 PRIZES.spawn 범위, **배출구 구역(x<−0.7 && z>0.2) 리샘플**; `clampSpawnXZ(x,z)`; (직렬화는 Phase 5에서 확장)
4. `store.ts`(§5), `prizeRegistry.ts`, `Plushie.tsx`(RigidBody `colliders={false} linearDamping angularDamping ccd canSleep userData={{uid}}` + 카탈로그 파츠 렌더: sphere/capsule, scale/rot/slot 색), `Prizes.tsx`, `Machine.tsx`(§4), `App.tsx` 교체(§4 카메라/조명/OrbitControls 포함)
5. **DoD**: 테스트·빌드 통과. 사용자 육안 확인 요청 — 인형 20개가 안정 안착(R1.3), 벽 통과 없음(R1.1), 5종 외형 구분(R1.2)

### Phase 2 — 클로 이동 (R2)
`logic/stateMachine.ts` 테스트 먼저(§6) → 구현 → `useControls.ts`(§5 싱글턴) → `Claw.tsx`(키네마틱 바디+비주얼+갠트리) → `ClawStateMachine.tsx`(이동만, GRAB_NOW는 로그) → HUD에 임시 버튼 2개. **DoD**: 테스트 통과 + 2버튼 시퀀스로 하강·복귀 육안 확인

### Phase 3 — 잡기 (R3) ※ 최고 리스크, 폴리시보다 먼저
`pickNearest` 테스트+구현 → §7의 GRAB_NOW/MID_DROP/RELEASE_NOW 전체 → `ChuteSensor.tsx`. **DoD**: gripStrength=1로 잡기→운반→배출구 투하→registerWin까지 육안 확인, dropChance=1로 중간 낙하 확인

### Phase 4 — 게임화 + HUD (R4)
`Hud.tsx`(Canvas 밖 절대배치 오버레이): 크레딧/점수/최고점수, 안내 문구(phase별: "① 버튼으로 이동" 등), 결과 토스트, 터치 버튼 2개(pointerdown/up/cancel/leave), 코인 채우기 버튼. `DebugPanel.tsx`: gripStrength/dropChance range 슬라이더 + DEBUG 물리 토글은 config 안내 주석. best localStorage 저장/복원. **DoD**: R4 전 항목 + 무한 반복 플레이 확인

### Phase 5 — 운영자 모드 (R5)
`logic/layout.ts` 확장(+테스트): `serializeLayout(items): string` / `parseLayout(json): items|null` — version 필드, 미지 typeId 항목 drop, 라운드트립 테스트, 잘못된 JSON→null. → `OperatorController.tsx`(투명 클릭 평면 §2 참조, 클릭→`clampSpawnXZ`→y=2.0 스폰; Plushie onClick 삭제 — operator 모드에서만, stopPropagation) → `OperatorPanel.tsx`(타입 팔레트=카탈로그 label 버튼, 비우기/랜덤 채우기/저장/불러오기) → 앱 시작 시 localStorage 레이아웃 있으면 복원, 없으면 randomInstances. 저장은 prizeRegistry에서 `body.translation()/rotation()` 읽기. **DoD**: R5 전 항목 + 새로고침 복원 확인

### Phase 6 — 폴리시 + 최종 검증 (R6)
시각 다듬기(자유도 있음, 구조 변경 금지), SPEC.md 전 체크박스 확정, `npm test`/`npm run build` 최종 통과, README.md(실행법·조작법·구조 1페이지). Vercel 배포는 **사용자가 요청할 때만**.

## §10. 검증

- 각 Phase: `npm test` → `npm run build` → `npm run dev`(백그라운드) 후 **사용자에게 해당 Phase의 SPEC `[C]` 항목 육안 확인을 요청** (Sonnet은 브라우저를 볼 수 없음 — 물리 거동 판정은 사용자 몫임을 매번 명시)
- 문제 발생 시 `config.ts`의 `DEBUG_PHYSICS = true`로 콜라이더 시각화 후 진단
- 최종: 사용자 풀 플레이스루 (이동→잡기→성공/실패→배출구→점수/최고기록→운영자 배치→저장/복원)

---

## §11. 다음 작업 지시서 (2026-07-09 구현 완료)

**절대 규칙(§1)은 그대로 적용.** 아래 두 항목은 서로 독립적이라 순서 무관하게 진행 가능.

### A. 디버그 패널을 운영자 모드에서만 표시

**현황**: `src/ui/Hud.tsx` 90행 근처, `<DebugPanel />`가 mode와 무관하게 항상 렌더링됨 (현재 파일 기준 88~90행: `{mode === 'operator' && <OperatorPanel />}` 다음 줄에 무조건 `<DebugPanel />`).

**수정**: `<DebugPanel />`를 `{mode === 'operator' && <DebugPanel />}`로 감싸기만 하면 됨. **파일 1개, 1줄.** 위험 없음(순수 조건 렌더링, DebugPanel 자체 로직 무변경).

**DoD**: 플레이 모드에서는 우측 상단 디버그 슬라이더가 안 보이고, 운영자 모드로 전환하면 나타난다.

### B. 인형을 모두 뽑으면 축하 애니메이션 (2026-07-XX, 레퍼런스 확정)

**레퍼런스**: `C:\Users\admin\Downloads\plushie_celebration_overlay.html` (사용자 제작 목업). 핵심 구조: 반투명 검정 배경(뒤로 인형뽑기 기계가 은은히 보임) 위에 색종이(confetti) 애니메이션 + 중앙 카드(트로피 아이콘·제목·부제·칭호 뱃지·통계 2개·버튼). **레퍼런스의 "결과 공유하기" 버튼은 제외**하고 "다시 도전하기" 버튼만 사용. 아이콘 폰트(`ti-trophy`, `ti-crown`)는 라이선스 리스크 제로 원칙상 이모지(🏆/👑)로 대체.

**현황**: `src/store.ts`의 `registerWin(uid)`(98~116행)가 승리 시 `plushies`에서 해당 인형을 제거하고 점수/최고기록을 갱신함. 인형이 0개가 됐는지 여부는 어디서도 확인하지 않음. 운영자 모드의 "비우기"(`OperatorPanel.tsx`, `setPlushies([])`)도 `plushies`를 0개로 만들 수 있는데, 이건 "다 뽑은" 것이 아니라 운영자가 수동으로 지운 것이므로 축하 애니메이션이 뜨면 안 됨 — **`registerWin` 내부에서만 감지해야 함**.

**문구 세트** (사용자 제공, 그대로 사용 — 표시될 때마다 하나를 무작위로 골라 보여줌):
```ts
const CELEBRATION_SETS = [
  { title: '인형이... 모두 사라졌다?!', subtitle: '당신은 이 기계를 정복했습니다', badge: '인형뽑기 지배자' },
  { title: '기계가 텅 비었습니다', subtitle: '사장님도 몰랐던 고수의 등장', badge: '숨은 고수' },
  { title: '인형: 저 이제 여기 없어요', subtitle: '집게 하나로 여기까지 오다니', badge: '집게의 신' },
  { title: '완판! 매진! 클리어!', subtitle: '이 정도면 사장님이 울고 갈 실력', badge: '매장 최고 고객' },
  { title: '인형들의 대탈출은 실패했다', subtitle: '전부 당신 손에 붙잡혔습니다', badge: '인형뽑기 마스터' },
]
```

**설계**
1. `src/store.ts`
   - `Store` 타입에 필드 추가: `showCelebration: boolean`(초기 `false`), `roundsPlayed: number`(초기 `0`, "시도 횟수" 표시용)
   - 액션 추가: `dismissCelebration: () => set({ showCelebration: false })`, `retryChallenge: () => void`
   - `registerWin` 내부: 필터링된 새 `plushies` 배열이 `length === 0`이면 반환 객체에 `showCelebration: true` 포함
   - `spendCredit`을 확장해 라운드 시작마다 `roundsPlayed`도 함께 증가시킴 (이미 `IDLE→MOVING` 전이 시 정확히 1회 호출되는 지점이라 `ClawStateMachine.tsx` 수정 없이 여기 한 곳만 고치면 됨):
     ```ts
     spendCredit: () => set((s) => ({ credits: Math.max(0, s.credits - 1), roundsPlayed: s.roundsPlayed + 1 })),
     ```
   - `retryChallenge`: 점수·시도횟수 리셋 + 인형 랜덤 재채움 + 오버레이 닫기 (이미 `initialPlushies()`에서 쓰는 `randomInstances`/`nextUid`/`PRIZES` 재사용, import 추가 불필요):
     ```ts
     retryChallenge: () =>
       set(() => ({
         score: 0,
         roundsPlayed: 0,
         showCelebration: false,
         plushies: randomInstances(Math.random, PRIZES.count).map((inst) => ({ ...inst, uid: nextUid() })),
       })),
     ```
     **주의**: `best`(최고기록)와 `credits`는 리셋하지 않음 — 사용자가 "점수와 인형"만 리셋해달라고 명시함.
2. `src/ui/Celebration.tsx` (신규)
   - `CELEBRATION_SETS`를 이 파일에 상수로 정의, 마운트 시 `useMemo(() => 랜덤 선택, [])`로 1개 고정(재렌더에도 안 바뀌게)
   - 최상위: `position:fixed inset:0`, 배경 `rgba(0,0,0,0.55)`(반투명 — 뒤 3D 기계가 비쳐 보임), `pointerEvents:'auto'`, flex center. 이 배경 클릭 시 `onDismiss()`(닫기만, 리셋 없음 — 운영자가 직접 수습하고 싶을 때의 탈출구)
   - 색종이 레이어: 배경 바로 위, `position:absolute inset:0 pointerEvents:'none'`, 40~45개 `<div>`를 `useMemo`로 생성(랜덤 left%/색상 5종/딜레이/지속시간/크기/회전), 카드보다 뒤(카드에 z-index 부여)
   - 카드(`onClick`에 `e.stopPropagation()` — 배경 클릭 닫힘과 분리): 다크 테마에 맞춰 `#232342`류 배경, 반경 16px, 최대폭 340px, 중앙정렬
     - 🏆 (40px 정도) → `{set.title}` → `{set.subtitle}` → 칭호 뱃지 "👑 칭호 획득: {set.badge}" (금색 pill, 기존 `refillButtonStyle`과 동일한 `#ffd166`/`#3a2a00` 배색 재사용)
     - 통계 2칸(flex row): "시도 횟수 / {roundsPlayed}회", "최종 점수 / {score}" — `useStore`로 구독
     - 버튼 1개만: "다시 도전하기" → `onRetry`(=store의 `retryChallenge`) 호출. **공유 버튼 없음**
   - 자동 닫힘 타이머 없음 — 사용자가 버튼(또는 배경 클릭)으로 명시적으로 닫아야 함(레퍼런스에 타이머 없음)
   - confetti `@keyframes`는 `index.html`의 기존 `<style>` 블록에 추가(이미 미디어쿼리 있는 곳과 동일 패턴): `@keyframes confetti-fall { to { transform: translateY(480px) rotate(720deg); opacity: 0; } }`
3. `src/ui/Hud.tsx`
   - `showCelebration`, `dismissCelebration`, `retryChallenge`를 store에서 구독
   - 플레이 모드의 방향패드+하강버튼 행(`controlsRowStyle` 블록)은 `mode === 'play' && !showCelebration`으로 조건 강화(기계가 빈 상태에서 조작 UI가 겹쳐 보이지 않게)
   - 맨 마지막에 `{showCelebration && <Celebration onRetry={retryChallenge} onDismiss={dismissCelebration} />}` 추가(다른 오버레이보다 위에 쌓이도록 렌더 순서상 마지막에 배치)
4. `SPEC.md` R4.5/R4.6 갱신 (아래 참고, 이미 반영됨)

**변경 범위**: 파일 4개(`store.ts`, `Hud.tsx`, `index.html`, 신규 `Celebration.tsx`) + `SPEC.md`. 위험 낮음 — 게임 로직·물리 무관, 순수 UI 오버레이. `ClawStateMachine.tsx`는 무변경(위 `spendCredit` 재사용 트릭 덕분).

**검증**
- `npm test`/`npm run build` 통과 확인
- 브라우저: 운영자 모드에서 인형 1개만 남기고 플레이 모드로 전환 → gripStrength=1로 마지막 인형까지 뽑기 → 축하 오버레이 표시 확인(반투명 배경 뒤로 기계가 보이는지, 색종이가 떨어지는지, 문구/칭호/통계가 매번 다른 세트로 나오는지)
- "다시 도전하기" 클릭 → 점수 0, 시도횟수 0, 인형 `PRIZES.count`개로 재채움, `best`/`credits`는 그대로인지 확인
- 배경(카드 바깥) 클릭 시 리셋 없이 그냥 닫히는지 확인
- 운영자 모드 "비우기" 클릭 시에는 축하 오버레이가 뜨지 않는지 확인(승리로 인한 소진만 트리거)
