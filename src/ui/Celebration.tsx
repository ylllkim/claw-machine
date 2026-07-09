import { useMemo, type CSSProperties } from 'react'
import { useStore } from '../store'

const CELEBRATION_SETS = [
  { title: '인형이... 모두 사라졌다?!', subtitle: '당신은 이 기계를 정복했습니다', badge: '인형뽑기 지배자' },
  { title: '기계가 텅 비었습니다', subtitle: '사장님도 몰랐던 고수의 등장', badge: '숨은 고수' },
  { title: '인형: 저 이제 여기 없어요', subtitle: '집게 하나로 여기까지 오다니', badge: '집게의 신' },
  { title: '완판! 매진! 클리어!', subtitle: '이 정도면 사장님이 울고 갈 실력', badge: '매장 최고 고객' },
  { title: '인형들의 대탈출은 실패했다', subtitle: '전부 당신 손에 붙잡혔습니다', badge: '인형뽑기 마스터' },
]

const CONFETTI_COLORS = ['#D85A30', '#378ADD', '#EF9F27', '#639922', '#D4537E']
const CONFETTI_COUNT = 42

type ConfettiPiece = {
  left: number
  color: string
  delay: number
  duration: number
  size: number
  rotation: number
}

export default function Celebration({ onRetry, onDismiss }: { onRetry: () => void; onDismiss: () => void }) {
  const roundsPlayed = useStore((s) => s.roundsPlayed)
  const score = useStore((s) => s.score)

  const set = useMemo(() => CELEBRATION_SETS[Math.floor(Math.random() * CELEBRATION_SETS.length)], [])

  const confetti = useMemo<ConfettiPiece[]>(
    () =>
      Array.from({ length: CONFETTI_COUNT }, () => ({
        left: Math.random() * 100,
        color: CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)],
        delay: Math.random() * 1.5,
        duration: 2.5 + Math.random() * 1.5,
        size: 6 + Math.random() * 5,
        rotation: Math.random() * 360,
      })),
    [],
  )

  return (
    <div style={backdropStyle} onClick={onDismiss}>
      <div style={confettiLayerStyle}>
        {confetti.map((p, i) => (
          <div
            key={i}
            style={{
              position: 'absolute',
              top: -20,
              left: `${p.left}%`,
              width: p.size,
              height: p.size * 0.4,
              background: p.color,
              opacity: 0.85,
              transform: `rotate(${p.rotation}deg)`,
              animation: `confetti-fall ${p.duration}s linear ${p.delay}s infinite`,
            }}
          />
        ))}
      </div>

      <div style={cardStyle} onClick={(e) => e.stopPropagation()}>
        <div style={{ fontSize: 40, marginBottom: 8 }}>🏆</div>
        <p style={titleStyle}>{set.title}</p>
        <p style={subtitleStyle}>{set.subtitle}</p>

        <div style={badgeStyle}>👑 칭호 획득: {set.badge}</div>

        <div style={statsRowStyle}>
          <div style={statBoxStyle}>
            <p style={statLabelStyle}>시도 횟수</p>
            <p style={statValueStyle}>{roundsPlayed}회</p>
          </div>
          <div style={statBoxStyle}>
            <p style={statLabelStyle}>최종 점수</p>
            <p style={statValueStyle}>{score}</p>
          </div>
        </div>

        <button style={retryButtonStyle} onClick={onRetry}>
          다시 도전하기
        </button>
      </div>
    </div>
  )
}

const backdropStyle: CSSProperties = {
  position: 'fixed',
  inset: 0,
  background: 'rgba(0,0,0,0.55)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  pointerEvents: 'auto',
  overflow: 'hidden',
  zIndex: 10,
}

const confettiLayerStyle: CSSProperties = {
  position: 'absolute',
  inset: 0,
  pointerEvents: 'none',
}

const cardStyle: CSSProperties = {
  position: 'relative',
  zIndex: 2,
  background: '#232342',
  borderRadius: 16,
  padding: '2rem 2.5rem',
  textAlign: 'center',
  maxWidth: 340,
  color: '#fff',
  fontFamily: 'system-ui, -apple-system, "Malgun Gothic", sans-serif',
}

const titleStyle: CSSProperties = {
  fontSize: 18,
  fontWeight: 600,
  margin: '0 0 4px',
}

const subtitleStyle: CSSProperties = {
  fontSize: 14,
  color: 'rgba(255,255,255,0.7)',
  margin: '0 0 20px',
}

const badgeStyle: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 6,
  background: '#ffd166',
  color: '#3a2a00',
  fontSize: 13,
  fontWeight: 700,
  padding: '6px 14px',
  borderRadius: 999,
  marginBottom: 20,
}

const statsRowStyle: CSSProperties = {
  display: 'flex',
  gap: 12,
  marginBottom: 20,
}

const statBoxStyle: CSSProperties = {
  flex: 1,
  background: 'rgba(255,255,255,0.08)',
  borderRadius: 10,
  padding: 12,
}

const statLabelStyle: CSSProperties = {
  fontSize: 12,
  color: 'rgba(255,255,255,0.7)',
  margin: '0 0 2px',
}

const statValueStyle: CSSProperties = {
  fontSize: 20,
  fontWeight: 600,
  margin: 0,
}

const retryButtonStyle: CSSProperties = {
  width: '100%',
  padding: '10px 0',
  borderRadius: 10,
  border: 'none',
  background: '#ffd166',
  color: '#3a2a00',
  fontSize: 14,
  fontWeight: 700,
  cursor: 'pointer',
}
