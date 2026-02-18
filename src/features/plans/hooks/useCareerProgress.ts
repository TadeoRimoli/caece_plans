import { useState, useEffect, useCallback } from "react"
import { doc, onSnapshot } from "firebase/firestore"
import { db } from "../../../lib/firebase"
import type { Career, SubjectStatus } from "../../../types"
import {
  getUserProgress,
  saveUserProgress,
  applyProgressToSubjects,
  saveUserFinalGrade,
  type SubjectProgressValue,
} from "../../../services/firebase/careerProgress"

interface UseCareerProgressReturn {
  currentCareer: Career | null
  setCurrentCareer: (career: Career | null) => void
  updateSubjectStatus: (subjectId: string, status: SubjectStatus) => Promise<void>
  updateSubjectFinalGrade: (subjectId: string, grade: number | null) => Promise<void>
  loading: boolean
}

/**
 * Hook para manejar el progreso de carreras
 * Incluye optimistic updates y sincronización con Firebase
 */
export function useCareerProgress(
  userId: string | null,
  careers: Career[]
): UseCareerProgressReturn {
  const [currentCareer, setCurrentCareerState] = useState<Career | null>(null)
  const [loading, setLoading] = useState(true)

  // Cargar progreso inicial cuando cambia la carrera
  const loadCareerProgress = useCallback(
    async (career: Career) => {
      if (!userId) return

      try {
        const progress = await getUserProgress(userId, String(career.id))
        const subjectsWithProgress = applyProgressToSubjects(career.subjects, progress)
        setCurrentCareerState({ ...career, subjects: subjectsWithProgress })
      } catch (error) {
        console.error("Error loading career progress:", error)
        setCurrentCareerState(career)
      } finally {
        setLoading(false)
      }
    },
    [userId]
  )

  // Cargar primera carrera al inicio
  useEffect(() => {
    if (careers.length > 0 && !currentCareer) {
      loadCareerProgress(careers[0])
    }
  }, [careers, currentCareer, loadCareerProgress])

  // Escuchar cambios en tiempo real
  useEffect(() => {
    if (!userId || !currentCareer) return

    const careerId = String(currentCareer.id)
    const progressRef = doc(db, "users", userId, "careers", careerId)

    const unsubscribe = onSnapshot(progressRef, (docSnap) => {
      if (!docSnap.exists() || !currentCareer) return

      const progressData = docSnap.data()
      const progress = (progressData?.subjects as Record<string, SubjectProgressValue>) || {}
      const subjectsWithProgress = applyProgressToSubjects(currentCareer.subjects, progress)

      setCurrentCareerState((prev) => {
        if (!prev || String(prev.id) !== careerId) return prev
        return { ...prev, subjects: subjectsWithProgress }
      })
    })

    return () => unsubscribe()
  }, [userId, currentCareer?.id])

  // Cambiar carrera
  const setCurrentCareer = useCallback(
    async (career: Career | null) => {
      if (!career) {
        setCurrentCareerState(null)
        return
      }

      setLoading(true)
      await loadCareerProgress(career)
    },
    [loadCareerProgress]
  )

  // Actualizar estado de materia con optimistic update
  const updateSubjectStatus = useCallback(
    async (subjectId: string, status: SubjectStatus) => {
      if (!userId || !currentCareer) return

      // Optimistic update
      const previousCareer = currentCareer
      const updatedSubjects = currentCareer.subjects.map((s) =>
        String(s.code) === subjectId ? { ...s, status } : s
      )

      setCurrentCareerState({ ...currentCareer, subjects: updatedSubjects })

      // Sync con Firebase
      try {
        await saveUserProgress(userId, String(currentCareer.id), subjectId, status)
      } catch (error) {
        console.error("Error saving progress:", error)
        // Rollback en caso de error
        setCurrentCareerState(previousCareer)
      }
    },
    [userId, currentCareer]
  )

  // Actualizar nota final con optimistic update
  const updateSubjectFinalGrade = useCallback(
    async (subjectId: string, grade: number | null) => {
      if (!userId || !currentCareer) return

      const previousCareer = currentCareer
      const updatedSubjects = currentCareer.subjects.map((s) =>
        String(s.code) === subjectId ? { ...s, finalGrade: grade } : s
      )

      setCurrentCareerState({ ...currentCareer, subjects: updatedSubjects })

      try {
        await saveUserFinalGrade(userId, String(currentCareer.id), subjectId, grade)
      } catch (error) {
        console.error("Error saving final grade:", error)
        setCurrentCareerState(previousCareer)
      }
    },
    [userId, currentCareer]
  )

  return {
    currentCareer,
    setCurrentCareer,
    updateSubjectStatus,
    updateSubjectFinalGrade,
    loading,
  }
}
