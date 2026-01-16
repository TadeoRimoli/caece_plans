import { memo, useCallback, useMemo } from "react"
import * as Dialog from "@radix-ui/react-dialog"
import { X, BookOpen, Calendar, CheckCircle2, Clock, Star, Trophy } from "lucide-react"
import { STATUS_LIST, STATUS_META, type Subject, type SubjectStatus } from "../types"
import { cn } from "../lib/utils"

interface SubjectModalProps {
  open: boolean
  subject: Subject | null
  onClose: () => void
  onStatusChange: (subjectId: string, newStatus: SubjectStatus) => void
  allSubjects?: Subject[]
}

const statusIcons: Record<SubjectStatus, React.ReactNode> = {
  pending: <Clock className="w-4 h-4 sm:w-5 sm:h-5" />,
  in_progress: <BookOpen className="w-4 h-4 sm:w-5 sm:h-5" />,
  course_completed: <Calendar className="w-4 h-4 sm:w-5 sm:h-5" />,
  promoted: <Star className="w-4 h-4 sm:w-5 sm:h-5" />,
  approved_with_final: <Trophy className="w-4 h-4 sm:w-5 sm:h-5" />,
}

// Memoized status badge to avoid recreating styles (Rule 6.3)
const CurrentStatusBadge = memo(({ 
  statusColor, 
  icon, 
  label 
}: { 
  statusColor: string
  icon: React.ReactNode
  label: string
}) => {
  const badgeStyle = useMemo(() => ({ 
    backgroundColor: `${statusColor}20`,
    color: statusColor,
    border: `1px solid ${statusColor}40`
  }), [statusColor])

  return (
    <div 
      className="inline-flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full text-xs sm:text-sm font-medium transition-all duration-200"
      style={badgeStyle}
    >
      {icon}
      <span>{label}</span>
    </div>
  )
})

CurrentStatusBadge.displayName = 'CurrentStatusBadge'

// Memoized status button to avoid recreating styles (Rule 6.3)
const StatusButton = memo(({ 
  status, 
  isActive, 
  metaColor,
  onClick 
}: { 
  status: typeof STATUS_LIST[number]
  isActive: boolean
  metaColor: string
  onClick: () => void
}) => {
  const buttonStyle = useMemo(() => ({
    borderColor: isActive ? metaColor : 'rgba(255,255,255,0.1)',
    boxShadow: isActive ? `0 0 15px ${metaColor}25` : 'none'
  }), [isActive, metaColor])

  const iconCircleStyle = useMemo(() => ({ 
    backgroundColor: metaColor,
    boxShadow: `0 0 10px ${metaColor}40`,
    transform: isActive ? 'scale(1.1)' : 'scale(1)'
  }), [isActive, metaColor])

  const checkmarkStyle = useMemo(() => ({ color: metaColor }), [metaColor])

  return (
    <button
      onClick={onClick}
      className={cn(
        "relative flex flex-col items-center gap-1.5 sm:gap-2 p-2 sm:p-3 rounded-lg sm:rounded-xl transition-all duration-150",
        "border active:scale-95",
        isActive 
          ? "bg-white/10" 
          : "bg-white/[0.02] hover:bg-white/[0.05]"
      )}
      style={buttonStyle}
    >
      <div 
        className="w-6 h-6 sm:w-8 sm:h-8 rounded-full flex items-center justify-center transition-transform duration-150"
        style={iconCircleStyle}
      >
        <span className="text-white text-[10px] sm:text-sm">{status.icon}</span>
      </div>
      <span className="text-[8px] sm:text-[10px] text-slate-400 text-center leading-tight">
        {status.label}
      </span>
      {isActive ? (
        <CheckCircle2 
          className="absolute -top-1 -right-1 w-3 h-3 sm:w-4 sm:h-4" 
          style={checkmarkStyle}
        />
      ) : null}
    </button>
  )
})

StatusButton.displayName = 'StatusButton'

