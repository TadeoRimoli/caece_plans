import { useReducer, useCallback, useMemo, useRef, memo } from "react"
import { doc, getDoc, setDoc } from "firebase/firestore"
import { 
  Menu, 
  X, 
  LogOut, 
  GraduationCap, 
  Sparkles,
  ChevronRight,
  BookOpen,
  TrendingUp
} from "lucide-react"

import { NODE_WIDTH } from "../constants"
import {
  type Subject,
  type Career,
  type NodePosition,
  type SubjectStatus,
  STATUS_LIST,
  STATUS_META,
} from "../types"
import { db, logout } from "../lib/firebase"
import { useAuth } from "../AuthContext"
import { cn } from "../lib/utils"
import ConnectionLines from "../components/connection-lines"
import SubjectModal from "../components/SubjectModal"
import SubjectNode from "../components/SubjectNode"
import useCareers from "../hooks/useCareers"

// ----------------------
// State Management
// ----------------------
interface PlansState {
  selectedSubject: Subject | null
  modalOpen: boolean
  hoveredSubject: string | null
  scale: number
  position: { x: number; y: number }
  isDragging: boolean
  dragStart: { x: number; y: number }
  sidebarOpen: boolean
}

type PlansAction =
  | { type: "SET_SELECTED_SUBJECT"; subject: Subject | null }
  | { type: "TOGGLE_MODAL"; open: boolean }
  | { type: "SET_POSITION"; position: { x: number; y: number } }
  | { type: "SET_SCALE"; scale: number }
  | { type: "SET_SIDEBAR"; open: boolean }
  | { type: "SET_HOVERED"; subjectId: string | null }
  | { type: "SET_DRAGGING"; dragging: boolean; start?: { x: number; y: number } }

const initialState: PlansState = {
  selectedSubject: null,
  modalOpen: false,
  hoveredSubject: null,
  scale: 1,
  position: { x: 0, y: 0 },
  isDragging: false,
  dragStart: { x: 0, y: 0 },
  sidebarOpen: false,
}

function plansReducer(state: PlansState, action: PlansAction): PlansState {
  switch (action.type) {
    case "SET_SELECTED_SUBJECT":
      return { ...state, selectedSubject: action.subject }
    case "TOGGLE_MODAL":
      return { ...state, modalOpen: action.open }
    case "SET_POSITION":
      return { ...state, position: action.position }
    case "SET_SCALE":
      return { ...state, scale: action.scale }
    case "SET_SIDEBAR":
      return { ...state, sidebarOpen: action.open }
    case "SET_HOVERED":
      return { ...state, hoveredSubject: action.subjectId }
    case "SET_DRAGGING":
      return {
        ...state,
        isDragging: action.dragging,
        dragStart: action.start ?? state.dragStart,
      }
    default:
      return state
  }
}

// ----------------------
// Simple Static Background - hoist static styles (Rule 6.3, 7.1)
// ----------------------
const dotPatternStyle = {
  backgroundImage: `radial-gradient(circle at 1px 1px, rgba(148, 163, 184, 0.3) 1px, transparent 0)`,
  backgroundSize: "40px 40px",
} as const

const DotGridBackground = memo(() => (
  <div className="absolute inset-0 overflow-hidden pointer-events-none">
    <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950" />
    <div 
      className="absolute inset-0 opacity-30"
      style={dotPatternStyle}
    />
    <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-500/5 rounded-full blur-[120px]" />
    <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-500/5 rounded-full blur-[120px]" />
  </div>
))
DotGridBackground.displayName = 'DotGridBackground'

// ----------------------
// Loading Screen
// ----------------------
const LoadingScreen = () => (
  <div className="w-screen h-screen flex items-center justify-center bg-slate-950">
    <div className="text-center">
      <div className="w-16 h-16 mx-auto mb-4 rounded-full border-2 border-blue-500/30 border-t-blue-500 animate-spin" />
      <p className="text-slate-400 text-lg">Cargando tu plan de estudios...</p>
    </div>
  </div>
)

