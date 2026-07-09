import { useState, type CSSProperties } from 'react'
import { controlsState, type ControlsState } from '../hooks/useControls'
import { useStore, type ClawPhase } from '../store'
import DebugPanel from './DebugPanel'
import OperatorPanel from './OperatorPanel'

const PHASE_HINT: Record<ClawPhase, string> = {
  IDLE: '방향키로 이동을 시작하세요',
  MOVING: '방향키로 이동 · 하강 버튼을 누르면 내려갑니다',
  DROPPING: '클로가 내려가는 중...',
  GRABBING: '잡는 중...',
  LIFTING: '들어올리는 중...',
  RETURNING: '복귀하는 중...',
  RELEASING: '내려놓는 중...',
  RESULT: '',
}

function bind(btn: keyof ControlsState) {
  return {
    onPointerDown: () => {
      controlsState[btn] = true
    },
    onPointerUp: () => {
      controlsState[btn] = false
    },
    onPointerCancel: () => {
      controlsState[btn] = false
    },
    onPointerLeave: () => {
      controlsState[btn] = false
    },
  }
}

export default function Hud() {
  const clawPhase = useStore((s) => s.clawPhase)
  const credits = useStore((s) => s.credits)
  const score = useStore((s) => s.score)
  const best = useStore((s) => s.best)
  const wonThisRound = useStore((s) => s.wonThisRound)
  const refillCredits = useStore((s) => s.refillCredits)
  const mode = useStore((s) => s.mode)
  const setMode = useStore((s) => s.setMode)
  const [showHelp, setShowHelp] = useState(false)

  const resultText = wonThisRound
    ? `🎉 ${wonThisRound.label} 획득! +${wonThisRound.score}점`
    : '아쉬워요... 다음 기회에!'

  return (
    <div style={overlayStyle}>
      <div style={statusStyle}>
        <div>점수: {score} · 최고: {best}</div>
        <div>크레딧: {credits}</div>
      </div>

      <button
        style={modeToggleStyle}
        disabled={clawPhase !== 'IDLE'}
        onClick={() => setMode(mode === 'play' ? 'operator' : 'play')}
      >
        {mode === 'play' ? '🔧 운영자 모드' : '🎮 플레이 모드'}
      </button>

      <button style={helpToggleStyle} onClick={() => setShowHelp((v) => !v)}>
        ❓ 조작법
      </button>

      {showHelp && (
        <div style={helpPanelStyle}>
          <div>방향키 / WASD — 클로 이동 (동시 입력 시 대각선)</div>
          <div>Space / X — 하강 (원하는 위치에서 직접 눌러야 함)</div>
          <div>좌측 상단 버튼 — 운영자 모드 전환 (클로가 멈춰있을 때만)</div>
          <div>우측 상단 슬라이더 — 잡기 성공률 / 중간 낙하율 디버그</div>
        </div>
      )}

      {mode === 'play' && (
        <div style={hintStyle}>
          {clawPhase === 'RESULT' ? resultText : PHASE_HINT[clawPhase]}
        </div>
      )}

      {credits === 0 && clawPhase === 'IDLE' && (
        <button style={refillButtonStyle} onClick={() => refillCredits()}>
          🪙 코인 채우기
        </button>
      )}

      {mode === 'play' && (
        <div style={controlsRowStyle}>
          <div style={dpadGridStyle}>
            <button {...bind('up')} style={{ ...dpadButtonStyle, gridColumn: 2, gridRow: 1 }}>
              ↑<span style={keyLabelStyle}>W</span>
            </button>
            <button {...bind('left')} style={{ ...dpadButtonStyle, gridColumn: 1, gridRow: 2 }}>
              ←<span style={keyLabelStyle}>A</span>
            </button>
            <button {...bind('right')} style={{ ...dpadButtonStyle, gridColumn: 3, gridRow: 2 }}>
              →<span style={keyLabelStyle}>D</span>
            </button>
            <button {...bind('down')} style={{ ...dpadButtonStyle, gridColumn: 2, gridRow: 3 }}>
              ↓<span style={keyLabelStyle}>S</span>
            </button>
          </div>
          <button {...bind('drop')} style={dropButtonStyle}>
            하강
            <span style={keyLabelStyle}>Space</span>
          </button>
        </div>
      )}

      {mode === 'operator' && <OperatorPanel />}

      <DebugPanel />
    </div>
  )
}