// Memoized correlative item to avoid recreating styles (Rule 6.3)
const CorrelativeItem = memo(({ 
  name, 
  prereqMeta 
}: { 
  name: string
  prereqMeta: { color: string; label: string } | null
}) => {
  const dotStyle = useMemo(() => prereqMeta ? {
    backgroundColor: prereqMeta.color,
    boxShadow: `0 0 6px ${prereqMeta.color}60`
  } : null, [prereqMeta])

  const badgeStyle = useMemo(() => prereqMeta ? {
    backgroundColor: `${prereqMeta.color}20`,
    color: prereqMeta.color
  } : null, [prereqMeta])

  return (
    <div
      className="flex items-center gap-2 sm:gap-3 px-3 sm:px-4 py-2 sm:py-3 rounded-lg sm:rounded-xl bg-white/[0.03] border border-white/5"
    >
      {prereqMeta ? (
        <div 
          className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full flex-shrink-0"
          style={dotStyle!}
        />
      ) : null}
      <span className="text-xs sm:text-sm text-slate-300 truncate">{name}</span>
      {prereqMeta ? (
        <span 
          className="ml-auto text-[10px] sm:text-xs px-1.5 sm:px-2 py-0.5 rounded-full whitespace-nowrap"
          style={badgeStyle!}
        >
          {prereqMeta.label}
        </span>
      ) : null}
    </div>
  )
})

CorrelativeItem.displayName = 'CorrelativeItem'

