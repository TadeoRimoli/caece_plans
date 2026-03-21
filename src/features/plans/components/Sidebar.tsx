import { useEffect, useMemo, useState } from "react"
import { X, GraduationCap, Sparkles, Star } from "lucide-react"
import { doc, getDoc, setDoc } from "firebase/firestore"
import { cn } from "../../../lib/utils"
import { db } from "../../../lib/firebase"
import type { Career } from "../../../types"

interface SidebarProps {
  open: boolean
  careers: Career[]
  currentCareer: Career | null
  onClose: () => void
  onCareerSelect: (career: Career) => void
  userId: string
}

export function Sidebar({
  open,
  careers,
  currentCareer,
  onClose,
  onCareerSelect,
  userId,
}: SidebarProps) {
  const [favoriteIds, setFavoriteIds] = useState<string[]>([])
  const [favoritesLoaded, setFavoritesLoaded] = useState(false)

  useEffect(() => {
    const loadFavorites = async () => {
      try {
        const userRef = doc(db, "users", userId)
        const snap = await getDoc(userRef)
        if (snap.exists()) {
          const data = snap.data() as { favoriteCareers?: unknown }
          const raw = data.favoriteCareers
          if (Array.isArray(raw)) {
            setFavoriteIds(raw.filter((id) => typeof id === "string") as string[])
          }
        }
        setFavoritesLoaded(true)
      } catch (error) {
        console.error("Error loading favorite careers:", error)
        setFavoritesLoaded(true)
      }
    }

    if (userId) {
      setFavoriteIds([])
      setFavoritesLoaded(false)
      void loadFavorites()
    }
  }, [userId])

  useEffect(() => {
    const saveFavorites = async () => {
      try {
        const userRef = doc(db, "users", userId)
        await setDoc(
          userRef,
          { favoriteCareers: favoriteIds },
          { merge: true }
        )
      } catch (error) {
        console.error("Error saving favorite careers:", error)
      }
    }

    if (userId && favoritesLoaded) {
      void saveFavorites()
    }
  }, [favoriteIds, userId, favoritesLoaded])

  const toggleFavorite = (id: string) => {
    setFavoriteIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    )
  }

  const orderedCareers = useMemo(() => {
    if (!careers.length) return careers
    return [...careers].sort((a, b) => {
      const aFav = favoriteIds.includes(a.id)
      const bFav = favoriteIds.includes(b.id)

      if (aFav === bFav) {
        return a.name.localeCompare(b.name)
      }

      return aFav ? -1 : 1
    })
  }, [careers, favoriteIds])

  if (!open) return null

  return (
    <>
      <div
        onClick={onClose}
        className="fixed inset-0 bg-black/60 z-40 animate-fadeIn"
      />
      <aside className="fixed left-0 top-0 h-full w-72 sm:w-80 bg-slate-900/98 border-r border-white/5 z-50 animate-slideInLeft flex flex-col">
        <div className="p-4 sm:p-6 border-b border-white/5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <GraduationCap className="w-6 h-6 text-blue-400" />
            <h2 className="text-lg font-bold text-white">CAECE</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-white/5 text-slate-400 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 p-4 space-y-2 overflow-y-auto">
          <p className="text-xs text-slate-500 uppercase tracking-wider mb-3 px-2">
            Carreras disponibles
          </p>
          {orderedCareers.map((career) => {
            const isActive = currentCareer?.id === career.id
            const isFavorite = favoriteIds.includes(career.id)
            return (
              <div
                key={career.id}
                role="button"
                tabIndex={0}
                onClick={() => {
                  onCareerSelect(career)
                  onClose()
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault()
                    onCareerSelect(career)
                    onClose()
                  }
                }}
                className={cn(
                  "w-full p-3 sm:p-4 rounded-xl text-left transition-all duration-200 cursor-pointer",
                  isActive
                    ? "bg-white/10 border border-white/10"
                    : "hover:bg-white/5 border border-transparent"
                )}
              >
                <div className="flex items-start gap-3">
                  <div className="text-xl sm:text-2xl bg-white/5 rounded-lg p-2">
                    {career.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3
                      className={cn(
                        "font-medium text-white text-sm sm:text-base truncate",
                        isActive && "text-blue-400"
                      )}
                    >
                      {career.name}
                    </h3>
                    <p className="text-xs text-slate-500 mt-1">
                      {career.subjects.length} materias • {career.year}º año • Plan {career.plan}
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-1 flex-shrink-0">
                    {isActive && (
                      <Sparkles className="w-4 h-4 text-blue-400" />
                    )}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation()
                        e.preventDefault()
                        toggleFavorite(career.id)
                      }}
                      className={cn(
                        "p-1 rounded-full border border-transparent transition-colors",
                        isFavorite
                          ? "text-yellow-400 border-yellow-400/40 bg-yellow-400/10"
                          : "text-slate-500 hover:text-yellow-400 hover:bg-white/5"
                      )}
                      aria-label={
                        isFavorite
                          ? "Quitar carrera de favoritos"
                          : "Marcar carrera como favorita"
                      }
                    >
                      <Star
                        className={cn(
                          "w-4 h-4",
                          isFavorite ? "fill-yellow-400" : "fill-transparent"
                        )}
                      />
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        <div className="p-3 border-t border-white/5 text-[10px] text-slate-500 text-center">
          Desarrollado por{" "}
          <a
            href="https://www.linkedin.com/in/tadeo-rimoli-9aa24b1a7/"
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium text-slate-300 hover:text-blue-400 underline underline-offset-2"
          >
            Tadeo Rimoli
          </a>
        </div>
      </aside>
    </>
  )
}
