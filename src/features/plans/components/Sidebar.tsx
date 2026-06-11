import { useEffect, useMemo, useState } from "react"
import { X, Search, Star } from "lucide-react"
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

function CareerRow({
  career,
  isActive,
  isFavorite,
  onSelect,
  onToggleFavorite,
}: {
  career: Career
  isActive: boolean
  isFavorite: boolean
  onSelect: () => void
  onToggleFavorite: () => void
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        "group w-full text-left rounded-2xl px-4 py-4 transition-all duration-200",
        "border active:scale-[0.99]",
        isActive
          ? "bg-white/[0.07] border-white/15"
          : "bg-transparent border-transparent hover:bg-white/[0.04] hover:border-white/8"
      )}
    >
      <div className="flex items-start gap-3">
        <div
          className={cn(
            "mt-1 h-2 w-2 flex-shrink-0 rounded-full transition-all",
            isActive ? "bg-blue-400 shadow-[0_0_10px_#60a5fa]" : "bg-slate-600 group-hover:bg-slate-400"
          )}
        />

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <span
              className={cn(
                "block text-[15px] sm:text-base font-semibold leading-snug tracking-tight",
                isActive ? "text-white" : "text-slate-100 group-hover:text-white"
              )}
            >
              {career.name}
            </span>

            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                e.preventDefault()
                onToggleFavorite()
              }}
              className={cn(
                "flex-shrink-0 rounded-lg p-1.5 transition-colors",
                isFavorite
                  ? "text-amber-400"
                  : "text-slate-600 opacity-0 group-hover:opacity-100 hover:text-amber-400"
              )}
              aria-label={isFavorite ? "Quitar de favoritos" : "Agregar a favoritos"}
            >
              <Star className={cn("h-4 w-4", isFavorite && "fill-current")} />
            </button>
          </div>

          <p className="mt-1.5 text-sm text-slate-500">
            {career.subjects.length} materias · Plan {career.plan}
          </p>
        </div>
      </div>
    </button>
  )
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
  const [search, setSearch] = useState("")

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
    } else {
      setFavoriteIds([])
      setFavoritesLoaded(true)
    }
  }, [userId])

  useEffect(() => {
    const saveFavorites = async () => {
      try {
        const userRef = doc(db, "users", userId)
        await setDoc(userRef, { favoriteCareers: favoriteIds }, { merge: true })
      } catch (error) {
        console.error("Error saving favorite careers:", error)
      }
    }

    if (userId && favoritesLoaded) {
      void saveFavorites()
    }
  }, [favoriteIds, userId, favoritesLoaded])

  useEffect(() => {
    if (!open) setSearch("")
  }, [open])

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose()
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [open, onClose])

  const toggleFavorite = (id: string) => {
    setFavoriteIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    )
  }

  const filteredCareers = useMemo(() => {
    const q = search.trim().toLowerCase()
    const list = q
      ? careers.filter(
          (c) =>
            c.name.toLowerCase().includes(q) ||
            c.plan.toLowerCase().includes(q)
        )
      : careers

    return [...list].sort((a, b) => {
      const aFav = favoriteIds.includes(a.id)
      const bFav = favoriteIds.includes(b.id)
      if (aFav !== bFav) return aFav ? -1 : 1
      return a.name.localeCompare(b.name)
    })
  }, [careers, favoriteIds, search])

  const favoriteCareers = useMemo(
    () => filteredCareers.filter((c) => favoriteIds.includes(c.id)),
    [filteredCareers, favoriteIds]
  )

  const otherCareers = useMemo(
    () => filteredCareers.filter((c) => !favoriteIds.includes(c.id)),
    [filteredCareers, favoriteIds]
  )

  if (!open) return null

  const handleSelect = (career: Career) => {
    onCareerSelect(career)
    onClose()
  }

  return (
    <>
      <div
        onClick={onClose}
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 animate-fadeIn"
        aria-hidden
      />

      <aside
        className={cn(
          "fixed left-0 top-0 h-full z-50 flex flex-col",
          "w-[min(100vw,360px)] sm:w-[400px]",
          "bg-slate-950/98 border-r border-white/8",
          "animate-slideInLeft",
          "pb-[env(safe-area-inset-bottom)]"
        )}
      >
        <div className="px-5 pt-6 pb-5 border-b border-white/6">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold text-white tracking-tight">
                Carreras
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                {careers.length} disponibles
              </p>
            </div>
            <button
              onClick={onClose}
              className="rounded-xl p-2 text-slate-500 hover:bg-white/5 hover:text-white transition-colors"
              aria-label="Cerrar menú"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="relative mt-5">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar..."
              className="w-full pl-10 pr-4 py-3 rounded-xl bg-white/[0.04] border border-white/8 text-[15px] text-white placeholder:text-slate-500 focus:outline-none focus:border-white/20 transition-colors"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar px-2 py-3">
          {filteredCareers.length === 0 ? (
            <p className="text-sm text-slate-500 text-center py-12">
              No se encontraron carreras
            </p>
          ) : (
            <div className="space-y-6">
              {favoriteCareers.length > 0 && (
                <section>
                  <p className="px-3 mb-2 text-xs font-medium text-slate-500">
                    Favoritas
                  </p>
                  <div className="space-y-1">
                    {favoriteCareers.map((career) => (
                      <CareerRow
                        key={career.id}
                        career={career}
                        isActive={currentCareer?.id === career.id}
                        isFavorite
                        onSelect={() => handleSelect(career)}
                        onToggleFavorite={() => toggleFavorite(career.id)}
                      />
                    ))}
                  </div>
                </section>
              )}

              {otherCareers.length > 0 && (
                <section>
                  {favoriteCareers.length > 0 && (
                    <p className="px-3 mb-2 text-xs font-medium text-slate-500">
                      Todas
                    </p>
                  )}
                  <div className="space-y-1">
                    {otherCareers.map((career) => (
                      <CareerRow
                        key={career.id}
                        career={career}
                        isActive={currentCareer?.id === career.id}
                        isFavorite={false}
                        onSelect={() => handleSelect(career)}
                        onToggleFavorite={() => toggleFavorite(career.id)}
                      />
                    ))}
                  </div>
                </section>
              )}
            </div>
          )}
        </div>

        <div className="px-5 py-4 border-t border-white/6 text-xs text-slate-600 text-center">
          Desarrollado por{" "}
          <a
            href="https://www.linkedin.com/in/tadeo-rimoli-9aa24b1a7/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-slate-400 hover:text-white transition-colors"
          >
            Tadeo Rimoli
          </a>
        </div>
      </aside>
    </>
  )
}
