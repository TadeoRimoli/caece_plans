import { doc, getDoc, setDoc } from "firebase/firestore"
import { db } from "../../lib/firebase"
import type { Career, Subject, SubjectStatus } from "../../types"
import { getSubjectType } from "../../types"

export type SubjectProgressValue =
  | SubjectStatus
  | { status: SubjectStatus; finalGrade?: number | null }

/** Por cada groupId de optativas, códigos de materia que el usuario eligió. */
export type SelectedElectives = Record<string, string[]>

export interface UserProgress {
  subjects: Record<string, SubjectProgressValue>
  selectedElectives?: SelectedElectives
  lastUpdated: Date
}

/**
 * Obtiene el progreso del usuario para una carrera (solo materias)
 */
export async function getUserProgress(
  userId: string,
  careerId: string
): Promise<Record<string, SubjectProgressValue>> {
  const progressRef = doc(db, "users", userId, "careers", String(careerId))
  const progressSnap = await getDoc(progressRef)
  if (!progressSnap.exists()) return {}
  const data = progressSnap.data()
  return (data?.subjects as Record<string, SubjectProgressValue>) || {}
}

/**
 * Obtiene progreso completo: materias y optativas elegidas
 */
export async function getFullUserProgress(
  userId: string,
  careerId: string
): Promise<{ subjects: Record<string, SubjectProgressValue>; selectedElectives: SelectedElectives }> {
  const progressRef = doc(db, "users", userId, "careers", String(careerId))
  const progressSnap = await getDoc(progressRef)
  if (!progressSnap.exists()) {
    return { subjects: {}, selectedElectives: {} }
  }
  const data = progressSnap.data()
  return {
    subjects: (data?.subjects as Record<string, SubjectProgressValue>) || {},
    selectedElectives: (data?.selectedElectives as SelectedElectives) || {},
  }
}

/**
 * Guarda las optativas elegidas por el usuario para una carrera
 */
export async function saveSelectedElectives(
  userId: string,
  careerId: string,
  selectedElectives: SelectedElectives
): Promise<void> {
  const progressRef = doc(db, "users", userId, "careers", String(careerId))
  const progressDoc = await getDoc(progressRef)
  const current = progressDoc.exists() ? progressDoc.data() : { subjects: {}, selectedElectives: {} }
  await setDoc(
    progressRef,
    {
      ...current,
      selectedElectives,
      lastUpdated: new Date(),
    },
    { merge: true }
  )
}

const COMPLETED_STATUSES: SubjectStatus[] = ["promoted", "approved_with_final"]

/**
 * Valida si el usuario cumple las reglas de optativas y si todas las materias
 * requeridas (obligatorias + optativas elegidas + requisitos) están aprobadas.
 * Útil para marcar carrera como completada o habilitar título.
 */
