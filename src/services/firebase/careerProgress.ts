import { doc, getDoc, setDoc } from "firebase/firestore"
import { db } from "../../lib/firebase"
import type { Subject, SubjectStatus } from "../../types"

export type SubjectProgressValue =
  | SubjectStatus
  | { status: SubjectStatus; finalGrade?: number | null }

export interface UserProgress {
  subjects: Record<string, SubjectProgressValue>
  lastUpdated: Date
}

/**
 * Obtiene el progreso del usuario para una carrera
 */
export async function getUserProgress(
  userId: string,
  careerId: string
): Promise<Record<string, SubjectProgressValue>> {
  const progressRef = doc(db, "users", userId, "careers", String(careerId))
  const progressSnap = await getDoc(progressRef)

  if (!progressSnap.exists()) {
    return {}
  }

  const data = progressSnap.data()
  return (data?.subjects as Record<string, SubjectProgressValue>) || {}
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
