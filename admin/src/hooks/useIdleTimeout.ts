import { useEffect, useRef } from 'react'

const DEFAULT_TIMEOUT_MS = 15 * 60 * 1000
const ACTIVITY_EVENTS = ['mousedown', 'keydown', 'scroll', 'touchstart'] as const

/**
 * Logs the user out after a period of inactivity — limits the exposure
 * window of a logged-in-but-unattended admin session.
 */
export function useIdleTimeout(onIdle: () => void, timeoutMs: number = DEFAULT_TIMEOUT_MS): void {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    const reset = () => {
      if (timerRef.current) clearTimeout(timerRef.current)
      timerRef.current = setTimeout(onIdle, timeoutMs)
    }

    reset()
    ACTIVITY_EVENTS.forEach((event) => window.addEventListener(event, reset))

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
      ACTIVITY_EVENTS.forEach((event) => window.removeEventListener(event, reset))
    }
  }, [onIdle, timeoutMs])
}
