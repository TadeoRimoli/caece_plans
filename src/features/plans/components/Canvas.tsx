import { useRef, useState } from "react"
import { cn } from "../../../lib/utils"
import { NODE_WIDTH } from "../../../constants"
import type { Subject, NodePosition } from "../../../types"
import { ConnectionLines } from "./ConnectionLines"
import { SubjectNode } from "./SubjectNode"
import { useCanvas } from "../hooks/useCanvas"

interface CanvasProps {
  subjects: Subject[]
  nodePositions: Record<string, NodePosition>
  columns: Array<{ key: string; year: number; quadrimester: number }>
  onSubjectClick: (subject: Subject) => void
}

export function Canvas({
  subjects,
  nodePositions,
  columns,
  onSubjectClick,
}: CanvasProps) {
  const [hoveredSubjectId, setHoveredSubjectId] = useState<string | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)
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

  return (
    <div
      ref={containerRef}
      className={cn(
        "flex-1 relative overflow-hidden touch-none",
        isDragging ? "cursor-grabbing" : "cursor-grab"
      )}
      onWheel={handleWheel}
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

      {/* Content layer */}
      <div
        className="relative w-fit h-fit"
        style={{
          transform: `translate3d(${position.x}px, ${position.y}px, 0) scale(${scale})`,
          transformOrigin: "0 0",
        }}
      >
        {/* Column headers */}
        {columns.map((column, idx) => (
          <div
            key={column.key}
            className="absolute text-center"
            style={{ left: idx * 400, top: 40, width: NODE_WIDTH }}
          >
            <div className="inline-flex flex-col items-center gap-1 px-4 sm:px-6 py-2 sm:py-3 rounded-2xl bg-slate-900/95 border border-white/10">
              <div className="flex items-center gap-2 text-white font-semibold text-xs sm:text-sm">
                <span>{column.year}º Año</span>
              </div>
              <div className="text-[10px] sm:text-xs text-slate-400">
                {column.quadrimester}º Cuatrimestre
              </div>
            </div>
          </div>
        ))}

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
              />
            </div>
          )
        })}
      </div>
    </div>
  )
}
