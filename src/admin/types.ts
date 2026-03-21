/**
 * Esquemas para el panel de administración (Firestore).
 * universities: ID del documento es string manual (ej. "caece").
 */

export interface UniversityDoc {
  acronym: string
  fullName: string
  location: string
  type: string
  website: string
  logoUrl: string
}

export type SubjectTypeDoc = "mandatory" | "elective" | "requirement"

export interface SubjectDoc {
  code: string
  name: string
  prerequisites: string[]
  quadrimester: number | null
  year: number | null
  type?: SubjectTypeDoc
  groupId?: string
  extraConditions?: string
}

export interface ElectiveRuleDoc {
  groupId: string
  requiredSubjects: number
  availableSubjects: string[]
}

export interface ExtraRequirementDoc {
  /** Código de la materia a la que aplica el requisito extra (ej: final integrador). */
  subjectCode: string
  /** Cantidad mínima de materias aprobadas que se requieren para poder rendir/considerar aprobada esta materia. */
  minApprovedSubjects?: number
}

export interface CareerDoc {
  name: string
  area: string
  plan: string
  year: number
  icon: string
  universityId: string
  subjects: SubjectDoc[]
  electiveRules?: ElectiveRuleDoc[]
  /** Requisitos extra por materia (ej: "25 asignaturas aprobadas" para un final integrador). */
  extraRequirements?: ExtraRequirementDoc[]
}

export type UniversityDocWithId = UniversityDoc & { id: string }
export type CareerDocWithId = CareerDoc & { id: string }