const SubjectModal = memo(({
  open,
  subject: initialSubject,
  onClose,
  onStatusChange,
  allSubjects = [],
}: SubjectModalProps) => {
  // Build subject index map for O(1) lookups (Rule 7.2)
  const subjectByCode = useMemo(() => {
    const map = new Map<string, Subject>()
    for (const s of allSubjects) {
      map.set(s.code, s)
    }
    return map
  }, [allSubjects])

  // Build subject index by name for O(1) lookups (Rule 7.2)
  const subjectByName = useMemo(() => {
    const map = new Map<string, Subject>()
    for (const s of allSubjects) {
      map.set(s.name, s)
    }
    return map
  }, [allSubjects])

  // Get the current subject from allSubjects to ensure we have the latest status
  const subject = useMemo(() => {
    if (!initialSubject) return null
    return subjectByCode.get(initialSubject.code) || initialSubject
  }, [initialSubject, subjectByCode])

  if (!subject) return null

  // After null check, subject is guaranteed to be non-null
  const subjectCode = subject.code
  const subjectStatus: SubjectStatus = subject.status
  const subjectPrerequisites = subject.prerequisites

  const handleStatusChange = useCallback((newStatus: SubjectStatus) => {
    onStatusChange(subjectCode, newStatus)
  }, [onStatusChange, subjectCode])

  // Optimize getCorrelativeNames with Map lookup (Rule 7.2)
  const correlativeNames = useMemo(() => {
    return subjectPrerequisites
      .map((code) => subjectByCode.get(code)?.name)
      .filter((name): name is string => name !== undefined)
  }, [subjectPrerequisites, subjectByCode])

  const statusMeta = STATUS_META[subjectStatus]
  const statusColor = statusMeta.color

  // Memoize inline styles to avoid recreation (Rule 7.1)
  const modalBoxShadow = useMemo(() => ({
    boxShadow: `0 0 60px ${statusColor}15, 0 25px 50px rgba(0,0,0,0.5)`
  }), [statusColor])

  const headerBackground = useMemo(() => ({
    background: `linear-gradient(135deg, ${statusColor}15 0%, transparent 50%)`
  }), [statusColor])

  const topGlowBarStyle = useMemo(() => ({
    background: `linear-gradient(90deg, transparent, ${statusColor}, transparent)`
  }), [statusColor])

  return (
    <Dialog.Root open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <Dialog.Portal>
        {/* Overlay */}
        <Dialog.Overlay className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 animate-fadeIn" />

        {/* Content - fixed positioning without transform for centering */}
        <Dialog.Content
          className={cn(
            "fixed inset-0 z-50 flex items-center justify-center p-4",
            "animate-fadeIn"
          )}
          onClick={(e) => e.target === e.currentTarget && onClose()}
        >
          <div
            className={cn(
              "w-full max-w-lg",
              "rounded-2xl sm:rounded-3xl overflow-hidden",
              "bg-gradient-to-br from-slate-900/98 to-slate-950/98",
              "border border-white/10",
              "shadow-2xl",
              "animate-modalIn",
              "max-h-[85vh] overflow-y-auto"
            )}
            style={modalBoxShadow}
          >
            {/* Header */}
            <div 
              className="relative px-4 sm:px-6 py-4 sm:py-5"
              style={headerBackground}
            >
              {/* Top glow bar */}
              <div 
                className="absolute top-0 left-0 right-0 h-1"
                style={topGlowBarStyle}
              />
              
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <Dialog.Title className="text-lg sm:text-xl font-bold text-white leading-tight">
                    {subject.name}
                  </Dialog.Title>
                  <Dialog.Description className="mt-1.5 sm:mt-2 text-xs sm:text-sm text-slate-400 flex items-center gap-2">
                    <Calendar className="w-3 h-3 sm:w-4 sm:h-4" />
                    <span>{subject.year}º año • {subject.quadrimester}º cuatrimestre</span>
                  </Dialog.Description>
                </div>
                
                <Dialog.Close asChild>
                  <button className="p-1.5 sm:p-2 rounded-full bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-colors">
                    <X className="w-4 h-4 sm:w-5 sm:h-5" />
                  </button>
                </Dialog.Close>
              </div>

              {/* Current status */}
              <div className="mt-3 sm:mt-4">
                <CurrentStatusBadge 
                  statusColor={statusColor}
                  icon={statusIcons[subjectStatus]}
                  label={statusMeta.label}
                />
              </div>
            </div>

            {/* Body */}
            <div className="px-4 sm:px-6 py-4 sm:py-5 space-y-4 sm:space-y-6">
              {/* Status selector */}
              <div>
                <h4 className="text-xs sm:text-sm font-medium text-slate-300 mb-2 sm:mb-3">
                  Cambiar estado
                </h4>
                <div className="grid grid-cols-5 gap-1.5 sm:gap-2">
                  {STATUS_LIST.map((status) => {
                    const isActive = subjectStatus === status.value
                    const meta = STATUS_META[status.value]
                    const metaColor = meta.color
                    return (
                      <StatusButton
                        key={status.value}
                        status={status}
                        isActive={isActive}
                        metaColor={metaColor}
                        onClick={() => handleStatusChange(status.value)}
                      />
                    )
                  })}
                </div>
              </div>

              {/* Correlatives - explicit conditional rendering (Rule 6.7) */}
              {correlativeNames.length > 0 ? (
                <div>
                  <h4 className="text-xs sm:text-sm font-medium text-slate-300 mb-2 sm:mb-3 flex items-center gap-2">
                    <BookOpen className="w-3 h-3 sm:w-4 sm:h-4" />
                    Materias correlativas
                  </h4>
                  <div className="space-y-1.5 sm:space-y-2">
                    {correlativeNames.map((name) => {
                      // Use Map for O(1) lookup instead of O(n) find() (Rule 7.2)
                      const prereqSubject = subjectByName.get(name)
                      const prereqMeta = prereqSubject ? STATUS_META[prereqSubject.status] : null
                      
                      return (
                        <CorrelativeItem 
                          key={name}
                          name={name}
                          prereqMeta={prereqMeta}
                        />
                      )
                    })}
                  </div>
                </div>
              ) : null}

              {/* Extra conditions - explicit conditional rendering (Rule 6.7) */}
              {subject.extraConditions ? (
                <div className="p-3 sm:p-4 rounded-lg sm:rounded-xl bg-amber-500/10 border border-amber-500/20">
                  <div className="flex items-start gap-2 sm:gap-3">
                    <span className="text-base sm:text-lg">⚡</span>
                    <div>
                      <h4 className="text-xs sm:text-sm font-medium text-amber-400">
                        Condición especial
                      </h4>
                      <p className="text-xs sm:text-sm text-amber-200/80 mt-1">
                        {subject.extraConditions}
                      </p>
                    </div>
                  </div>
                </div>
              ) : null}
            </div>

            {/* Footer */}
            <div className="px-4 sm:px-6 py-3 sm:py-4 border-t border-white/5 flex justify-end">
              <button
                onClick={onClose}
                className={cn(
                  "px-4 sm:px-6 py-2 sm:py-2.5 rounded-lg sm:rounded-xl font-medium text-xs sm:text-sm",
                  "bg-gradient-to-r from-slate-700 to-slate-600",
                  "hover:from-slate-600 hover:to-slate-500",
                  "text-white shadow-lg transition-all duration-150",
                  "active:scale-95"
                )}
              >
                Cerrar
              </button>
            </div>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
})

SubjectModal.displayName = 'SubjectModal'

export default SubjectModal
