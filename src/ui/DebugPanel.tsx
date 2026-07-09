import type { CSSProperties, KeyboardEvent } from 'react'
import { useStore } from '../store'

/**
 * gripStrength/dropChance 실시간 조절 (R4.3).
 * range input 포커스 중 방향키가 클로 조작(window keydown 리스너)로도 전파되는 걸 막기 위해
 * onKeyDown에서 stopPropagation — 슬라이더 조작과 클로 이동이 동시에 반응하는 충돌 방지.
 */
function stopKeyBubble(e: KeyboardEvent<HTMLInputElement>) {
  e.stopPropagation()
}

export default function DebugPanel() {
  const gripStrength = useStore((s) => s.gripStrength)
  const dropChance = useStore((s) => s.dropChance)
  const setGrip = useStore((s) => s.setGrip)
  const setDrop = useStore((s) => s.setDrop)

  return (
    <div className="debug-panel" style={panelStyle}>
      <div style={titleStyle}>디버그</div>
      <label style={rowStyle}>
        <span>그립 강도 {gripStrength.toFixed(2)}</span>
        <input
          type="range"
          min={0}
          max={1}
          step={0.05}
          value={gripStrength}
          onChange={(e) => setGrip(Number(e.target.value))}
          onKeyDown={stopKeyBubble}
        />
      </label>
      <label style={rowStyle}>
        <span>중간 낙하율 {dropChance.toFixed(2)}</span>
        <input
          type="range"
          min={0}
          max={1}
          step={0.05}
          value={dropChance}
          onChange={(e) => setDrop(Number(e.target.value))}
          onKeyDown={stopKeyBubble}
        />
      </label>
    </div>
  )
}

const panelStyle: CSSProperties = {
  position: 'absolute',
  top: 12,
  right: 12,
  width: 200,
  background: 'rgba(0,0,0,0.55)',
  borderRadius: 8,
  padding: '10px 12px',
  fontSize: 12,
  color: '#fff',
  pointerEvents: 'auto',
}

const titleStyle: CSSProperties = {
  fontWeight: 700,
  marginBottom: 6,
  opacity: 0.8,
}

const rowStyle: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 2,
  marginTop: 6,
}
