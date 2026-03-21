import { useState, useCallback, useRef } from "react"

export interface CanvasState {
  scale: number
  position: { x: number; y: number }
  isDragging: boolean
}

const MIN_SCALE = 0.3
const MAX_SCALE = 2
/** Factor para zoom multiplicativo: más bajo = zoom más suave con la rueda */
const ZOOM_FACTOR = 0.0003
/** Sensibilidad reducida cuando es pinch (ctrlKey), para trackpads */
const PINCH_ZOOM_FACTOR = 0.0005

/**
 * Hook para manejar drag y zoom del canvas
 * Usa requestAnimationFrame para animaciones suaves
 */
export function useCanvas(initialScale = 1) {
  const [scale, setScale] = useState(initialScale)
  const [position, setPosition] = useState({ x: 0, y: 0 })
  const [isDragging, setIsDragging] = useState(false)
  
  const dragStartRef = useRef({ x: 0, y: 0 })
  const rafRef = useRef<number | null>(null)

  // Zoom con wheel: multiplicativo para sensibilidad estable en mouse y trackpad (pinch)
  const handleWheel = useCallback((e: WheelEvent) => {
    e.preventDefault()
    const factor = e.ctrlKey ? PINCH_ZOOM_FACTOR : ZOOM_FACTOR
    setScale((prev) => {
      const newScale = prev * (1 - e.deltaY * factor)
      return Math.max(MIN_SCALE, Math.min(MAX_SCALE, newScale))
    })
  }, [])

  // Iniciar drag
  const handleDragStart = useCallback((clientX: number, clientY: number) => {
    setIsDragging(true)
    dragStartRef.current = {
      x: clientX - position.x,
      y: clientY - position.y,
    }
  }, [position])

  // Actualizar posición durante drag
  const handleDragMove = useCallback((clientX: number, clientY: number) => {
    if (!isDragging) return

    // Cancelar RAF anterior si existe
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current)
    }

    // Usar RAF para animaciones suaves
    rafRef.current = requestAnimationFrame(() => {
      setPosition({
        x: clientX - dragStartRef.current.x,
        y: clientY - dragStartRef.current.y,
      })
    })
  }, [isDragging])

  // Finalizar drag
  const handleDragEnd = useCallback(() => {
    setIsDragging(false)
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current)
      rafRef.current = null
    }
  }, [])

  // Handlers para mouse
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    handleDragStart(e.clientX, e.clientY)
  }, [handleDragStart])

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    handleDragMove(e.clientX, e.clientY)
  }, [handleDragMove])

  const handleMouseUp = useCallback(() => {
    handleDragEnd()
  }, [handleDragEnd])

  // Handlers para touch
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      const touch = e.touches[0]
      handleDragStart(touch.clientX, touch.clientY)
    }
  }, [handleDragStart])

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      const touch = e.touches[0]
      handleDragMove(touch.clientX, touch.clientY)
    }
  }, [handleDragMove])

  const handleTouchEnd = useCallback(() => {
    handleDragEnd()
  }, [handleDragEnd])

  // Reset canvas
  const reset = useCallback(() => {
    setScale(initialScale)
    setPosition({ x: 0, y: 0 })
  }, [initialScale])

  return {
    scale,
    position,
    isDragging,
    handleWheel,
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd,
    reset,
  }
}
