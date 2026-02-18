import { useState, useEffect } from "react"
import { Menu, LogOut } from "lucide-react"
import { useAuth } from "../AuthContext"
import { logout } from "../lib/firebase"
import useCareers from "../hooks/useCareers"
import { useCareerProgress } from "../features/plans/hooks/useCareerProgress"
import { useSubjectColumns, useNodePositions, useProgressStats } from "../features/plans/hooks/useSubjects"
import { Canvas } from "../features/plans/components/Canvas"
import { Sidebar } from "../features/plans/components/Sidebar"
import { StatsFooter } from "../features/plans/components/StatsFooter"
import { SubjectModal } from "../features/plans/components/SubjectModal"
import type { Subject, SubjectStatus } from "../types"

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
  const { careers, loadingCareers } = useCareers(user?.uid ?? null)
  const {
    currentCareer,
    setCurrentCareer,
    updateSubjectStatus,
    updateSubjectFinalGrade,
    loading: loadingProgress,
  } = useCareerProgress(user?.uid ?? null, careers)

  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [selectedSubject, setSelectedSubject] = useState<Subject | null>(null)
  const [modalOpen, setModalOpen] = useState(false)

  const columns = useSubjectColumns(currentCareer?.subjects || [])
  const nodePositions = useNodePositions(columns)
  const stats = useProgressStats(currentCareer?.subjects || [])

  useEffect(() => {
    document.title = "Visualizador de correlativas"
  }, [])

  const handleCareerSelect = async (career: typeof careers[0]) => {
    await setCurrentCareer(career)
    setSidebarOpen(false)
  }

  const handleSubjectClick = (subject: Subject) => {
    setSelectedSubject(subject)
    setModalOpen(true)
  }

  const handleStatusChange = async (subjectId: string, status: SubjectStatus) => {
    await updateSubjectStatus(subjectId, status)
  }

  const handleFinalGradeChange = async (subjectId: string, grade: number | null) => {
    await updateSubjectFinalGrade(subjectId, grade)
  }

  const handleCloseModal = () => {
    setModalOpen(false)
    setSelectedSubject(null)
  }

  if (authLoading || loadingCareers || loadingProgress) {
    return <LoadingScreen />
  }

  if (!user) {
    return (
      <div className="w-screen h-screen flex items-center justify-center bg-slate-950">
        <p className="text-slate-400 text-xl">Por favor, inicia sesión</p>
      </div>
    )
  }

  if (!currentCareer) {
    return (
      <div className="w-screen h-screen flex items-center justify-center bg-slate-950">
        <p className="text-slate-400 text-xl">No hay carreras disponibles</p>
      </div>
    )
  }

  return (
    <div className="w-screen h-screen flex flex-col bg-slate-950 overflow-hidden">
      {/* Header */}
      <header className="relative z-30 px-3 sm:px-4 py-2 sm:py-3 border-b border-white/5 bg-slate-900/95">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <button
              onClick={() => setSidebarOpen(true)}
              className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 transition-colors flex-shrink-0"
            >
              <Menu className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2 sm:gap-3 min-w-0">
              <span className="text-xl sm:text-2xl flex-shrink-0">{currentCareer.icon}</span>
              <div className="min-w-0">
                <h1 className="text-white font-semibold text-sm sm:text-base truncate">
                  {currentCareer.name}
                </h1>
                <p className="text-[10px] sm:text-xs text-slate-500">Plan {currentCareer.plan}</p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            <span className="text-[10px] text-slate-600 hidden sm:inline">
              Desarrollado por Tadeo Rimoli
            </span>
            <button
              onClick={logout}
              className="flex items-center gap-2 px-3 py-2 rounded-xl bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-400 text-xs sm:text-sm transition-colors"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Salir</span>
            </button>
          </div>
        </div>
      </header>

      {/* Sidebar */}
      <Sidebar
        open={sidebarOpen}
        careers={careers}
        currentCareer={currentCareer}
        onClose={() => setSidebarOpen(false)}
        onCareerSelect={handleCareerSelect}
      />

      {/* Canvas */}
      <Canvas
        subjects={currentCareer.subjects}
        nodePositions={nodePositions}
        columns={columns}
        onSubjectClick={handleSubjectClick}
      />

      {/* Stats Footer */}
      <StatsFooter subjects={currentCareer.subjects} stats={stats} />

      {/* Modal */}
      <SubjectModal
        open={modalOpen}
        subject={selectedSubject}
        allSubjects={currentCareer.subjects}
        onClose={handleCloseModal}
        onStatusChange={handleStatusChange}
        onFinalGradeChange={handleFinalGradeChange}
      />
    </div>
  )
}
