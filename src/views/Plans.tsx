import { useState, useEffect, useMemo, useCallback } from "react"
import { Menu, LogOut, Settings, ArrowLeft, LayoutGrid, ChevronRight } from "lucide-react"
import { Link } from "react-router-dom"
import { useAuth } from "../AuthContext"
import { logout } from "../lib/firebase"
import useCareers from "../hooks/useCareers"
import { useUniversities } from "../hooks/useUniversities"
import { useCareerProgress } from "../features/plans/hooks/useCareerProgress"
import {
  useSubjectColumns,
  useNodePositions,
  useProgressStats,
  getGridSubjects,
  getRequirementSubjects,
  getRequiredSubjectsForStats,
} from "../features/plans/hooks/useSubjects"
import { Canvas } from "../features/plans/components/Canvas"
import { Sidebar } from "../features/plans/components/Sidebar"
import { StatsFooter } from "../features/plans/components/StatsFooter"
import { SubjectModal } from "../features/plans/components/SubjectModal"
import { ElectiveSelector } from "../features/plans/components/ElectiveSelector"
import {
  CelebrationOverlay,
  shouldCelebrateStatusChange,
  type CelebrationPayload,
} from "../components/CelebrationOverlay"
import type { Subject, SubjectStatus, University } from "../types"

const AREA_NONE_LABEL = "Sin área"

function normalizeArea(area: string | undefined): string {
  const t = (area ?? "").trim()
  return t || AREA_NONE_LABEL
}

interface UniversitySelectionProps {
  universities: University[]
  onSelect: (id: string) => void
}

