import { useState, useMemo } from "react"
import { Check, ChevronDown, ChevronUp } from "lucide-react"
import { cn } from "../../../lib/utils"
import type { Career, Subject } from "../../../types"
import type { SelectedElectives } from "../../../services/firebase/careerProgress"

interface ElectiveSelectorProps {
  career: Career
  allSubjects: Subject[]
  selectedElectives: SelectedElectives
  onSave: (selected: SelectedElectives) => void
  openByDefault?: boolean
}

export function ElectiveSelector({
  career,
  allSubjects,
  selectedElectives,
  onSave,
  openByDefault = false,
}: ElectiveSelectorProps) {
  const [open, setOpen] = useState(openByDefault)
  const [localSelected, setLocalSelected] = useState<SelectedElectives>(() => ({ ...selectedElectives }))
  const subjectByCode = useMemo(() => new Map(allSubjects.map((s) => [s.code, s])), [allSubjects])

  const rules = career.electiveRules ?? []
  if (rules.length === 0) return null

  const handleToggle = (groupId: string, code: string) => {
    const rule = rules.find((r) => r.groupId === groupId)
    if (!rule) return
    const current = localSelected[groupId] ?? []
    const next = current.includes(code)
      ? current.filter((c) => c !== code)
      : current.length >= rule.requiredSubjects
        ? [...current.slice(1), code]
        : [...current, code]
    setLocalSelected((prev) => ({ ...prev, [groupId]: next }))
  }

  const handleSave = () => {
    onSave(localSelected)
    setOpen(false)
  }

  const handleCancel = () => {
    setLocalSelected({ ...selectedElectives })
    setOpen(false)
  }

  return (
    <div className="pointer-events-auto rounded-2xl border border-white/10 bg-slate-900/90 overflow-hidden shadow-xl shadow-black/40 backdrop-blur-xl">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between gap-3 px-4 py-3 sm:px-5 sm:py-4 text-left hover:bg-white/5 transition-colors"
      >
        <span className="text-sm sm:text-base font-medium text-white">
          Optativas / Electivas
        </span>
        <span className="text-xs text-slate-400">
          {rules.length} grupo{rules.length !== 1 ? "s" : ""}
        </span>
        {open ? (
          <ChevronUp className="w-5 h-5 text-slate-400 flex-shrink-0" />
        ) : (
          <ChevronDown className="w-5 h-5 text-slate-400 flex-shrink-0" />
        )}
      </button>
      {open && (
        <div className="border-t border-white/10 p-4 sm:p-5 space-y-5">
          {rules.map((rule) => {
            const selected = localSelected[rule.groupId] ?? []
            const available = rule.availableSubjects
              .map((code) => subjectByCode.get(code))
              .filter((s): s is Subject => s != null)
            const required = rule.requiredSubjects
            const valid = selected.length === required

            return (
              <div key={rule.groupId} className="space-y-2">
                <p className="text-xs sm:text-sm font-medium text-slate-300">
                  Elegí {required} de {available.length} materia{available.length !== 1 ? "s" : ""} ({rule.groupId})
                </p>
                <div className="flex flex-wrap gap-2">
                  {available.map((sub) => {
                    const isSelected = selected.includes(sub.code)
                    return (
                      <button
                        key={sub.code}
                        type="button"
                        onClick={() => handleToggle(rule.groupId, sub.code)}
                        className={cn(
                          "inline-flex items-center gap-2 px-3 py-2 rounded-xl border text-sm transition-colors",
                          isSelected
                            ? "border-emerald-500/50 bg-emerald-500/10 text-emerald-300"
                            : "border-white/10 bg-white/5 text-slate-300 hover:border-white/20"
                        )}
                      >
                        {isSelected && <Check className="w-4 h-4 flex-shrink-0" />}
                        {sub.name}
                      </button>
                    )
                  })}
                </div>
                {!valid && selected.length > 0 && (
                  <p className="text-xs text-amber-400">
                    Debes elegir exactamente {required} materia{required !== 1 ? "s" : ""}.
                  </p>
                )}
              </div>
            )
          })}
          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={handleSave}
              className="px-4 py-2 rounded-xl bg-blue-500 hover:bg-blue-600 text-white text-sm font-medium"
            >
              Guardar elección
            </button>
            <button
              type="button"
              onClick={handleCancel}
              className="px-4 py-2 rounded-xl border border-white/20 text-slate-300 hover:bg-white/5 text-sm"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
