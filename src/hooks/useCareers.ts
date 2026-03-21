import { useState, useEffect } from "react"
import { collection, doc, getDocs, getDoc, onSnapshot, query, where } from "firebase/firestore"
import { db } from "../lib/firebase"
import type { Career, Subject, SubjectStatus, SubjectType, ExtraRequirement } from "../types"

function normalizeSubjectFromFirestore(s: Record<string, unknown>): Subject {
  const year = s.year as number | null | undefined
  const quadrimester = s.quadrimester as number | null | undefined
  return {
    code: String(s.code ?? ""),
    name: String(s.name ?? ""),
    prerequisites: Array.isArray(s.prerequisites) ? s.prerequisites.map(String) : [],
    year: year != null && typeof year === "number" ? year : null,
    quadrimester: quadrimester != null && typeof quadrimester === "number" ? quadrimester : null,
    type: (s.type === "elective" || s.type === "requirement" ? s.type : "mandatory") as SubjectType,
    groupId: typeof s.groupId === "string" ? s.groupId : undefined,
    status: "pending",
    extraConditions: typeof s.extraConditions === "string" ? s.extraConditions : undefined,
    finalGrade: null,
  }
}

interface UseCareersReturn {
  careers: Career[]
  currentCareer: Career | null
  setCurrentCareer: React.Dispatch<React.SetStateAction<Career | null>>
  loadingCareers: boolean
}

export default function useCareers(
  userId: string | null,
  universityId: string | null
): UseCareersReturn {
  const [careers, setCareers] = useState<Career[]>([])
  const [currentCareer, setCurrentCareer] = useState<Career | null>(null)
  const [loadingCareers, setLoadingCareers] = useState(true)

  // 1️⃣ Cargar todas las carreras - eliminate waterfalls (Rule 1.3, 1.4)
  useEffect(() => {
    if (!universityId) {
      setCareers([])
      setCurrentCareer(null)
      setLoadingCareers(false)
      return
    }

    setLoadingCareers(true)

    const loadCareers = async () => {
      try {
        const careersRef = collection(db, "careers")
        const careersQuery = query(
          careersRef,
          where("universityId", "==", universityId)
        )
        const careersSnapshot = await getDocs(careersQuery)
        const careersData = careersSnapshot.docs.map((docSnap) => {
          const data = docSnap.data()
          const subjects = Array.isArray(data.subjects)
            ? data.subjects.map((s: Record<string, unknown>) => normalizeSubjectFromFirestore(s))
            : []

          const extraRequirements: ExtraRequirement[] = Array.isArray(
            (data as any).extraRequirements
          )
            ? ((data as any).extraRequirements as Array<Record<string, unknown>>).map((r) => ({
                subjectCode: String(r.subjectCode ?? ""),
                minApprovedSubjects:
                  typeof r.minApprovedSubjects === "number" ? r.minApprovedSubjects : undefined,
              }))
            : []

          return {
            ...data,
            id: docSnap.id,
            subjects,
            electiveRules: data.electiveRules ?? [],
            extraRequirements,
          } as Career
        })

        // Leer favoritos del usuario para priorizar la carrera inicial (solo si hay userId)
        let favoriteCareerIds: string[] = []
        if (userId) {
          try {
            const userRef = doc(db, "users", userId)
            const userSnap = await getDoc(userRef)
            if (userSnap.exists()) {
              const userData = userSnap.data() as { favoriteCareers?: unknown }
              const rawFavs = userData.favoriteCareers
              if (Array.isArray(rawFavs)) {
                favoriteCareerIds = rawFavs.filter((id) => typeof id === "string") as string[]
              }
            }
          } catch (error) {
            console.error("Error loading user favorite careers in useCareers:", error)
          }
        }

        // Elegir carrera inicial: una favorita si existe, sino la primera
        const initialCareer =
          careersData.find((c) => favoriteCareerIds.includes(c.id)) ?? careersData[0]

        setCareers(careersData)

        if (initialCareer && userId) {
          // Asegurarse de que el id sea string para Firestore
          const careerId = String(initialCareer.id)
          const progressRef = doc(db, "users", userId, "careers", careerId)
          
          // Fetch progress in parallel with setting careers (if needed later)
          const progressSnap = await getDoc(progressRef)
          const userProgress = progressSnap.exists() ? progressSnap.data()?.subjects : {}

          // Build userProgress map for O(1) lookups (Rule 7.2)
          const progressByCode = userProgress
            ? new Map<string, string>(
            Object.entries(userProgress).map(([code, status]) => [String(code), String(status)])
              )
            : new Map<string, string>()

          const subjectsWithStatus = initialCareer.subjects.map((s: Subject) => ({
            ...s,
            status: (progressByCode.get(String(s.code)) ?? "pending") as Subject["status"],
          }))

          // Use functional setState (Rule 5.5)
          setCurrentCareer((prev) => {
            if (prev?.id === initialCareer.id) {
              // Only update if same career to avoid unnecessary updates
              return { ...initialCareer, subjects: subjectsWithStatus }
            }
            return { ...initialCareer, subjects: subjectsWithStatus }
          })
        }
      } catch (error) {
        console.error("Error loading careers:", error)
      } finally {
        setLoadingCareers(false)
      }
    }

    loadCareers()
  }, [userId, universityId])

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