function UniversitySelection({ universities, onSelect }: UniversitySelectionProps) {
  if (!universities.length) {
    return (
      <div className="w-screen h-screen flex items-center justify-center bg-slate-950 px-4">
        <div className="text-center space-y-3">
          <p className="text-xs uppercase tracking-[0.2em] text-blue-400/80">
            Bienvenido al visualizador de planes
          </p>
          <p className="text-slate-400 text-sm sm:text-base max-w-md">
            Aún no hay universidades configuradas. Agregá documentos en la colección{" "}
            <span className="font-mono text-slate-200">universities</span> para comenzar.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="w-screen h-screen flex items-center justify-center bg-slate-950 px-4">
      <div className="max-w-4xl w-full space-y-8">
        <div className="text-center space-y-2">
          <p className="text-xs uppercase tracking-[0.2em] text-blue-400/80">
            Bienvenido al visualizador de planes
          </p>
          <h1 className="text-2xl sm:text-3xl font-semibold text-white">
            Elegí tu universidad para ver las carreras
          </h1>
          <p className="text-sm sm:text-base text-slate-400 max-w-2xl mx-auto">
            Elegí tu universidad para cargar y visualizar las carreras asociadas.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
          {universities.map((uni) => (
            <button
              key={uni.id}
              type="button"
              onClick={() => onSelect(uni.id)}
              className="relative flex flex-col items-start gap-2 rounded-2xl border px-4 py-4 sm:px-6 sm:py-5 text-left transition-all duration-200 bg-slate-900/80 border-white/10 hover:border-blue-500/40 hover:bg-slate-900/90"
            >
              <div className="flex items-start gap-3 w-full">
                {uni.logoUrl && (
                  <div className="flex-shrink-0 w-12 h-12 sm:w-14 sm:h-14 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center overflow-hidden">
                    <img
                      src={uni.logoUrl}
                      alt=""
                      className="w-full h-full object-contain"
                    />
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  {uni.acronym && (
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-blue-500/10 border border-blue-500/40 text-[10px] font-medium text-blue-300 mb-1">
                      {uni.acronym}
                    </span>
                  )}
                  <h2 className="text-sm sm:text-base font-semibold text-white">
                    {uni.fullName || uni.id}
                  </h2>
                  <p className="text-xs sm:text-sm text-slate-400">
                    {uni.location || "Ubicación no especificada"}
                    {uni.type ? ` • ${uni.type}` : ""}
                  </p>
                  {uni.website && (
                    <a
                      href={uni.website.startsWith("http") ? uni.website : `https://${uni.website}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="mt-1.5 inline-flex items-center text-xs text-blue-400 hover:text-blue-300 hover:underline"
                    >
                      {uni.website.replace(/^https?:\/\//i, "").replace(/\/$/, "")}
                    </a>
                  )}
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

interface AreaSelectionProps {
  areas: string[]
  universityLabel: string
  onSelect: (area: string) => void
  onBack: () => void
}

function AreaSelection({ areas, universityLabel, onSelect, onBack }: AreaSelectionProps) {
  return (
    <div className="w-screen h-screen flex items-center justify-center bg-slate-950 px-4">
      <div className="max-w-4xl w-full space-y-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <button
            type="button"
            onClick={onBack}
            className="inline-flex items-center gap-2 text-slate-400 hover:text-white text-sm transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Cambiar universidad
          </button>
          <span className="text-slate-500 text-sm border-l border-white/10 pl-4">
            {universityLabel}
          </span>
        </div>
        <div className="text-center space-y-2">
          <p className="text-xs uppercase tracking-[0.2em] text-blue-400/80">
            Paso 2 de 2
          </p>
          <h1 className="text-2xl sm:text-3xl font-semibold text-white">
            Elegí el área para ver las carreras
          </h1>
          <p className="text-sm sm:text-base text-slate-400 max-w-2xl mx-auto">
            Seleccioná el área de tu interés para filtrar las carreras disponibles.
          </p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-5">
          {areas.map((area) => (
            <button
              key={area}
              type="button"
              onClick={() => onSelect(area)}
              className="group relative flex items-center gap-4 rounded-2xl border px-5 py-4 sm:px-6 sm:py-5 text-left transition-all duration-200 bg-slate-900/80 border-white/10 hover:border-blue-500/50 hover:bg-slate-800/90 hover:shadow-lg hover:shadow-blue-500/5"
            >
              <div className="flex-shrink-0 w-11 h-11 sm:w-12 sm:h-12 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 group-hover:bg-blue-500/20 group-hover:border-blue-500/40 transition-colors">
                <LayoutGrid className="w-5 h-5 sm:w-6 sm:h-6" />
              </div>
              <div className="min-w-0 flex-1">
                <h2 className="text-sm sm:text-base font-semibold text-white group-hover:text-blue-50 transition-colors">
                  {area}
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Ver carreras de esta área
                </p>
              </div>
              <ChevronRight className="w-5 h-5 text-slate-500 group-hover:text-blue-400 group-hover:translate-x-0.5 flex-shrink-0 transition-all" />
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

function LoadingScreen() {
  return (
    <div className="w-screen h-screen flex items-center justify-center bg-slate-950">
      <div className="text-center">
        <div className="w-16 h-16 mx-auto mb-4 rounded-full border-2 border-blue-500/30 border-t-blue-500 animate-spin" />
        <p className="text-slate-400 text-lg">Cargando tu plan de estudios...</p>
      </div>
    </div>
  )
}

export default function Plans() {
  const { user, loading: authLoading } = useAuth()
  const [selectedUniversity, setSelectedUniversity] = useState<string | null>(null)
  const [selectedArea, setSelectedArea] = useState<string | null>(null)
  const { universities, loading: loadingUniversities } = useUniversities()
  const { careers, loadingCareers } = useCareers(user?.uid ?? null, selectedUniversity)

  const areas = useMemo(() => {
    const set = new Set<string>()
    for (const c of careers) {
      set.add(normalizeArea(c.area))
    }
    return [...set].sort((a, b) => (a === AREA_NONE_LABEL ? 1 : b === AREA_NONE_LABEL ? -1 : a.localeCompare(b)))
  }, [careers])

  const filteredCareers = useMemo(() => {
    if (!selectedArea) return []
    return careers.filter((c) => normalizeArea(c.area) === selectedArea)
  }, [careers, selectedArea])

  const {
    currentCareer,
    setCurrentCareer,
    selectedElectives,
    saveSelectedElectives,
    updateSubjectStatus,
    updateSubjectFinalGrade,
    loading: loadingProgress,
  } = useCareerProgress(user?.uid ?? null, selectedArea ? filteredCareers : [])

  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [selectedSubject, setSelectedSubject] = useState<Subject | null>(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [loginPromptOpen, setLoginPromptOpen] = useState(false)
  const [hoveredStatus, setHoveredStatus] = useState<SubjectStatus | null>(null)
  const [celebration, setCelebration] = useState<CelebrationPayload | null>(null)

  const currentUniversity = universities.find((u) => u.id === selectedUniversity) || null

  useEffect(() => {
    setSelectedArea(null)
  }, [selectedUniversity])

  const gridSubjects = useMemo(
    () => (currentCareer ? getGridSubjects(currentCareer.subjects, selectedElectives) : []),
    [currentCareer, selectedElectives]
  )
  const requirementSubjects = useMemo(
    () => (currentCareer ? getRequirementSubjects(currentCareer.subjects) : []),
    [currentCareer]
  )
  const requiredForStats = useMemo(
    () => (currentCareer ? getRequiredSubjectsForStats(currentCareer, selectedElectives) : []),
    [currentCareer, selectedElectives]
  )

  // Materias que el usuario puede cursar ahora mismo (tiene correlativas y requisitos extra cumplidos).
  const eligibleSubjectCodes = useMemo(() => {
    if (!currentCareer || !user) return [] as string[]

    const subjects = currentCareer.subjects
    const byCode = new Map(subjects.map((s) => [s.code, s]))

    const COMPLETED_FOR_PREREQ: SubjectStatus[] = [
      "course_completed",
      "promoted",
      "approved_with_final",
    ]
    const COMPLETED_FOR_COUNT: SubjectStatus[] = ["promoted", "approved_with_final"]

    let totalCompleted = 0
    for (const s of subjects) {
      if (COMPLETED_FOR_COUNT.includes(s.status)) {
        totalCompleted++
      }
    }

    const extraReqByCode = new Map<string, number>()
    for (const r of currentCareer.extraRequirements ?? []) {
      if (r.subjectCode && typeof r.minApprovedSubjects === "number" && r.minApprovedSubjects > 0) {
        extraReqByCode.set(r.subjectCode, r.minApprovedSubjects)
      }
    }

    const eligible: string[] = []

    for (const s of subjects) {
      // Solo nos interesan materias pendientes; si ya están en curso o aprobadas, no son "para cursar".
      if (s.status !== "pending") continue

      // Correlativas: todas deben estar al menos cursadas/completadas.
      let prereqsOk = true
      for (const code of s.prerequisites) {
        const prereq = byCode.get(code)
        const st = prereq?.status ?? "pending"
        if (!COMPLETED_FOR_PREREQ.includes(st)) {
          prereqsOk = false
          break
        }
      }
      if (!prereqsOk) continue

      // Requisitos extra tipo "25 materias aprobadas".
      const minApproved = extraReqByCode.get(s.code)
      if (minApproved && totalCompleted < minApproved) {
        continue
      }

      eligible.push(s.code)
    }

    return eligible
  }, [currentCareer, user])

  const columns = useSubjectColumns(gridSubjects)
  const columnsWithReqs = useMemo(() => {
    if (requirementSubjects.length === 0) return columns
    return [
      { key: "requisitos", year: 0, quadrimester: 0, subjects: requirementSubjects },
      ...columns,
    ]
  }, [columns, requirementSubjects])
  const nodePositions = useNodePositions(columnsWithReqs)
  const canvasSubjects = useMemo(
    () => [...gridSubjects, ...requirementSubjects],
    [gridSubjects, requirementSubjects]
  )
  const stats = useProgressStats(requiredForStats)

  useEffect(() => {
    document.title = "Visualizador de planes de estudio"
  }, [])

  const handleCareerSelect = async (career: typeof careers[0]) => {
    await setCurrentCareer(career)
    setSidebarOpen(false)
  }

  const handleSubjectClick = (subject: Subject) => {
    setSelectedSubject(subject)
    if (!user) {
      setLoginPromptOpen(true)
    } else {
      setModalOpen(true)
    }
  }

  const handleStatusChange = async (subjectId: string, status: SubjectStatus) => {
    const previousStatus =
      currentCareer?.subjects.find((s) => s.code === subjectId)?.status ?? "pending"
    const subjectName =
      currentCareer?.subjects.find((s) => s.code === subjectId)?.name ?? "Materia"

    await updateSubjectStatus(subjectId, status)

    if (shouldCelebrateStatusChange(previousStatus, status)) {
      setCelebration({ subjectName, status })
    }
  }

  const handleCelebrationComplete = useCallback(() => {
    setCelebration(null)
  }, [])

  const handleFinalGradeChange = async (subjectId: string, grade: number | null) => {
    await updateSubjectFinalGrade(subjectId, grade)
  }

  const handleCloseModal = () => {
    setModalOpen(false)
    setSelectedSubject(null)
  }

  if (authLoading || loadingUniversities || loadingCareers || loadingProgress) {
    return <LoadingScreen />
  }

  if (!selectedUniversity) {
    return (
      <UniversitySelection
        universities={universities}
        onSelect={setSelectedUniversity}
      />
    )
  }

  if (careers.length === 0) {
    return (
      <div className="w-screen h-screen flex items-center justify-center bg-slate-950 px-4">
        <div className="text-center space-y-4">
          <p className="text-slate-400 text-lg">No hay carreras en esta universidad.</p>
          <button
            type="button"
            onClick={() => setSelectedUniversity(null)}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-white/20 text-slate-300 hover:bg-white/5 text-sm"
          >
            <ArrowLeft className="w-4 h-4" />
            Elegir otra universidad
          </button>
        </div>
      </div>
    )
  }

  if (!selectedArea) {
    return (
      <AreaSelection
        areas={areas}
        universityLabel={currentUniversity?.acronym || currentUniversity?.fullName || currentUniversity?.id || selectedUniversity}
        onSelect={setSelectedArea}
        onBack={() => setSelectedUniversity(null)}
      />
    )
  }

  if (filteredCareers.length === 0) {
    return (
      <div className="w-screen h-screen flex items-center justify-center bg-slate-950 px-4">
        <div className="text-center space-y-4">
          <p className="text-slate-400 text-lg">No hay carreras en el área seleccionada.</p>
          <button
            type="button"
            onClick={() => setSelectedArea(null)}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-white/20 text-slate-300 hover:bg-white/5 text-sm"
          >
            <ArrowLeft className="w-4 h-4" />
            Elegir otro área
          </button>
        </div>
      </div>
    )
  }

  if (!currentCareer) {
    return <LoadingScreen />
  }

  return (
    <div className="w-screen h-screen flex flex-col bg-slate-950 overflow-hidden">
      {/* Header */}
      <header className="relative z-30 px-3 sm:px-4 py-2 sm:py-3 border-b border-white/5 bg-slate-900/95 backdrop-blur-md pt-[max(0.5rem,env(safe-area-inset-top))]">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
            <button
              onClick={() => setSidebarOpen(true)}
              className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 transition-colors flex-shrink-0 active:scale-95"
              aria-label="Abrir menú de carreras"
            >
              <Menu className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
              <span className="text-lg sm:text-2xl flex-shrink-0">{currentCareer.icon}</span>
              <div className="min-w-0 flex-1">
                <h1 className="text-white font-semibold text-sm sm:text-base truncate">
                  {currentCareer.name}
                </h1>
                <div className="flex items-center gap-1.5 flex-wrap">
                  <p className="text-[10px] sm:text-xs text-slate-500">
                    Plan {currentCareer.plan}
                  </p>
                  {currentUniversity && selectedArea && (
                    <span className="sm:hidden text-[10px] text-slate-500 truncate max-w-[140px]">
                      • {currentUniversity.acronym || currentUniversity.id}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            {user?.uid === import.meta.env.VITE_ADMIN_UID && (
              <Link
                to="/admin"
                className="hidden sm:flex items-center gap-2 px-2.5 py-1.5 rounded-lg border border-white/20 text-slate-400 hover:text-white hover:bg-white/5 text-xs font-medium"
              >
                <Settings className="w-4 h-4" />
                Admin
              </Link>
            )}
            {currentUniversity && selectedArea && (
              <>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedArea(null)
                    setSidebarOpen(false)
                  }}
                  className="hidden sm:inline-flex items-center px-2.5 py-1 rounded-full border border-slate-500/40 bg-slate-500/10 text-[11px] text-slate-300 hover:bg-slate-500/20 transition-colors"
                  title="Cambiar área"
                >
                  {selectedArea}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedUniversity(null)
                    setSelectedArea(null)
                    setSidebarOpen(false)
                  }}
                  className="hidden sm:inline-flex items-center px-2.5 py-1 rounded-full border border-blue-500/40 bg-blue-500/10 text-[11px] text-blue-300 hover:bg-blue-500/20 transition-colors"
                  title="Cambiar universidad"
                >
                  {currentUniversity.acronym || currentUniversity.fullName || currentUniversity.id}
                </button>
              </>
            )}
            {user && (
              <div className="hidden sm:flex flex-col items-end mr-1">
                <span className="text-[11px] text-slate-200 font-medium max-w-[180px] truncate">
                  {user.email || user.displayName || "Usuario"}
                </span>
              </div>
            )}
            {user ? (
              <button
                onClick={logout}
                className="flex items-center gap-2 px-3 py-2 rounded-xl bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-400 text-xs sm:text-sm transition-colors"
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:inline">Salir</span>
              </button>
            ) : (
              <Link
                to="/login"
                className="flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-2 rounded-xl bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/20 text-blue-300 text-xs sm:text-sm transition-colors active:scale-95"
              >
                <LogOut className="w-4 h-4" />
                <span className="sr-only sm:not-sr-only sm:inline">Iniciar sesión</span>
              </Link>
            )}
          </div>
        </div>
      </header>

      {/* Sidebar */}
      <Sidebar
        open={sidebarOpen}
        careers={filteredCareers}
        currentCareer={currentCareer}
        onClose={() => setSidebarOpen(false)}
        onCareerSelect={handleCareerSelect}
        userId={user?.uid ?? ""}
      />

      {/* Electives + Canvas + Requirements */}
      <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
        {(currentCareer.electiveRules?.length ?? 0) > 0 && (
          <div className="pointer-events-none fixed bottom-36 sm:bottom-6 right-3 sm:right-6 z-30 w-[min(calc(100%-1.5rem),420px)] sm:w-[420px]">
            <ElectiveSelector
              career={currentCareer}
              allSubjects={currentCareer.subjects}
              selectedElectives={selectedElectives}
              onSave={saveSelectedElectives}
            />
          </div>
        )}
        <div className="flex-1 min-h-[50vh] flex flex-col">
          <Canvas
            subjects={canvasSubjects}
            nodePositions={nodePositions}
            columns={columnsWithReqs}
            onSubjectClick={handleSubjectClick}
            hoveredStatus={hoveredStatus}
            eligibleSubjectCodes={eligibleSubjectCodes}
          />
        </div>
      </div>

      {/* Stats Footer */}
      <StatsFooter
        subjects={requiredForStats}
        stats={stats}
        onStatusHover={setHoveredStatus}
      />

      <CelebrationOverlay payload={celebration} onComplete={handleCelebrationComplete} />

      {/* Modal de materia (solo usuarios logueados) */}
      <SubjectModal
        open={modalOpen}
        subject={selectedSubject}
        allSubjects={currentCareer.subjects}
        onClose={handleCloseModal}
        onStatusChange={handleStatusChange}
        onFinalGradeChange={handleFinalGradeChange}
      />

      {/* Modal para invitar a iniciar sesión al intentar guardar progreso */}
      {loginPromptOpen && selectedSubject && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            onClick={() => setLoginPromptOpen(false)}
          />
          <div className="relative w-full max-w-md rounded-2xl bg-slate-900 border border-white/10 shadow-2xl p-5 sm:p-6">
            <h2 className="text-lg sm:text-xl font-semibold text-white mb-2">
              Inicia sesión para guardar tu progreso
            </h2>
            <p className="text-sm text-slate-300 mb-3">
              Estás viendo la materia{" "}
              <span className="font-semibold text-white">{selectedSubject.name}</span>.
            </p>
            <p className="text-sm text-slate-400 mb-5">
              Para marcar materias como cursadas, aprobadas o guardar notas, necesitás iniciar
              sesión. Así tu avance queda guardado y disponible en cualquier dispositivo.
            </p>
            <div className="flex flex-col sm:flex-row gap-2 justify-end">
              <button
                type="button"
                onClick={() => setLoginPromptOpen(false)}
                className="px-4 py-2 rounded-lg border border-white/20 text-slate-300 hover:bg-white/5 text-sm"
              >
                Seguir viendo el plan
              </button>
              <Link
                to="/login"
                className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-blue-500 hover:bg-blue-600 text-white text-sm font-medium"
                onClick={() => setLoginPromptOpen(false)}
              >
                Ir a iniciar sesión
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
