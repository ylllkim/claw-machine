import { useEffect } from 'react'
import { KEYS } from '../config'

export type ControlsState = { btnX: boolean; btnZ: boolean }

/**
 * 모듈 싱글턴 — React 상태가 아님(리렌더 유발 금지).
 * 키보드(useControls)와 HUD 터치 버튼이 동일 객체를 갱신하고,
 * ClawStateMachine의 useFrame이 매 프레임 읽는다.
 */
export const controlsState: ControlsState = { btnX: false, btnZ: false }

// 개발 중 자동화/콘솔 디버깅용 (프로덕션 빌드에서는 제외됨)
if (import.meta.env.DEV) {
  ;(globalThis as Record<string, unknown>).__clawControls = controlsState
}

function matches(code: string, list: readonly string[]): boolean {
  return list.includes(code)
}

/** 키보드 입력을 controlsState에 연결. 앱 최상위에서 1회 호출. */
export function useControls(): void {
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (matches(e.code, KEYS.btnX)) controlsState.btnX = true
      if (matches(e.code, KEYS.btnZ)) controlsState.btnZ = true
    }
    const onKeyUp = (e: KeyboardEvent) => {
      if (matches(e.code, KEYS.btnX)) controlsState.btnX = false
      if (matches(e.code, KEYS.btnZ)) controlsState.btnZ = false
    }
    // Alt-Tab 등으로 포커스를 잃으면 keyup을 받지 못해 버튼이 눌린 채 고착될 수 있음 — 리셋
    const onBlur = () => {
      controlsState.btnX = false
      controlsState.btnZ = false
    }
    window.addEventListener('keydown', onKeyDown)
    window.addEventListener('keyup', onKeyUp)
    window.addEventListener('blur', onBlur)
    return () => {
      window.removeEventListener('keydown', onKeyDown)
      window.removeEventListener('keyup', onKeyUp)
      window.removeEventListener('blur', onBlur)
    }
  }, [])
}

/** 화면 터치 버튼이 사용하는 setter */
export function setTouchButton(btn: keyof ControlsState, pressed: boolean): void {
  controlsState[btn] = pressed
}
