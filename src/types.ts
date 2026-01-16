export type SubjectStatus =
  | "pending"             // No cursada aún
  | "in_progress"         // Cursando actualmente
  | "course_completed"    // Cursada completa, final pendiente
  | "promoted"            // Promocionada (sin necesidad de final)
  | "approved_with_final" // Aprobada rendido final

// Configuración de metadatos de cada estado con colores para glassmorphism
export const STATUS_META: Record<SubjectStatus, { 
  label: string
  color: string
  bgGlow: string
  borderGlow: string
  icon: string
}> = {
  pending: { 
    label: "Pendiente", 
    color: "#64748b",
    bgGlow: "rgba(100, 116, 139, 0.15)",
    borderGlow: "rgba(100, 116, 139, 0.4)",
    icon: "○"
  },
  in_progress: { 
    label: "Cursando", 
    color: "#f59e0b",
    bgGlow: "rgba(245, 158, 11, 0.2)",
    borderGlow: "rgba(245, 158, 11, 0.5)",
    icon: "◐"
  },
  course_completed: { 
    label: "Final pendiente", 
    color: "#3b82f6",
    bgGlow: "rgba(59, 130, 246, 0.2)",
    borderGlow: "rgba(59, 130, 246, 0.5)",
    icon: "◑"
  },
  promoted: { 
    label: "Promocionada", 
    color: "#a855f7",
    bgGlow: "rgba(168, 85, 247, 0.2)",
    borderGlow: "rgba(168, 85, 247, 0.5)",
    icon: "★"
  },
  approved_with_final: { 
    label: "Aprobada", 
    color: "#22c55e",
    bgGlow: "rgba(34, 197, 94, 0.2)",
    borderGlow: "rgba(34, 197, 94, 0.5)",
    icon: "●"
  },
}

export const STATUS_LIST = (Object.keys(STATUS_META) as SubjectStatus[]).map((k) => ({
  value: k, 
  label: STATUS_META[k].label,
  color: STATUS_META[k].color,
  icon: STATUS_META[k].icon
}))

export interface Subject {
  name: string
  year: number
  quadrimester: number
  prerequisites: string[]
  status: SubjectStatus
  code: string
  extraConditions?: string
}

export interface NodePosition {
  x: number
  y: number
}

export interface Career {
  id: string
  name: string
  subjects: Subject[]
  plan: string
  icon: string
  year: number
}
