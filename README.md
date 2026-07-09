# 인형뽑기 (Claw Machine)

3D 인형뽑기 게임. React Three Fiber + Rapier 물리엔진으로 구현한 사내 교육용 바이브 코딩 프로젝트.

## 실행법

```bash
npm install
npm run dev       # http://localhost:5173
npm test          # vitest (순수 로직 42개)
npm run build     # 프로덕션 빌드 (dist/)
```

의존성은 전부 MIT/Apache-2.0(React·Three.js·R3F·Rapier·zustand)이며 별도 설치/에디터 없이 `npm install`만으로 동작합니다.

## 조작법

정통 일본식 2버튼 방식입니다.

1. **① 버튼(키보드 →/Z, 화면 좌측 버튼)** 을 누르는 동안 클로가 좌우(X)로 이동
2. ①을 놓고 **② 버튼(키보드 ↑/X, 화면 우측 버튼)** 을 누르는 동안 앞뒤(Z)로 이동
3. ②를 놓으면 자동으로 하강 → 손가락이 닫히며 확률적으로 인형을 잡음 → 상승 → 원위치 복귀 → 배출구 위에서 놓음
4. 인형이 배출구 센서를 통과하면 승리, 점수와 최고 기록(localStorage)에 반영

라운드 시작 후 20초 안에 ②를 누르지 않으면 자동으로 하강합니다.

### 디버그 패널 (우측 상단)
- **그립 강도**: 잡기 성공 확률
- **중간 낙하율**: 운반 중 확률적으로 놓칠 확률

### 운영자 모드 (좌측 상단 토글, 클로가 IDLE일 때만 전환 가능)
- 팔레트에서 인형 종류 선택 → 기계 내부 클릭으로 배치, 인형 클릭으로 삭제
- 비우기 / 랜덤 채우기
- 저장(현재 안착된 위치·회전을 localStorage에 기록) / 불러오기

## 구조

```
src/
├─ config.ts           # 모든 튜닝값 (크기·속도·확률 등)
├─ catalog.ts           # 인형 종류 데이터 (곰돌이·토끼·고양이·펭귄·병아리)
├─ store.ts             # zustand 전역 상태 (게임 진행·크레딧·운영자 모드)
├─ logic/               # 순수 함수 — Three.js/Rapier 미의존, vitest 대상
│  ├─ stateMachine.ts   #   클로 상태머신 (IDLE→...→RESULT→IDLE)
│  ├─ grab.ts           #   잡기 확률 판정, 최근접 후보 탐색
│  └─ layout.ts         #   인형 배치 생성, 레이아웃 직렬화/역직렬화
├─ components/          # R3F + Rapier 3D 컴포넌트 (기계, 클로, 인형, 센서)
├─ hooks/useControls.ts # 키보드/터치 공용 입력 상태
└─ ui/                  # HTML 오버레이 (HUD, 디버그 패널, 운영자 패널)
```

`SPEC.md`에 전체 수용 기준과 검증 현황, `PLAN.md`/`DECISIONS.md`에 구현 지시서와 설계 결정 근거가 정리되어 있습니다.

## 배포

1차 목표는 로컬 실행이며, Vercel 등 정적 호스팅 배포는 필요 시 `vite build` 결과물(`dist/`)을 그대로 올리면 됩니다(별도 서버 설정 불필요).
