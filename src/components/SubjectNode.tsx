import { memo, useState, useCallback, useRef, useMemo } from "react"
import { BookOpen } from "lucide-react"
import type { Subject, SubjectStatus } from "../types"
import { STATUS_META, STATUS_LIST } from "../types"
import { NODE_WIDTH } from "../constants"
import { cn } from "../lib/utils"

interface SubjectNodeProps {
  subject: Subject
  onNodeClick: (subject: Subject) => void
  onNodeHover: (subjectId: string | null) => void
  onStatusChange: (subjectId: string, newStatus: SubjectStatus) => void
  allSubjects: Subject[]
  hoveredSubject: string | null
}

const SubjectNode = memo(({
  subject,
  onNodeClick,
  onNodeHover,
  onStatusChange,
  allSubjects,
  hoveredSubject,
}: SubjectNodeProps) => {
  const [showStatusMenu, setShowStatusMenu] = useState(false)
  const hideTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const statusMeta = STATUS_META[subject.status]
  const subjectCode = subject.code
  const subjectPrerequisites = subject.prerequisites
  
  // Find subjects that require this subject (narrowed dependencies Rule 5.3)
  const requiresThisSubject = useMemo(() => {
    const subjectsRequiringThis = new Set<string>()
    for (const s of allSubjects) {
      if (s.prerequisites.includes(subjectCode)) {
        subjectsRequiringThis.add(s.code)
      }
    }
    return subjectsRequiringThis
  }, [allSubjects, subjectCode])
  
  const isRelated = useMemo(() => {
    if (hoveredSubject === null) return true
    if (subjectCode === hoveredSubject) return true
    if (subjectPrerequisites.includes(hoveredSubject)) return true
    return requiresThisSubject.has(hoveredSubject)
  }, [hoveredSubject, subjectCode, subjectPrerequisites, requiresThisSubject])

  // Memoize correlative names with optimized lookup (Rule 7.2: Build index maps)
  const correlativeNames = useMemo(
    () => {
      // Build subject code to name map for O(1) lookups instead of O(n) find()
      const subjectByName = new Map<string, string>()
      for (const s of allSubjects) {
        subjectByName.set(s.code, s.name)
      }
      
      return subjectPrerequisites
        .map((code) => subjectByName.get(code))
        .filter((name): name is string => name !== undefined)
    },
    [subjectPrerequisites, allSubjects]
  )

  // Clear any pending hide timeout
  const clearHideTimeout = useCallback(() => {
    if (hideTimeoutRef.current) {
      clearTimeout(hideTimeoutRef.current)
      hideTimeoutRef.current = null
    }
  }, [])

  // Show menu INSTANTLY - no delay
  const handleMouseEnter = useCallback(() => {
    clearHideTimeout()
    setShowStatusMenu(true)
    onNodeHover(subjectCode)
  }, [onNodeHover, subjectCode, clearHideTimeout])

  // Hide with delay to allow moving to the menu
  const handleMouseLeave = useCallback(() => {
    hideTimeoutRef.current = setTimeout(() => {
      setShowStatusMenu(false)
      onNodeHover(null)
    }, 150)
  }, [onNodeHover])

  const handleStatusClick = useCallback((e: React.MouseEvent | React.TouchEvent, newStatus: SubjectStatus) => {
    e.stopPropagation()
    e.preventDefault()
    onStatusChange(subjectCode, newStatus)
  }, [onStatusChange, subjectCode])

  const handleCardClick = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    e.stopPropagation()
    onNodeClick(subject)
  }, [onNodeClick, subject])

  // Touch handler for mobile (functional setState Rule 5.5)
  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    e.stopPropagation()
    setShowStatusMenu((current) => {
      if (!current) {
        onNodeHover(subjectCode)
        return true
      }
      return current
    })
  }, [onNodeHover, subjectCode])

  // Memoize inline styles to avoid recreation (Rule 7.1)
  const statusColor = statusMeta.color
  const connectionPointStyle = useMemo(() => ({ 
    backgroundColor: statusColor,
    boxShadow: `0 0 10px ${statusColor}80`
  }), [statusColor])

  const cardStyle = useMemo(() => ({
    borderColor: showStatusMenu ? statusColor : statusMeta.borderGlow,
    boxShadow: showStatusMenu 
      ? `0 0 25px ${statusColor}50, 0 8px 32px rgba(0,0,0,0.3)`
      : `0 8px 32px rgba(0,0,0,0.3)`,
    transition: showStatusMenu 
      ? 'box-shadow 0.1s ease-out, border-color 0.1s ease-out'
      : 'box-shadow 0.2s ease-out, border-color 0.2s ease-out'
  }), [showStatusMenu, statusColor, statusMeta.borderGlow])

  const glowOverlayStyle = useMemo(() => ({
    background: `radial-gradient(ellipse at 50% 0%, ${statusColor}30 0%, transparent 60%)`,
    opacity: showStatusMenu ? 0.5 : 0.2,
    transition: 'opacity 0.1s ease-out'
  }), [showStatusMenu, statusColor])

  const statusBarStyle = useMemo(() => ({ backgroundColor: statusColor }), [statusColor])

  const statusBadgeStyle = useMemo(() => ({ 
    backgroundColor: `${statusColor}25`,
    color: statusColor,
    border: `1px solid ${statusColor}50`
  }), [statusColor])

  const nodeContainerStyle = useMemo(() => ({ width: NODE_WIDTH }), [])

  return (
    <div
      className={cn(
        "relative will-change-opacity",
        isRelated ? "opacity-100" : "opacity-25"
      )}
      style={nodeContainerStyle}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* Connection Points */}
      <div 
        className="absolute left-0 top-1/2 -translate-x-1/2 -translate-y-1/2 w-4 h-4 rounded-full z-20 will-change-transform"
        style={connectionPointStyle}
      />
      <div 
        className="absolute right-0 top-1/2 translate-x-1/2 -translate-y-1/2 w-4 h-4 rounded-full z-20 will-change-transform"
        style={connectionPointStyle}
      />

      {/* Main Card */}
      <div
        onClick={handleCardClick}
        onTouchEnd={handleTouchEnd}
        className={cn(
          "relative cursor-pointer rounded-2xl overflow-hidden",
          "border",
          "bg-gradient-to-br from-white/[0.08] to-white/[0.02]",
          "will-change-transform",
          "transition-transform duration-75",
          "hover:scale-[1.02] hover:-translate-y-1 active:scale-[0.98]"
        )}
        style={cardStyle}
      >
        {/* Glow overlay */}
        <div 
          className="absolute inset-0 pointer-events-none will-change-opacity"
          style={glowOverlayStyle}
        />

        {/* Content */}
        <div className="relative p-4 sm:p-5">
          {/* Status indicator bar */}
          <div 
            className="absolute top-0 left-0 right-0 h-1.5 rounded-t-2xl"
            style={statusBarStyle}
          />

          {/* Subject name */}
          <h3 className="text-white font-bold text-center text-base sm:text-lg leading-tight min-h-[2.5rem] sm:min-h-[3rem] flex items-center justify-center mt-2">
            {subject.name}
          </h3>

          {/* Correlatives - explicit conditional rendering (Rule 6.7) */}
          {correlativeNames.length > 0 ? (
            <div className="mt-3 space-y-1.5">
              {correlativeNames.slice(0, 2).map((name, idx) => (
                <div 
                  key={idx}
                  className="flex items-center gap-2 text-xs sm:text-sm text-slate-300 bg-white/5 rounded-lg px-2 py-1"
                >
                  <BookOpen className="w-3.5 h-3.5 sm:w-4 sm:h-4 flex-shrink-0 text-blue-400" />
                  <span className="truncate font-medium">{name}</span>
                </div>
              ))}
              {correlativeNames.length > 2 ? (
                <div className="text-xs sm:text-sm text-slate-400 text-center font-medium">
                  +{correlativeNames.length - 2} más
                </div>
              ) : null}
            </div>
          ) : null}

          {/* Extra conditions - explicit conditional rendering (Rule 6.7) */}
          {subject.extraConditions ? (
            <div className="mt-3 text-xs sm:text-sm text-amber-400 flex items-center gap-2 bg-amber-500/10 rounded-lg px-2 py-1.5">
              <span>⚡</span>
              <span className="truncate font-medium">{subject.extraConditions}</span>
            </div>
          ) : null}

          {/* Current status badge */}
          <div className="mt-4 flex items-center justify-center">
            <div 
              className="px-4 py-1.5 sm:py-2 rounded-full text-sm sm:text-base font-semibold flex items-center gap-2"
              style={statusBadgeStyle}
            >
              <span className="text-base sm:text-lg">{statusMeta.icon}</span>
              <span>{statusMeta.label}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Hover Status Menu - Always rendered but hidden for instant show */}
      <div 
        className={cn(
          "absolute left-1/2 -translate-x-1/2 z-50 pt-2",
          "transition-opacity duration-100",
          showStatusMenu ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        )}
        style={{ top: '100%' }}
        onMouseEnter={clearHideTimeout}
        onMouseLeave={handleMouseLeave}
      >
        {/* Invisible bridge */}
        <div className="absolute -top-2 left-0 right-0 h-4" />
        
        <div className="flex items-center gap-2 sm:gap-3 px-4 sm:px-5 py-3 sm:py-4 rounded-2xl bg-slate-900/98 border border-white/10 shadow-2xl">
          {STATUS_LIST.map((status) => (
            <button
              key={status.value}
              onClick={(e) => handleStatusClick(e, status.value)}
              onTouchEnd={(e) => handleStatusClick(e, status.value)}
              className={cn(
                "w-9 h-9 sm:w-11 sm:h-11 rounded-full flex items-center justify-center",
                "transition-transform duration-75",
                "hover:scale-110 active:scale-95",
                subject.status === status.value && "ring-2 ring-white ring-offset-2 ring-offset-slate-900 scale-110"
              )}
              style={{ 
                backgroundColor: status.color,
                boxShadow: `0 0 12px ${status.color}70`
              }}
              title={status.label}
            >
              <span className="text-white text-sm sm:text-base font-bold">
                {status.icon}
              </span>
            </button>
          ))}
        </div>
        
        {/* Arrow */}
        <div className="absolute -top-0 left-1/2 -translate-x-1/2 w-4 h-4 rotate-45 bg-slate-900/95 border-l border-t border-white/10" />
      </div>
    </div>
  )
})

SubjectNode.displayName = 'SubjectNode'

export default SubjectNode