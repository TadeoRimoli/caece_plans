import type { Subject, SubjectStatus } from "../../../types"
import { SubjectNode } from "./SubjectNode"
import { NODE_WIDTH } from "../../../constants"

interface RequirementsSectionProps {
  subjects: Subject[]
  onSubjectClick: (subject: Subject) => void
  hoveredSubjectId?: string | null
  hoveredStatus?: SubjectStatus | null
  onHover?: (subjectId: string | null) => void
}

export function RequirementsSection({
  subjects,
  onSubjectClick,
  hoveredSubjectId = null,
  hoveredStatus = null,
  onHover,
}: RequirementsSectionProps) {
  if (subjects.length === 0) return null

  return (
    <aside
      className="flex-shrink-0 w-[280px] flex flex-col overflow-hidden border-l border-white/10 bg-slate-900/50"
      style={{ width: NODE_WIDTH }}
    >
      <div className="flex-shrink-0 px-3 py-3 border-b border-white/5">
        <h2 className="text-xs font-semibold text-white uppercase tracking-wider">
          Requisitos para recibirse
        </h2>
        <p className="text-[10px] text-slate-500 mt-0.5">
          Idioma, prácticas, tesina, etc.
        </p>
      </div>
      <div className="flex-1 overflow-y-auto p-2 space-y-2 min-h-0">
        {subjects.map((subject) => (
          <div
            key={subject.code}
            className="flex-shrink-0"
            onMouseEnter={() => onHover?.(subject.code)}
            onMouseLeave={() => onHover?.(null)}
          >
            <SubjectNode
              subject={subject}
              allSubjects={subjects}
              onClick={onSubjectClick}
              onHover={onHover}
              hoveredSubjectId={hoveredSubjectId}
              hoveredStatus={hoveredStatus}
            />
          </div>
        ))}
      </div>
    </aside>
  )
}