export function validateCareerCompletion(
  career: Career,
  subjectProgress: Record<string, SubjectProgressValue>,
  selectedElectives: SelectedElectives
): { valid: boolean; errors: string[] } {
  const errors: string[] = []
  const subjectByCode = new Map(career.subjects.map((s) => [s.code, s]))

  // 1) Validar reglas de optativas: cada grupo debe tener exactamente requiredSubjects elegidas
  const rules = career.electiveRules ?? []
  for (const rule of rules) {
    const selected = selectedElectives[rule.groupId] ?? []
    const validCodes = new Set(rule.availableSubjects)
    const invalid = selected.filter((c) => !validCodes.has(c))
    if (invalid.length > 0) {
      errors.push(`Grupo ${rule.groupId}: materias no permitidas: ${invalid.join(", ")}`)
    }
    if (selected.length !== rule.requiredSubjects) {
      errors.push(
        `Grupo ${rule.groupId}: debes elegir ${rule.requiredSubjects} materia(s), elegiste ${selected.length}`
      )
    }
  }

  // 2) Materias que cuentan para completar: obligatorias + optativas elegidas + requisitos
  const requiredCodes = new Set<string>()
  for (const s of career.subjects) {
    const t = getSubjectType(s)
    if (t === "mandatory" || t === "requirement") requiredCodes.add(s.code)
  }
  for (const rule of rules) {
    const selected = selectedElectives[rule.groupId] ?? []
    selected.forEach((c) => requiredCodes.add(c))
  }

  // 3) Todas deben estar aprobadas o promocionadas
  for (const code of requiredCodes) {
    const raw = subjectProgress[code]
    const status = !raw
      ? "pending"
      : typeof raw === "string"
        ? raw
        : raw.status
    if (!COMPLETED_STATUSES.includes(status)) {
      const sub = subjectByCode.get(code)
      errors.push(`Falta aprobar: ${sub?.name ?? code}`)
    }
  }

  // 4) Validar requisitos extra por materia (ej: "25 asignaturas aprobadas" para un final).
  const extraRequirements = career.extraRequirements ?? []
  if (extraRequirements.length > 0) {
    // Cantidad total de materias completadas en la carrera (cualquier tipo).
    let totalCompleted = 0
    for (const s of career.subjects) {
      const raw = subjectProgress[s.code]
      const status = !raw
        ? "pending"
        : typeof raw === "string"
          ? raw
          : raw.status
      if (COMPLETED_STATUSES.includes(status)) {
        totalCompleted++
      }
    }

    for (const rule of extraRequirements) {
      if (!rule.subjectCode || !rule.minApprovedSubjects || rule.minApprovedSubjects <= 0) continue
      const sub = subjectByCode.get(rule.subjectCode)
      if (!sub) continue

      const raw = subjectProgress[rule.subjectCode]
      const status = !raw
        ? "pending"
        : typeof raw === "string"
          ? raw
          : raw.status

      // Solo validamos el requisito si la materia está marcada como completada.
      if (COMPLETED_STATUSES.includes(status) && totalCompleted < rule.minApprovedSubjects) {
        errors.push(
          `Para ${sub.name} se requieren al menos ${rule.minApprovedSubjects} materias aprobadas (actualmente: ${totalCompleted}).`
        )
      }
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  }
}

/**
 * Guarda el progreso (estado y opcionalmente nota) del usuario para una materia
 */
export async function saveUserProgress(
  userId: string,
  careerId: string,
  subjectId: string,
  status: SubjectStatus,
  finalGrade?: number | null
): Promise<void> {
  const progressRef = doc(db, "users", userId, "careers", String(careerId))
  const progressDoc = await getDoc(progressRef)
  const currentProgress = progressDoc.exists() ? progressDoc.data() : { subjects: {} }

  const prev: SubjectProgressValue | undefined = currentProgress.subjects?.[subjectId]

  let value: SubjectProgressValue

  if (prev && typeof prev === "object") {
    value = {
      ...prev,
      status,
      ...(finalGrade !== undefined ? { finalGrade } : {}),
    }
  } else {
    value = {
      status: prev && typeof prev === "string" ? prev : status,
      ...(finalGrade !== undefined ? { finalGrade } : {}),
    }
  }

  await setDoc(
    progressRef,
    {
      ...currentProgress,
      subjects: {
        ...(currentProgress.subjects || {}),
        [subjectId]: value,
      },
      lastUpdated: new Date(),
    },
    { merge: true }
  )
}

/**
 * Guarda solo la nota final de una materia, preservando el status actual.
 */
export async function saveUserFinalGrade(
  userId: string,
  careerId: string,
  subjectId: string,
  finalGrade: number | null
): Promise<void> {
  const progressRef = doc(db, "users", userId, "careers", String(careerId))
  const progressDoc = await getDoc(progressRef)
  const currentProgress = progressDoc.exists() ? progressDoc.data() : { subjects: {} }

  const prev: SubjectProgressValue | undefined = currentProgress.subjects?.[subjectId]

  let status: SubjectStatus = "pending"
  let existingGrade: number | null | undefined = null

  if (prev && typeof prev === "object") {
    status = prev.status
    existingGrade = prev.finalGrade
  } else if (typeof prev === "string") {
    status = prev
  }

  const value: SubjectProgressValue = {
    status,
    finalGrade: finalGrade ?? existingGrade ?? null,
  }

  await setDoc(
    progressRef,
    {
      ...currentProgress,
      subjects: {
        ...(currentProgress.subjects || {}),
        [subjectId]: value,
      },
      lastUpdated: new Date(),
    },
    { merge: true }
  )
}

/**
 * Aplica el progreso del usuario a las materias
 */
export function applyProgressToSubjects(
  subjects: Subject[],
  progress: Record<string, SubjectProgressValue>
): Subject[] {
  return subjects.map((subject) => {
    const raw = progress[String(subject.code)]

    if (!raw) {
      return {
        ...subject,
        status: "pending",
        finalGrade: subject.finalGrade ?? null,
      }
    }

    if (typeof raw === "string") {
      return {
        ...subject,
        status: raw,
        finalGrade: subject.finalGrade ?? null,
      }
    }

    return {
      ...subject,
      status: raw.status,
      finalGrade:
        typeof raw.finalGrade === "number" ? raw.finalGrade : subject.finalGrade ?? null,
    }
  })
}
