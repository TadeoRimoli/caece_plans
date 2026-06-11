import { useState, useCallback, useRef } from "react"

export interface CanvasState {
  scale: number
  position: { x: number; y: number }
  isDragging: boolean
}

const MIN_SCALE = 0.25
const MAX_SCALE = 2.5
const DEFAULT_SCALE = 1

function normalizeWheelDelta(e: WheelEvent): number {
  let delta = e.deltaY
  if (e.deltaMode === WheelEvent.DOM_DELTA_LINE) delta *= 16
  else if (e.deltaMode === WheelEvent.DOM_DELTA_PAGE) delta *= 120
  return delta
}

type TouchPoint = { clientX: number; clientY: number }

function getTouchDistance(t1: TouchPoint, t2: TouchPoint) {
  return Math.hypot(t2.clientX - t1.clientX, t2.clientY - t1.clientY)
}

function getTouchMidpoint(t1: TouchPoint, t2: TouchPoint, rect: DOMRect) {
  return {
    x: (t1.clientX + t2.clientX) / 2 - rect.left,
    y: (t1.clientY + t2.clientY) / 2 - rect.top,
  }
}

export function useCanvas(initialScale = DEFAULT_SCALE) {
  const [scale, setScale] = useState(initialScale)
  const [position, setPosition] = useState({ x: 0, y: 0 })
  const [isDragging, setIsDragging] = useState(false)

  const dragStartRef = useRef({ x: 0, y: 0 })
  const rafRef = useRef<number | null>(null)
  const pinchStartRef = useRef<{
    distance: number
    scale: number
    midX: number
    midY: number
  } | null>(null)
  const containerRef = useRef<HTMLDivElement | null>(null)

  const zoomAtCenter = useCallback((multiplier: number) => {
    const rect = containerRef.current?.getBoundingClientRect()
    if (!rect) return

    setScale((prev) => {
      const next = Math.max(MIN_SCALE, Math.min(MAX_SCALE, prev * multiplier))
      if (next === prev) return prev

      const ratio = next / prev
      const px = rect.width / 2
      const py = rect.height / 2
      setPosition((pos) => ({
        x: px - ratio * (px - pos.x),
        y: py - ratio * (py - pos.y),
      }))
      return next
    })
  }, [])

  const zoomIn = useCallback(() => zoomAtCenter(1.25), [zoomAtCenter])
  const zoomOut = useCallback(() => zoomAtCenter(1 / 1.25), [zoomAtCenter])

  const handleWheel = useCallback((e: WheelEvent) => {
    e.preventDefault()

    const rect = containerRef.current?.getBoundingClientRect()
    if (!rect) return

    const delta = normalizeWheelDelta(e)
    const pointX = e.clientX - rect.left
    const pointY = e.clientY - rect.top

    const intensity = e.ctrlKey ? 0.012 : 0.003
    const factor = Math.exp(-delta * intensity)

    setScale((prevScale) => {
      const nextScale = Math.max(MIN_SCALE, Math.min(MAX_SCALE, prevScale * factor))
      if (nextScale === prevScale) return prevScale

      const ratio = nextScale / prevScale
      setPosition((prev) => ({
        x: pointX - ratio * (pointX - prev.x),
        y: pointY - ratio * (pointY - prev.y),
      }))
      return nextScale
    })
  }, [])

  const handleDragStart = useCallback(
    (clientX: number, clientY: number) => {
      setIsDragging(true)
      dragStartRef.current = {
        x: clientX - position.x,
        y: clientY - position.y,
      }
    },
    [position]
  )

  const handleDragMove = useCallback(
    (clientX: number, clientY: number) => {
      if (!isDragging) return

      if (rafRef.current) cancelAnimationFrame(rafRef.current)

      rafRef.current = requestAnimationFrame(() => {
        setPosition({
          x: clientX - dragStartRef.current.x,
          y: clientY - dragStartRef.current.y,
        })
      })
    },
    [isDragging]
  )

  const handleDragEnd = useCallback(() => {
    setIsDragging(false)
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current)
      rafRef.current = null
    }
    pinchStartRef.current = null
  }, [])

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (e.button !== 0) return
      e.preventDefault()
      handleDragStart(e.clientX, e.clientY)
    },
    [handleDragStart]
  )

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      handleDragMove(e.clientX, e.clientY)
    },
    [handleDragMove]
  )

  const handleMouseUp = useCallback(() => {
    handleDragEnd()
  }, [handleDragEnd])

  const handleTouchStart = useCallback(
    (e: React.TouchEvent) => {
      const rect = containerRef.current?.getBoundingClientRect()
      if (!rect) return

      if (e.touches.length === 2) {
        const t1 = e.touches[0]
        const t2 = e.touches[1]
        const mid = getTouchMidpoint(t1, t2, rect)
        pinchStartRef.current = {
          distance: getTouchDistance(t1, t2),
          scale,
          midX: mid.x,
          midY: mid.y,
        }
        setIsDragging(false)
        return
      }

      if (e.touches.length === 1) {
        const touch = e.touches[0]
        handleDragStart(touch.clientX, touch.clientY)
      }
    },
    [handleDragStart, scale]
  )

  const handleTouchMove = useCallback(
    (e: React.TouchEvent) => {
      const rect = containerRef.current?.getBoundingClientRect()
      if (!rect) return

      if (e.touches.length === 2 && pinchStartRef.current) {
        e.preventDefault()
        const t1 = e.touches[0]
        const t2 = e.touches[1]
        const distance = getTouchDistance(t1, t2)
        const { distance: startDist, scale: startScale, midX, midY } = pinchStartRef.current
        if (startDist === 0) return

        const nextScale = Math.max(
          MIN_SCALE,
          Math.min(MAX_SCALE, startScale * (distance / startDist))
        )

        setScale((prevScale) => {
          const ratio = nextScale / prevScale
          setPosition((prev) => ({
            x: midX - ratio * (midX - prev.x),
            y: midY - ratio * (midY - prev.y),
          }))
          return nextScale
        })
        return
      }

      if (e.touches.length === 1) {
        const touch = e.touches[0]
        handleDragMove(touch.clientX, touch.clientY)
      }
    },
    [handleDragMove]
  )

  const handleTouchEnd = useCallback(() => {
    handleDragEnd()
  }, [handleDragEnd])

  const reset = useCallback(() => {
    setScale(initialScale)
    setPosition({ x: 0, y: 0 })
  }, [initialScale])

  return {
    scale,
    position,
    isDragging,
    containerRef,
    handleWheel,
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd,
    zoomIn,
    zoomOut,
    reset,
  }
}
