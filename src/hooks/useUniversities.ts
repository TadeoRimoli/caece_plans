import { useEffect, useState } from "react"
import { collection, getDocs } from "firebase/firestore"
import { db } from "../lib/firebase"
import type { University } from "../types"

interface UseUniversitiesReturn {
  universities: University[]
  loading: boolean
}

export function useUniversities(): UseUniversitiesReturn {
  const [universities, setUniversities] = useState<University[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      try {
        const snapshot = await getDocs(collection(db, "universities"))
        const data: University[] = snapshot.docs.map((docSnap) => {
          const raw = docSnap.data()
          return {
            id: docSnap.id,
            ...(raw as Omit<University, "id">),
          }
        })

        setUniversities(data)
      } catch (error) {
        console.error("Error loading universities:", error)
      } finally {
        setLoading(false)
      }
    }

    load()
  }, [])

  return { universities, loading }
}

