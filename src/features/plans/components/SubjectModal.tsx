import { useCallback, useEffect, useMemo, useState } from "react"
import * as Dialog from "@radix-ui/react-dialog"
import { X, BookOpen, Calendar } from "lucide-react"
import { STATUS_META, type Subject, type SubjectStatus } from "../../../types"
import { cn } from "../../../lib/utils"
import { StatusSelector, STATUS_HEADER_ICONS } from "./StatusSelector"

interface SubjectModalProps {
  open: boolean
  subject: Subject | null
  allSubjects: Subject[]
  onClose: () => void
  onStatusChange: (subjectId: string, status: SubjectStatus) => void
  onFinalGradeChange?: (subjectId: string, grade: number | null) => void
}

export function SubjectModal({
  open,
  subject,
  allSubjects,
  onClose,
  onStatusChange,
  onFinalGradeChange,
}: SubjectModalProps) {
  const subjectMap = useMemo(() => {
    const map = new Map<string, Subject>()
    for (const s of allSubjects) {
      map.set(s.code, s)
    }
    return map
  }, [allSubjects])

  // Get the current subject from allSubjects to ensure we have the latest status
  const currentSubject = useMemo(() => {
    if (!subject) return null
    return subjectMap.get(subject.code) || subject
  }, [subject, subjectMap])

  const [gradeInput, setGradeInput] = useState<string>("")

  useEffect(() => {
    if (!currentSubject) {
      setGradeInput("")
      return
    }
    if (typeof currentSubject.finalGrade === "number") {
      setGradeInput(String(currentSubject.finalGrade))
    } else {
      setGradeInput("")
    }
  }, [currentSubject])

  const correlativeNames = useMemo(() => {
    if (!currentSubject) return []
    return currentSubject.prerequisites
      .map((code) => subjectMap.get(code)?.name)
      .filter((name): name is string => name !== undefined)
  }, [currentSubject, subjectMap])

  const handleStatusChange = useCallback(
    (status: SubjectStatus) => {
      if (!currentSubject) return
      onStatusChange(currentSubject.code, status)
    },
    [currentSubject, onStatusChange]
  )
  const handleGradeChange = useCallback((value: string) => {
    setGradeInput(value)
  }, [])

  const handleGradeBlur = useCallback(() => {
    if (!currentSubject || !onFinalGradeChange) return
    const trimmed = gradeInput.trim()
    if (!trimmed) {
      onFinalGradeChange(currentSubject.code, null)
      return
    }
    const num = Number(trimmed.replace(",", "."))
    if (Number.isNaN(num)) return
    const clamped = Math.max(0, Math.min(10, num))
    onFinalGradeChange(currentSubject.code, clamped)
  }, [currentSubject, gradeInput, onFinalGradeChange])

  if (!currentSubject) return null

  const statusMeta = STATUS_META[currentSubject.status]
  const StatusIcon = STATUS_HEADER_ICONS[currentSubject.status]

  return (
    <Dialog.Root open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 animate-fadeIn" />

        <Dialog.Content
          className={cn(
            "fixed inset-0 z-50 flex items-center justify-center p-4",
            "animate-fadeIn"
          )}
          onClick={(e) => e.target === e.currentTarget && onClose()}
        >
          <div
            className={cn(
              "w-full max-w-lg rounded-2xl sm:rounded-3xl overflow-hidden",
              "bg-gradient-to-br from-slate-900/98 to-slate-950/98",
              "border border-white/10 shadow-2xl animate-modalIn",
              "max-h-[85vh] overflow-y-auto"
            )}
            style={{
              boxShadow: `0 0 60px ${statusMeta.color}15, 0 25px 50px rgba(0,0,0,0.5)`,
            }}
          >
            {/* Header */}
            <div
              className="relative px-4 sm:px-6 py-4 sm:py-5"
              style={{
                background: `linear-gradient(135deg, ${statusMeta.color}15 0%, transparent 50%)`,
              }}
            >
              <div
                className="absolute top-0 left-0 right-0 h-1"
                style={{
                  background: `linear-gradient(90deg, transparent, ${statusMeta.color}, transparent)`,
                }}
              />

              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <Dialog.Title className="text-lg sm:text-xl font-bold text-white leading-tight">
                    {currentSubject.name}
                  </Dialog.Title>
                  <Dialog.Description className="mt-1.5 sm:mt-2 text-xs sm:text-sm text-slate-400 flex items-center gap-2">
                    <Calendar className="w-3 h-3 sm:w-4 sm:h-4" />
                    <span>
                      {currentSubject.year != null && currentSubject.year > 0
                        ? (currentSubject.quadrimester != null && currentSubject.quadrimester > 0
                          ? `${currentSubject.year} año • ${currentSubject.quadrimester}º cuatrimestre`
                          : `${currentSubject.year} año • Anual`)
                        : "Requisito extracurricular"}
                    </span>
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
                <div
                  className="inline-flex items-center gap-2 px-3.5 py-2 rounded-full text-sm font-medium"
                  style={{
                    backgroundColor: `${statusMeta.color}18`,
                    color: statusMeta.color,
                    border: `1px solid ${statusMeta.color}35`,
                  }}
                >
                  <StatusIcon className="w-4 h-4" strokeWidth={2.25} />
                  <span>{statusMeta.label}</span>
                </div>
              </div>
            </div>

            {/* Body */}
            <div className="px-4 sm:px-6 py-4 sm:py-5 space-y-4 sm:space-y-6">
              {/* Status selector */}
              <div>
                <h4 className="text-sm font-medium text-slate-300 mb-3">
                  Cambiar estado
                </h4>
                <StatusSelector
                  currentStatus={currentSubject.status}
                  onChange={handleStatusChange}
                />
              </div>

              {/* Final grade (optional) */}
              {(currentSubject.status === "approved_with_final" ||
                currentSubject.status === "promoted") && (
                <div>
                  <h4 className="text-xs sm:text-sm font-medium text-slate-300 mb-1.5">
                    Nota final (opcional)
                  </h4>
                  <input
                    type="text"
                    inputMode="decimal"
                    value={gradeInput}
                    onClick={(e) => e.stopPropagation()}
                    onChange={(e) => handleGradeChange(e.target.value)}
                    onBlur={handleGradeBlur}
                    className="w-24 px-2 py-1.5 rounded-md bg-slate-900 border border-slate-700 text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/70"
                    placeholder="Ej: 8"
                  />
                </div>
              )}

              {/* Correlatives */}
              {correlativeNames.length > 0 && (
                <div>
                  <h4 className="text-xs sm:text-sm font-medium text-slate-300 mb-2 sm:mb-3 flex items-center gap-2">
                    <BookOpen className="w-3 h-3 sm:w-4 sm:h-4" />
                    Materias correlativas
                  </h4>
                  <div className="space-y-1.5 sm:space-y-2">
                    {correlativeNames.map((name) => {
                      const prereqSubject = subjectMap.get(
                        allSubjects.find((s) => s.name === name)?.code || ""
                      )
                      const prereqMeta = prereqSubject
                        ? STATUS_META[prereqSubject.status]
                        : null

                      return (
                        <div
                          key={name}
                          className="flex items-center gap-2 sm:gap-3 px-3 sm:px-4 py-2 sm:py-3 rounded-lg sm:rounded-xl bg-white/[0.03] border border-white/5"
                        >
                          {prereqMeta && (
                            <div
                              className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full flex-shrink-0"
                              style={{
                                backgroundColor: prereqMeta.color,
                                boxShadow: `0 0 6px ${prereqMeta.color}60`,
                              }}
                            />
                          )}
                          <span className="text-xs sm:text-sm text-slate-300 truncate">{name}</span>
                          {prereqMeta && (
                            <span
                              className="ml-auto text-[10px] sm:text-xs px-1.5 sm:px-2 py-0.5 rounded-full whitespace-nowrap"
                              style={{
                                backgroundColor: `${prereqMeta.color}20`,
                                color: prereqMeta.color,
                              }}
                            >
                              {prereqMeta.label}
                            </span>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* Extra conditions */}
              {currentSubject.extraConditions && (
                <div className="p-3 sm:p-4 rounded-lg sm:rounded-xl bg-amber-500/10 border border-amber-500/20">
                  <div className="flex items-start gap-2 sm:gap-3">
                    <span className="text-base sm:text-lg">⚡</span>
                    <div>
                      <h4 className="text-xs sm:text-sm font-medium text-amber-400">
                        Condición especial
                      </h4>
                      <p className="text-xs sm:text-sm text-amber-200/80 mt-1">
                        {currentSubject.extraConditions}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="px-4 sm:px-6 py-3 sm:py-4 border-t border-white/5 flex justify-end">
              <button
                onClick={onClose}
                className={cn(
                  "px-4 sm:px-6 py-2 sm:py-2.5 rounded-lg sm:rounded-xl font-medium text-xs sm:text-sm",
                  "bg-gradient-to-r from-slate-700 to-slate-600",
                  "hover:from-slate-600 hover:to-slate-500",
                  "text-white shadow-lg transition-all duration-150 active:scale-95"
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
}