const overlayStyle: CSSProperties = {
  position: 'fixed',
  inset: 0,
  pointerEvents: 'none',
  color: '#fff',
  fontFamily: 'system-ui, -apple-system, "Malgun Gothic", sans-serif',
}

const statusStyle: CSSProperties = {
  position: 'absolute',
  top: 12,
  left: 12,
  background: 'rgba(0,0,0,0.5)',
  padding: '8px 14px',
  borderRadius: 8,
  fontSize: 14,
  lineHeight: 1.6,
}

const hintStyle: CSSProperties = {
  position: 'absolute',
  top: 12,
  left: '50%',
  transform: 'translateX(-50%)',
  background: 'rgba(0,0,0,0.5)',
  padding: '8px 16px',
  borderRadius: 8,
  fontSize: 15,
  fontWeight: 600,
  textAlign: 'center',
  maxWidth: '80%',
}

const modeToggleStyle: CSSProperties = {
  position: 'absolute',
  top: 76,
  left: 12,
  pointerEvents: 'auto',
  padding: '6px 12px',
  borderRadius: 8,
  border: 'none',
  background: 'rgba(255,255,255,0.15)',
  color: '#fff',
  fontSize: 13,
  cursor: 'pointer',
}

const helpToggleStyle: CSSProperties = {
  position: 'absolute',
  top: 118,
  left: 12,
  pointerEvents: 'auto',
  padding: '6px 12px',
  borderRadius: 8,
  border: 'none',
  background: 'rgba(255,255,255,0.15)',
  color: '#fff',
  fontSize: 13,
  cursor: 'pointer',
}

const helpPanelStyle: CSSProperties = {
  position: 'absolute',
  top: 156,
  left: 12,
  width: 260,
  background: 'rgba(0,0,0,0.75)',
  borderRadius: 8,
  padding: '10px 14px',
  fontSize: 12,
  lineHeight: 1.7,
  pointerEvents: 'auto',
}

const refillButtonStyle: CSSProperties = {
  position: 'absolute',
  top: 70,
  left: '50%',
  transform: 'translateX(-50%)',
  pointerEvents: 'auto',
  padding: '8px 18px',
  borderRadius: 20,
  border: 'none',
  background: '#ffd166',
  color: '#3a2a00',
  fontSize: 14,
  fontWeight: 700,
  cursor: 'pointer',
}

const controlsRowStyle: CSSProperties = {
  position: 'absolute',
  bottom: 24,
  left: 0,
  right: 0,
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  gap: 32,
  pointerEvents: 'auto',
}

const dpadGridStyle: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(3, 56px)',
  gridTemplateRows: 'repeat(3, 56px)',
  gap: 6,
}

const dpadButtonStyle: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  borderRadius: 10,
  border: '2px solid rgba(255,255,255,0.6)',
  background: 'rgba(255,255,255,0.15)',
  color: '#fff',
  fontSize: 20,
  touchAction: 'none',
  userSelect: 'none',
}

const dropButtonStyle: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  width: 90,
  height: 90,
  borderRadius: '50%',
  border: '2px solid rgba(255,255,255,0.6)',
  background: '#e8747c',
  color: '#fff',
  fontSize: 16,
  fontWeight: 700,
  touchAction: 'none',
  userSelect: 'none',
}

const keyLabelStyle: CSSProperties = {
  fontSize: 10,
  fontWeight: 400,
  opacity: 0.75,
  marginTop: 2,
}
