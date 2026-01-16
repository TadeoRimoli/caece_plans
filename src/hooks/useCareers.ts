import { useState, useEffect } from "react"
import { collection, doc, getDocs, getDoc, onSnapshot } from "firebase/firestore"
import { db } from "../lib/firebase"
import type { Career, Subject, SubjectStatus } from "../types"

interface UseCareersReturn {
  careers: Career[]
  currentCareer: Career | null
  setCurrentCareer: React.Dispatch<React.SetStateAction<Career | null>>
  loadingCareers: boolean
}

export default function useCareers(userId: string | null): UseCareersReturn {
  const [careers, setCareers] = useState<Career[]>([])
  const [currentCareer, setCurrentCareer] = useState<Career | null>(null)
  const [loadingCareers, setLoadingCareers] = useState(true)

  // 1️⃣ Cargar todas las carreras - eliminate waterfalls (Rule 1.3, 1.4)
  useEffect(() => {
    if (!userId) {
      setLoadingCareers(false)
      return
    }

    const loadCareers = async () => {
      try {
        const careersSnapshot = await getDocs(collection(db, "careers"))
        const careersData = careersSnapshot.docs.map((docSnap) => {
          const data = docSnap.data()
          return {
            ...data,
            // Usar el id del documento de Firestore, no el campo id de los datos
            id: docSnap.id,
          } as Career
        })

        setCareers(careersData)

        if (careersData.length > 0) {
          const firstCareer = careersData[0]
          // Asegurarse de que el id sea string para Firestore
          const careerId = String(firstCareer.id)
          const progressRef = doc(db, "users", userId, "careers", careerId)
          
          // Fetch progress in parallel with setting careers (if needed later)
          const progressSnap = await getDoc(progressRef)
          const userProgress = progressSnap.exists() ? progressSnap.data()?.subjects : {}

          // Build userProgress map for O(1) lookups (Rule 7.2)
          const progressByCode = userProgress ? new Map<string, string>(
            Object.entries(userProgress).map(([code, status]) => [String(code), String(status)])
          ) : new Map<string, string>()

          const subjectsWithStatus = firstCareer.subjects.map((s: Subject) => ({
            ...s,
            status: (progressByCode.get(String(s.code)) ?? "pending") as Subject["status"],
          }))

          // Use functional setState (Rule 5.5)
          setCurrentCareer((prev) => {
            if (prev?.id === firstCareer.id) {
              // Only update if same career to avoid unnecessary updates
              return { ...firstCareer, subjects: subjectsWithStatus }
            }
            return { ...firstCareer, subjects: subjectsWithStatus }
          })
        }
      } catch (error) {
        console.error("Error loading careers:", error)
      } finally {
        setLoadingCareers(false)
      }
    }

    loadCareers()
  }, [userId])

  // 2️⃣ Escuchar cambios en progreso del usuario - narrowed dependencies (Rule 5.3)
  useEffect(() => {
    if (!userId || !currentCareer) return

    const careerId = String(currentCareer.id)
    const progressRef = doc(db, "users", userId, "careers", careerId)
    const unsubscribe = onSnapshot(progressRef, (docSnap) => {
      if (docSnap.exists()) {
        const progressData = docSnap.data()
        // Use functional setState (Rule 5.5)
        setCurrentCareer((prev) => {
          if (!prev || String(prev.id) !== careerId) return prev
          
          // Build progress map for O(1) lookups (Rule 7.2)
          const progressByCode = progressData.subjects 
            ? new Map<string, string>(
                Object.entries(progressData.subjects).map(([code, status]) => [
                  String(code), 
                  String(status)
                ])
              )
            : new Map<string, string>()

          return {
            ...prev,
            subjects: prev.subjects.map((s) => ({
              ...s,
              status: (progressByCode.get(String(s.code)) ?? s.status) as SubjectStatus,
            })),
          }
        })
      }
    })

    return () => unsubscribe()
  }, [userId, currentCareer?.id])

  return { careers, currentCareer, setCurrentCareer, loadingCareers }
}
