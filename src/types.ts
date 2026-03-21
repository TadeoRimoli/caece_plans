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

export type SubjectType = "mandatory" | "elective" | "requirement"

/**
 * Indica si la materia tiene posición en la grilla (año definido).
 * quadrimester puede ser null/0 para materias anuales (solo se agrupa por año).
 */
export function hasGridPosition(year: number | null | undefined, _quadrimester?: number | null): boolean {
  const y = year ?? 0
  return typeof y === "number" && y > 0
}

export function getSubjectType(subject: { type?: SubjectType }): SubjectType {
  return subject.type === "elective" || subject.type === "requirement" ? subject.type : "mandatory"
}

export interface Subject {
  name: string
  /** Año del plan (null o 0 = sin posición, ej. requisitos atemporales). */
  year: number | null
  /** Cuatrimestre (null o 0 = sin posición). */
  quadrimester: number | null
  prerequisites: string[]
  status: SubjectStatus
  code: string
  /** Tipo de materia: obligatoria, optativa/electiva o requisito extracurricular. Por defecto 'mandatory'. */
  type?: SubjectType
  /** Solo para type 'elective': agrupa con la regla en career.electiveRules. */
  groupId?: string
  extraConditions?: string
  finalGrade?: number | null
}

export interface NodePosition {
  x: number
  y: number
}

export interface ElectiveRule {
  groupId: string
  requiredSubjects: number
  availableSubjects: string[]
}

export interface ExtraRequirement {
  /** Código de la materia a la que aplica el requisito extra (ej: final integrador). */
  subjectCode: string
  /** Cantidad mínima de materias aprobadas que se requieren para esta materia (ej: 25). */
  minApprovedSubjects?: number
}

export interface Career {
  id: string
  name: string
  /** Área de la carrera (ej. Ingeniería, Salud). Usado para filtrar por paso intermedio universidad → área → carreras. */
  area?: string
  subjects: Subject[]
  /** Reglas de optativas: por cada grupo, cuántas materias debe elegir el usuario y de cuáles. */
  electiveRules?: ElectiveRule[]
  /** Requisitos extra por materia (ej: finales que piden X materias aprobadas). */
  extraRequirements?: ExtraRequirement[]
  plan: string
  icon: string
  year: number
}

export interface University {
  id: string
  acronym?: string
  fullName?: string
  location?: string
  logoUrl?: string
  type?: string
  website?: string
}