// ----------------------
// Stats Footer Component
// ----------------------
interface StatsFooterProps {
  subjects: Subject[]
  stats: { total: number; completed: number; percentage: number }
}

const StatsFooter = memo(({ subjects, stats }: StatsFooterProps) => {
  // Build subject status index map for O(1) lookups (Rule 7.2)
  const statusCounts = useMemo(() => {
    // Build index map of subjects by status
    const subjectsByStatus = new Map<SubjectStatus, number>()
    for (const subject of subjects) {
      const count = subjectsByStatus.get(subject.status) || 0
      subjectsByStatus.set(subject.status, count + 1)
    }

    // Build result array using Map for efficiency
    return STATUS_LIST.map(status => ({
      ...status,
      count: subjectsByStatus.get(status.value) || 0,
      meta: STATUS_META[status.value]
    })).filter(s => s.count > 0)
  }, [subjects])

  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-30 animate-slideUp">
      <div className={cn(
        "flex items-center gap-3 sm:gap-4 px-4 sm:px-6 py-3 sm:py-4",
        "rounded-2xl sm:rounded-full",
        "bg-slate-900/95",
        "border border-white/10",
        "shadow-2xl shadow-black/50"
      )}>
        {/* Progress section */}
        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500/20 to-emerald-600/20 border border-emerald-500/30">
            <TrendingUp className="w-5 h-5 text-emerald-400" />
          </div>
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2">
              <div className="w-24 sm:w-32 h-2 rounded-full bg-slate-700 overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-emerald-400 transition-all duration-500"
                  style={{ width: `${stats.percentage}%` }}
                />
              </div>
              <span className="text-xs sm:text-sm font-semibold text-emerald-400">
                {stats.percentage}%
              </span>
            </div>
            <span className="text-[10px] sm:text-xs text-slate-500">
              {stats.completed} de {stats.total} materias
            </span>
          </div>
        </div>

        {/* Divider */}
        <div className="w-px h-8 bg-white/10" />

        {/* Status badges */}
        <div className="flex items-center gap-2 sm:gap-3">
          {statusCounts.map((status) => (
            <div
              key={status.value}
              className="flex items-center gap-1.5 sm:gap-2 px-2 sm:px-3 py-1 sm:py-1.5 rounded-full transition-transform hover:scale-105"
              style={{
                backgroundColor: `${status.meta.color}15`,
                border: `1px solid ${status.meta.color}30`
              }}
            >
              <div
                className="w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full"
                style={{ 
                  backgroundColor: status.meta.color,
                  boxShadow: `0 0 6px ${status.meta.color}60`
                }}
              />
              <span 
                className="text-[10px] sm:text-xs font-medium"
                style={{ color: status.meta.color }}
              >
                {status.count}
              </span>
              <span className="hidden md:inline text-[10px] sm:text-xs text-slate-500">
                {status.meta.label}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
})

StatsFooter.displayName = 'StatsFooter'

// ----------------------
// Main Component
// ----------------------
function Plans() {
  const { user, loading: authLoading } = useAuth()
  const { careers, currentCareer, setCurrentCareer, loadingCareers } = useCareers(user?.uid ?? null)

  const [state, dispatch] = useReducer(plansReducer, initialState)
  const containerRef = useRef<HTMLDivElement>(null)

  // Group subjects by year/quadrimester
  const columns = useMemo(() => {
    if (!currentCareer) return { keys: [], map: {} as Record<string, Subject[]> }

    const map = currentCareer.subjects.reduce((acc, subject) => {
      const key = `${subject.year}-${subject.quadrimester}`
      if (!acc[key]) acc[key] = []
      acc[key].push(subject)
      return acc
    }, {} as Record<string, Subject[]>)

    const keys = Object.keys(map).sort((a, b) => {
      const [yearA, quadA] = a.split("-").map(Number)
      const [yearB, quadB] = b.split("-").map(Number)
      return yearA - yearB || quadA - quadB
    })

    return { keys, map }
  }, [currentCareer])

  // Node positions - using larger spacing for bigger cards
  const nodePositions = useMemo(() => {
    const positions: Record<string, NodePosition> = {}
    columns.keys.forEach((key, colIdx) => {
      columns.map[key].forEach((subject, rowIdx) => {
        positions[String(subject.code)] = {
          x: colIdx * 420 + 150,
          y: 200 + rowIdx * 280,
        }
      })
    })
    return positions
  }, [columns])

  // Progress stats - single iteration instead of filter (Rule 7.6)
  const stats = useMemo(() => {
    if (!currentCareer) return { total: 0, completed: 0, percentage: 0 }
    const total = currentCareer.subjects.length
    // Single loop instead of filter (Rule 7.6: combine multiple array iterations)
    let completed = 0
    for (const subject of currentCareer.subjects) {
      if (subject.status === "approved_with_final" || subject.status === "promoted") {
        completed++
      }
    }
    return { total, completed, percentage: Math.round((completed / total) * 100) }
  }, [currentCareer])

  // Handlers
  const handleCareerChange = useCallback(
    async (career: Career) => {
      if (!user) return
      const progressRef = doc(db, "users", user.uid, "careers", String(career.id))
      const progressSnap = await getDoc(progressRef)
      const userProgress = progressSnap.exists() ? progressSnap.data()?.subjects : {}

      const subjectsWithStatus = career.subjects.map((s) => ({
        ...s,
        status: userProgress?.[String(s.code)] ?? "pending",
      }))

      setCurrentCareer({ ...career, subjects: subjectsWithStatus })
      dispatch({ type: "SET_SIDEBAR", open: false })

      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect()
        dispatch({ type: "SET_POSITION", position: { x: rect.width / 4, y: 50 } })
      }
    },
    [user, setCurrentCareer],
  )

  const handleNodeClick = useCallback((subject: Subject) => {
    dispatch({ type: "SET_SELECTED_SUBJECT", subject })
    dispatch({ type: "TOGGLE_MODAL", open: true })
  }, [])

  const handleStatusChange = useCallback(
    async (subjectId: string, newStatus: SubjectStatus) => {
      if (!user || !currentCareer) return

      // Optimistic update - update local state immediately
      const updatedSubjects = currentCareer.subjects.map((s) =>
        String(s.code) === subjectId ? { ...s, status: newStatus } : s
      )
      
      setCurrentCareer({ ...currentCareer, subjects: updatedSubjects })

      // Then sync with Firebase in background
      try {
        const progressRef = doc(db, "users", user.uid, "careers", String(currentCareer.id))
        const progressDoc = await getDoc(progressRef)
        const currentProgress = progressDoc.exists() ? progressDoc.data() : { subjects: {} }

        await setDoc(
          progressRef,
          {
            ...currentProgress,
            subjects: {
              ...currentProgress.subjects,
              [subjectId]: newStatus,
            },
            lastUpdated: new Date(),
          },
          { merge: true },
        )
      } catch (error) {
        console.error("Error saving progress:", error)
        // Revert on error
        setCurrentCareer(currentCareer)
      }
    },
    [user, currentCareer, setCurrentCareer],
  )

  // Zoom handler - direct update for smooth zoom (Rule 7.8: early return)
  const lastZoomRef = useRef(Date.now())
  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault()
    const now = Date.now()
    if (now - lastZoomRef.current < 16) return // Throttle a ~60fps
    lastZoomRef.current = now
    
    const delta = e.deltaY > 0 ? 0.9 : 1.1
    const newScale = Math.max(0.3, Math.min(2, state.scale * delta))
    dispatch({ type: "SET_SCALE", scale: newScale })
  }, [state.scale])

  // Mouse drag handlers - use transitions for position updates (Rule 5.7)
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    dispatch({
      type: "SET_DRAGGING",
      dragging: true,
      start: { x: e.clientX - state.position.x, y: e.clientY - state.position.y },
    })
  }, [state.position])

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!state.isDragging) return
    // Direct update for smooth dragging (Rule 7.8: early return)
    dispatch({
      type: "SET_POSITION",
      position: { x: e.clientX - state.dragStart.x, y: e.clientY - state.dragStart.y },
    })
  }, [state.isDragging, state.dragStart])

  const handleMouseUp = useCallback(() => {
    dispatch({ type: "SET_DRAGGING", dragging: false })
  }, [])

  // Touch handlers for mobile
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      const touch = e.touches[0]
      dispatch({
        type: "SET_DRAGGING",
        dragging: true,
        start: { x: touch.clientX - state.position.x, y: touch.clientY - state.position.y },
      })
    }
  }, [state.position])

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!state.isDragging || e.touches.length !== 1) return
    const touch = e.touches[0]
    // Direct update for smooth touch dragging (Rule 7.8: early return)
    dispatch({
      type: "SET_POSITION",
      position: { x: touch.clientX - state.dragStart.x, y: touch.clientY - state.dragStart.y },
    })
  }, [state.isDragging, state.dragStart])

  const handleTouchEnd = useCallback(() => {
    dispatch({ type: "SET_DRAGGING", dragging: false })
  }, [])

  // Hover handler - direct update for instant feedback (Rule 4.1: defer state reads)
  const handleHover = useCallback((subjectId: string | null) => {
    dispatch({ type: "SET_HOVERED", subjectId })
  }, [])

  const handleCloseModal = useCallback(() => {
    dispatch({ type: "TOGGLE_MODAL", open: false })
    dispatch({ type: "SET_SELECTED_SUBJECT", subject: null })
  }, [])

  // Loading states
  if (authLoading || loadingCareers) {
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
      {/* Minimal Header */}
      <header className="relative z-30 px-3 sm:px-4 py-2 sm:py-3 border-b border-white/5 bg-slate-900/95">
        <div className="flex items-center justify-between gap-2">
          {/* Left side - Menu & Career name */}
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <button
              onClick={() => dispatch({ type: "SET_SIDEBAR", open: true })}
              className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 transition-colors flex-shrink-0"
            >
              <Menu className="w-5 h-5" />
            </button>
            
            <div className="flex items-center gap-2 sm:gap-3 min-w-0">
              <span className="text-xl sm:text-2xl flex-shrink-0">{currentCareer.icon}</span>
              <div className="min-w-0">
                <h1 className="text-white font-semibold text-sm sm:text-base truncate">{currentCareer.name}</h1>
                <p className="text-[10px] sm:text-xs text-slate-500">Plan {currentCareer.plan}</p>
              </div>
            </div>
          </div>

          {/* Right side - Just logout */}
          <button
            onClick={logout}
            className="flex items-center gap-2 px-3 py-2 rounded-xl bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-400 text-xs sm:text-sm transition-colors flex-shrink-0"
          >
            <LogOut className="w-4 h-4" />
            <span className="hidden sm:inline">Salir</span>
          </button>
        </div>
      </header>

      {/* Sidebar - CSS transitions for performance */}
      {state.sidebarOpen && (
        <>
          <div
            onClick={() => dispatch({ type: "SET_SIDEBAR", open: false })}
            className="fixed inset-0 bg-black/60 z-40 animate-fadeIn"
          />
          <aside
            className="fixed left-0 top-0 h-full w-72 sm:w-80 bg-slate-900/98 border-r border-white/5 z-50 animate-slideInLeft"
          >
              <div className="p-4 sm:p-6 border-b border-white/5 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <GraduationCap className="w-6 h-6 text-blue-400" />
                  <h2 className="text-lg font-bold text-white">CAECE</h2>
                </div>
                <button
                  onClick={() => dispatch({ type: "SET_SIDEBAR", open: false })}
                  className="p-2 rounded-lg hover:bg-white/5 text-slate-400"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-4 space-y-2 overflow-y-auto max-h-[calc(100vh-80px)]">
                <p className="text-xs text-slate-500 uppercase tracking-wider mb-3 px-2">
                  Carreras disponibles
                </p>
                {careers.map((career) => {
                  const isActive = currentCareer.id === career.id
                  return (
                    <button
                      key={career.id}
                      onClick={() => handleCareerChange(career)}
                      className={cn(
                        "w-full p-3 sm:p-4 rounded-xl text-left transition-all duration-200",
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
                          <h3 className={cn(
                            "font-medium text-white text-sm sm:text-base truncate",
                            isActive && "text-blue-400"
                          )}>
                            {career.name}
                          </h3>
                          <p className="text-xs text-slate-500 mt-1">
                            {career.subjects.length} materias • Plan {career.plan}
                          </p>
                        </div>
                        {isActive && (
                          <Sparkles className="w-4 h-4 text-blue-400 flex-shrink-0" />
                        )}
                      </div>
                    </button>
                  )
                })}
              </div>
          </aside>
        </>
      )}

      {/* Canvas */}
      <div
        ref={containerRef}
        className={cn(
          "flex-1 relative overflow-hidden touch-none",
          state.isDragging ? "cursor-grabbing" : "cursor-grab"
        )}
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <DotGridBackground />

        {/* Content layer */}
          <div
            className="relative w-fit h-fit"
            style={{
              transform: `translate3d(${state.position.x}px, ${state.position.y}px, 0) scale(${state.scale})`,
              transformOrigin: "0 0",
            }}
          >
          {/* Column headers */}
          {columns.keys.map((key, idx) => {
            const [year, quad] = key.split("-")
            return (
              <div
                key={key}
                className="absolute text-center"
                style={{ left: idx * 420, top: 40, width: NODE_WIDTH }}
              >
                <div className="inline-flex flex-col items-center gap-1 px-4 sm:px-6 py-2 sm:py-3 rounded-2xl bg-slate-900/95 border border-white/10">
                  <div className="flex items-center gap-2 text-white font-semibold text-xs sm:text-sm">
                    <BookOpen className="w-3 h-3 sm:w-4 sm:h-4 text-blue-400" />
                    <span>{year}º Año</span>
                  </div>
                  <div className="text-[10px] sm:text-xs text-slate-400 flex items-center gap-1">
                    <ChevronRight className="w-3 h-3" />
                    {quad}º Cuatrimestre
                  </div>
                </div>
              </div>
            )
          })}

          {/* Connection lines */}
          <ConnectionLines
            subjects={currentCareer.subjects}
            nodePositions={nodePositions}
            hoveredSubject={state.hoveredSubject}
          />

          {/* Subject nodes - build position map for O(1) lookups (Rule 7.2) */}
          {currentCareer.subjects.map((subject) => {
            const subjectCode = String(subject.code)
            const pos = nodePositions[subjectCode]
            // Explicit conditional rendering (Rule 6.7)
            if (!pos) return null
            
            return (
              <div
                key={subject.code}
                className="absolute"
                style={{ left: pos.x - NODE_WIDTH / 2, top: pos.y - 60 }}
              >
                <SubjectNode
                  subject={subject}
                  onNodeClick={handleNodeClick}
                  onNodeHover={handleHover}
                  onStatusChange={handleStatusChange}
                  allSubjects={currentCareer.subjects}
                  hoveredSubject={state.hoveredSubject}
                />
              </div>
            )
          })}
        </div>
      </div>

      {/* Floating Stats Footer */}
      <StatsFooter subjects={currentCareer.subjects} stats={stats} />

      {/* Modal */}
      <SubjectModal
        open={state.modalOpen}
        subject={state.selectedSubject}
        onClose={handleCloseModal}
        onStatusChange={handleStatusChange}
        allSubjects={currentCareer.subjects}
      />
    </div>
  )
}

export default Plans
