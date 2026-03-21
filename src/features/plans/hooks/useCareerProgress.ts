import { useState, useEffect, useCallback } from "react"
import { doc, getDoc, onSnapshot } from "firebase/firestore"
import { db } from "../../../lib/firebase"
import type { Career, SubjectStatus } from "../../../types"
import {
  getFullUserProgress,
  saveUserProgress,
  applyProgressToSubjects,
  saveUserFinalGrade,
  saveSelectedElectives,
  type SubjectProgressValue,
  type SelectedElectives,
} from "../../../services/firebase/careerProgress"

interface UseCareerProgressReturn {
  currentCareer: Career | null
  setCurrentCareer: (career: Career | null) => void
  selectedElectives: SelectedElectives
  saveSelectedElectives: (selected: SelectedElectives) => Promise<void>
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
  const [selectedElectives, setSelectedElectivesState] = useState<SelectedElectives>({})
  const [loading, setLoading] = useState(false)

  const loadCareerProgress = useCallback(
    async (career: Career) => {
      try {
        if (!userId) {
          // Modo invitado: no hay progreso guardado, usamos materias tal cual.
          setCurrentCareerState(career)
          setSelectedElectivesState({})
          setLoading(false)
          return
        }

        const { subjects: progress, selectedElectives: electives } = await getFullUserProgress(
          userId,
          String(career.id)
        )
        const subjectsWithProgress = applyProgressToSubjects(career.subjects, progress)
        setCurrentCareerState({ ...career, subjects: subjectsWithProgress })
        setSelectedElectivesState(electives)
      } catch (error) {
        console.error("Error loading career progress:", error)
        setCurrentCareerState(career)
        setSelectedElectivesState({})
      } finally {
        setLoading(false)
      }
    },
    [userId]
  )

  // Cargar primera carrera al inicio
  useEffect(() => {
    if (careers.length > 0 && !currentCareer) {
      const selectInitialCareer = async () => {
        setLoading(true)

        let initialCareer: Career = careers[0]

        // Si hay usuario, intentamos respetar favoritos; si no, usamos la primera carrera.
        if (userId) {
          try {
            const userRef = doc(db, "users", userId)
            const userSnap = await getDoc(userRef)

            if (userSnap.exists()) {
              const data = userSnap.data() as { favoriteCareers?: unknown }
              const rawFavs = data.favoriteCareers
              if (Array.isArray(rawFavs)) {
                const favoriteIds = rawFavs.filter((id) => typeof id === "string") as string[]
                const favoriteCareer =
                  careers.find((career) => favoriteIds.includes(career.id)) ?? null
                if (favoriteCareer) {
                  initialCareer = favoriteCareer
                }
              }
            }
          } catch (error) {
            console.error("Error selecting initial career based on favorites:", error)
          }
        }

        await loadCareerProgress(initialCareer)
      }

      void selectInitialCareer()
      return
    }

    if (careers.length === 0) {
      setCurrentCareerState(null)
      setLoading(false)
    }
  }, [userId, careers, currentCareer, loadCareerProgress])

  // Escuchar cambios en tiempo real
  useEffect(() => {
    if (!userId || !currentCareer) return

    const careerId = String(currentCareer.id)
    const progressRef = doc(db, "users", userId, "careers", careerId)

    const unsubscribe = onSnapshot(progressRef, (docSnap) => {
      if (!docSnap.exists() || !currentCareer) return

      const progressData = docSnap.data()
      const progress = (progressData?.subjects as Record<string, SubjectProgressValue>) || {}
      const electives = (progressData?.selectedElectives as SelectedElectives) || {}
      const subjectsWithProgress = applyProgressToSubjects(currentCareer.subjects, progress)

      setSelectedElectivesState(electives)
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
        setSelectedElectivesState({})
        return
      }
      setLoading(true)
      await loadCareerProgress(career)
    },
    [loadCareerProgress]
  )

  const persistSelectedElectives = useCallback(
    async (selected: SelectedElectives) => {
      if (!userId || !currentCareer) return
      setSelectedElectivesState(selected)
      try {
        await saveSelectedElectives(userId, String(currentCareer.id), selected)
      } catch (error) {
        console.error("Error saving selected electives:", error)
      }
    },
    [userId, currentCareer]
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
    selectedElectives,
    saveSelectedElectives: persistSelectedElectives,
    updateSubjectStatus,
    updateSubjectFinalGrade,
    loading,
  }
}
