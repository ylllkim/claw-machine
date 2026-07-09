import type { CSSProperties } from 'react'
import { controlsState, type ControlsState } from '../hooks/useControls'
import { useStore, type ClawPhase } from '../store'
import DebugPanel from './DebugPanel'
import OperatorPanel from './OperatorPanel'

const PHASE_HINT: Record<ClawPhase, string> = {
  IDLE: '① 버튼으로 이동을 시작하세요',
  MOVING_X: '① 홀드: 좌우 이동 · ②를 누르면 앞뒤 이동으로 전환',
  MOVING_Z: '② 홀드: 앞뒤 이동 · 놓으면 자동으로 내려갑니다',
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
        <div style={buttonRowStyle}>
          <button {...bind('btnX')} style={buttonStyle}>
            ① 이동
          </button>
          <button {...bind('btnZ')} style={buttonStyle}>
            ② 이동/하강
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

const buttonRowStyle: CSSProperties = {
  position: 'absolute',
  bottom: 24,
  left: 0,
  right: 0,
  display: 'flex',
  justifyContent: 'center',
  gap: 24,
  pointerEvents: 'auto',
}

const buttonStyle: CSSProperties = {
  width: 100,
  height: 100,
  borderRadius: '50%',
  border: '2px solid rgba(255,255,255,0.6)',
  background: 'rgba(255,255,255,0.15)',
  color: '#fff',
  fontSize: 14,
  touchAction: 'none',
  userSelect: 'none',
}
