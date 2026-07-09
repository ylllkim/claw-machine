import type { CSSProperties } from 'react'
import { CATALOG } from '../catalog'
import { allPrizeBodies } from '../components/prizeRegistry'
import { PRIZES, STORAGE } from '../config'
import { parseLayout, randomInstances, serializeLayout } from '../logic/layout'
import { nextUid, useStore } from '../store'

export default function OperatorPanel() {
  const selectedTypeId = useStore((s) => s.selectedTypeId)
  const setSelectedTypeId = useStore((s) => s.setSelectedTypeId)
  const plushies = useStore((s) => s.plushies)
  const setPlushies = useStore((s) => s.setPlushies)

  function handleClear() {
    setPlushies([])
  }

  function handleRandomFill() {
    setPlushies(randomInstances(Math.random, PRIZES.count).map((inst) => ({ ...inst, uid: nextUid() })))
  }

  /** 현재 안착된(물리 바디의 실제) 위치·회전을 읽어 저장 — 스폰 시점 좌표가 아니라 정착된 좌표 (PLAN §9) */
  function handleSave() {
    const entries = plushies.flatMap((p) => {
      const body = allPrizeBodies().get(p.uid)
      if (!body) return []
      const t = body.translation()
      const q = body.rotation()
      return [
        {
          typeId: p.typeId,
          colorIndex: p.colorIndex,
          pos: [t.x, t.y, t.z] as [number, number, number],
          quat: [q.x, q.y, q.z, q.w] as [number, number, number, number],
        },
      ]
    })
    try {
      localStorage.setItem(STORAGE.layout, serializeLayout(entries))
    } catch {
      // localStorage 사용 불가 환경 — 조용히 무시
    }
  }

  function handleLoad() {
    let raw: string | null = null
    try {
      raw = localStorage.getItem(STORAGE.layout)
    } catch {
      return
    }
    if (!raw) return
    const entries = parseLayout(raw)
    if (!entries) return
    setPlushies(entries.map((entry) => ({ ...entry, uid: nextUid() })))
  }

  return (
    <div style={panelStyle}>
      <div style={titleStyle}>운영자 모드 · 기계 내부 클릭으로 배치, 인형 클릭으로 삭제</div>
      <div style={paletteStyle}>
        {CATALOG.map((t) => (
          <button
            key={t.id}
            onClick={() => setSelectedTypeId(t.id)}
            style={{
              ...paletteButtonStyle,
              border: selectedTypeId === t.id ? '2px solid #ffd166' : '2px solid transparent',
            }}
          >
            {t.label}
          </button>
        ))}
      </div>
      <div style={rowStyle}>
        <button style={actionButtonStyle} onClick={handleClear}>
          비우기
        </button>
        <button style={actionButtonStyle} onClick={handleRandomFill}>
          랜덤 채우기
        </button>
        <button style={actionButtonStyle} onClick={handleSave}>
          저장
        </button>
        <button style={actionButtonStyle} onClick={handleLoad}>
          불러오기
        </button>
      </div>
    </div>
  )
}

const panelStyle: CSSProperties = {
  position: 'absolute',
  bottom: 24,
  left: '50%',
  transform: 'translateX(-50%)',
  pointerEvents: 'auto',
  background: 'rgba(0,0,0,0.6)',
  borderRadius: 10,
  padding: '12px 16px',
  color: '#fff',
  fontSize: 13,
  maxWidth: 560,
}

const titleStyle: CSSProperties = {
  fontWeight: 700,
  marginBottom: 8,
  textAlign: 'center',
}

const paletteStyle: CSSProperties = {
  display: 'flex',
  gap: 8,
  justifyContent: 'center',
  marginBottom: 10,
  flexWrap: 'wrap',
}

const paletteButtonStyle: CSSProperties = {
  padding: '6px 12px',
  borderRadius: 16,
  background: 'rgba(255,255,255,0.15)',
  color: '#fff',
  fontSize: 13,
  cursor: 'pointer',
}

const rowStyle: CSSProperties = {
  display: 'flex',
  gap: 8,
  justifyContent: 'center',
}

const actionButtonStyle: CSSProperties = {
  padding: '8px 14px',
  borderRadius: 8,
  border: 'none',
  background: '#ffd166',
  color: '#3a2a00',
  fontWeight: 700,
  fontSize: 13,
  cursor: 'pointer',
}
