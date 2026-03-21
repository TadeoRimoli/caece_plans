import { useCallback, useMemo } from "react"
import { BookOpen } from "lucide-react"
import { cn } from "../../../lib/utils"
import { NODE_WIDTH } from "../../../constants"
import type { Subject, SubjectStatus } from "../../../types"
import { STATUS_META } from "../../../types"

interface SubjectNodeProps {
  subject: Subject
  allSubjects: Subject[]
  onClick: (subject: Subject) => void
  onHover?: (subjectId: string | null) => void
  hoveredSubjectId?: string | null
  hoveredStatus?: SubjectStatus | null
  /** Indica si el usuario ya cumple las correlativas / requisitos para cursar esta materia. */
  isEligible?: boolean
  /** Si es true, al no haber filtros se atenúa visualmente las materias pendientes que aún no se pueden cursar. */
  highlightEligibleOnly?: boolean
}

export function SubjectNode({
  subject,
  allSubjects,
  onClick,
  onHover,
  hoveredSubjectId: externalHoveredId,
  hoveredStatus = null,
  isEligible = false,
  highlightEligibleOnly = false,
}: SubjectNodeProps) {
  const hoveredSubjectId = externalHoveredId ?? null

  const statusMeta = STATUS_META[subject.status]

  // Build subject map for O(1) lookups
  const subjectMap = useMemo(() => {
    const map = new Map<string, Subject>()
    for (const s of allSubjects) {
      map.set(s.code, s)
    }
    return map
  }, [allSubjects])

  // Get correlative names
  const correlativeNames = useMemo(() => {
    return subject.prerequisites
      .map((code) => subjectMap.get(code)?.name)
      .filter((name): name is string => name !== undefined)
  }, [subject.prerequisites, subjectMap])

  // Check if this node should be highlighted
  const isHighlighted = useMemo(() => {
    // 1) Hover por materia concreta
    if (hoveredSubjectId) {
      if (subject.code === hoveredSubjectId) return true
      if (subject.prerequisites.includes(hoveredSubjectId)) return true

      // Check if the hovered subject requires this one
      const hoveredSubject = subjectMap.get(hoveredSubjectId)
      if (hoveredSubject && hoveredSubject.prerequisites.includes(subject.code)) {
        return true
      }

      return false
    }

    // 2) Hover por estado en el footer
    if (hoveredStatus) {
      return subject.status === hoveredStatus
    }

    // 3) Sin filtros:
    //    - si highlightEligibleOnly=true: solo destacar materias pendientes que se pueden cursar
    //    - si highlightEligibleOnly=false: todas con la misma opacidad
    if (highlightEligibleOnly && subject.status === "pending") {
      return isEligible
    }
    return true
  }, [hoveredSubjectId, hoveredStatus, subject, subjectMap, isEligible, highlightEligibleOnly])

  const isHovered = hoveredSubjectId === subject.code
  const hasFilter = Boolean(hoveredSubjectId || hoveredStatus)

  const handleMouseEnter = useCallback(() => {
    if (onHover) {
      onHover(subject.code)
    }
  }, [subject.code, onHover])

  const handleMouseLeave = useCallback(() => {
    if (onHover) {
      onHover(null)
    }
  }, [onHover])

  const handleCardClick = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation()
      onClick(subject)
    },
    [subject, onClick]
  )

  return (
    <div
      className={cn(
        "relative transition-opacity duration-150",
        isHighlighted ? "opacity-100" : "opacity-25"
      )}
      style={{ width: NODE_WIDTH }}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* Main card */}
      <div
        onClick={handleCardClick}
        className={cn(
          "relative cursor-pointer rounded-2xl overflow-hidden border",
          "bg-gradient-to-br from-white/[0.08] to-white/[0.02]",
          "transition-transform duration-150 ease-out",
          hasFilter && isHighlighted && "scale-[1.05]",
          isHovered && "scale-[1.05]"
        )}
        style={{
          borderColor: statusMeta.borderGlow,
          boxShadow: isHighlighted
            ? `0 10px 40px rgba(0,0,0,0.45)`
            : `0 6px 20px rgba(0,0,0,0.25)`,
        }}
      >
        {/* Glow overlay */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: `radial-gradient(ellipse at 50% 0%, ${statusMeta.color}30 0%, transparent 60%)`,
            opacity: 0.2,
            transition: "opacity 0.2s ease-out",
          }}
        />

          {/* Content */}
        <div className="relative p-5 sm:p-6">
          {/* Status bar */}
          <div
            className="absolute top-0 left-0 right-0 h-1.5 rounded-t-2xl"
            style={{ backgroundColor: statusMeta.color }}
          />

          {/* Subject name */}
          <h3 className="text-white font-bold text-center text-base sm:text-lg leading-tight min-h-[2.5rem] sm:min-h-[3rem] flex items-center justify-center mt-2">
            {subject.name}
          </h3>

          {/* Correlatives */}
          {correlativeNames.length > 0 && (
            <div className="mt-4 space-y-2">
              {correlativeNames.slice(0, 2).map((name, idx) => (
                <div
                  key={idx}
                  className="flex items-center gap-2 text-xs sm:text-sm text-slate-300 bg-white/5 rounded-lg px-2.5 py-1.5"
                >
                  <BookOpen className="w-3.5 h-3.5 sm:w-4 sm:h-4 flex-shrink-0 text-blue-400" />
                  <span className="truncate font-medium">{name}</span>
                </div>
              ))}
              {correlativeNames.length > 2 && (
                <div className="text-xs sm:text-sm text-slate-400 text-center font-medium pt-0.5">
                  +{correlativeNames.length - 2} más
                </div>
              )}
            </div>
          )}

          {/* Extra conditions */}
          {subject.extraConditions && (
            <div className="mt-4 text-xs sm:text-sm text-amber-400 flex items-center gap-2 bg-amber-500/10 rounded-lg px-2.5 py-1.5">
              <span>⚡</span>
              <span className="truncate font-medium">{subject.extraConditions}</span>
            </div>
          )}

          {/* Status badge */}
          <div className="mt-5 flex items-center justify-center">
            <div
              className="px-4 py-1.5 sm:py-2 rounded-full text-sm sm:text-base font-semibold flex items-center gap-2"
              style={{
                backgroundColor: `${statusMeta.color}25`,
                color: statusMeta.color,
                border: `1px solid ${statusMeta.color}50`,
              }}
            >
              <span className="text-base sm:text-lg">{statusMeta.icon}</span>
              <span>{statusMeta.label}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
