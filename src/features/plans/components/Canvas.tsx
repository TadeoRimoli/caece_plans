import { useRef, useState, useEffect, useMemo } from "react"
import { cn } from "../../../lib/utils"
import { NODE_WIDTH, COLUMN_GAP } from "../../../constants"
import type { Subject, NodePosition, SubjectStatus } from "../../../types"
import { ConnectionLines } from "./ConnectionLines"
import { SubjectNode } from "./SubjectNode"
import { useCanvas } from "../hooks/useCanvas"

interface CanvasProps {
  subjects: Subject[]
  nodePositions: Record<string, NodePosition>
  columns: Array<{ key: string; year: number; quadrimester: number }>
  onSubjectClick: (subject: Subject) => void
  hoveredStatus?: SubjectStatus | null
  eligibleSubjectCodes?: string[]
}

export function Canvas({
  subjects,
  nodePositions,
  columns,
  onSubjectClick,
  hoveredStatus,
  eligibleSubjectCodes,
}: CanvasProps) {
  const [hoveredSubjectId, setHoveredSubjectId] = useState<string | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const eligibleSet = useMemo(() => new Set(eligibleSubjectCodes ?? []), [eligibleSubjectCodes])
  const eligibilityEnabled = (eligibleSubjectCodes?.length ?? 0) > 0
  const {
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
  } = useCanvas()

  // Registrar wheel con { passive: false } para poder llamar preventDefault sin warning
  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    el.addEventListener("wheel", handleWheel, { passive: false })
    return () => el.removeEventListener("wheel", handleWheel)
  }, [handleWheel])

  return (
    <div
      ref={containerRef}
      className={cn(
        "flex-1 min-h-[300px] relative overflow-hidden touch-none",
        isDragging ? "cursor-grabbing" : "cursor-grab"
      )}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950" />
        <div
          className="absolute inset-0 opacity-30"
          style={{
            backgroundImage: `radial-gradient(circle at 1px 1px, rgba(148, 163, 184, 0.3) 1px, transparent 0)`,
            backgroundSize: "40px 40px",
          }}
        />
      </div>

      {/* Content layer: tamaño mínimo para que zoom/pan tengan efecto aunque no haya nodos */}
      <div
        className="relative w-fit h-fit min-w-[800px] min-h-[400px]"
        style={{
          transform: `translate3d(${position.x}px, ${position.y}px, 0) scale(${scale})`,
          transformOrigin: "0 0",
        }}
      >
        {/* Column headers */}
        {columns.map((column, idx) => {
          const columnX = idx * COLUMN_GAP + 150
          const isRequisitos = column.key === "requisitos"
          return (
            <div
              key={column.key}
              className="absolute text-center"
              style={{ left: columnX - NODE_WIDTH / 2, top: 40, width: NODE_WIDTH }}
            >
              <div className="inline-flex flex-col items-center gap-1 px-4 sm:px-6 py-2 sm:py-3 rounded-2xl bg-slate-900/95 border border-white/10">
                {isRequisitos ? (
                  <>
                    <div className="flex items-center gap-2 text-white font-semibold text-xs sm:text-sm">
                      Requisitos para recibirse
                    </div>
                    <div className="text-[10px] sm:text-xs text-slate-400">
                      Idioma, prácticas, tesina
                    </div>
                  </>
                ) : (
                  <>
                    <div className="flex items-center gap-2 text-white font-semibold text-xs sm:text-sm">
                      <span>{column.year} Año</span>
                    </div>
                    <div className="text-[10px] sm:text-xs text-slate-400">
                      {column.quadrimester === 0 ? "Anual" : `${column.quadrimester}º Cuatrimestre`}
                    </div>
                  </>
                )}
              </div>
            </div>
          )
        })}

        {/* Connection lines */}
        <ConnectionLines
          subjects={subjects}
          nodePositions={nodePositions}
          hoveredSubjectId={hoveredSubjectId}
        />

        {/* Subject nodes */}
        {subjects.map((subject) => {
          const pos = nodePositions[subject.code]
          if (!pos) return null

          return (
            <div
              key={subject.code}
              className="absolute"
              style={{ left: pos.x - NODE_WIDTH / 2, top: pos.y - 60 }}
            >
              <SubjectNode
                subject={subject}
                allSubjects={subjects}
                onClick={onSubjectClick}
                onHover={setHoveredSubjectId}
                hoveredSubjectId={hoveredSubjectId}
                hoveredStatus={hoveredStatus}
                isEligible={eligibilityEnabled && eligibleSet.has(subject.code)}
                highlightEligibleOnly={eligibilityEnabled}
              />
            </div>
          )
        })}
      </div>
    </div>
  )
}
