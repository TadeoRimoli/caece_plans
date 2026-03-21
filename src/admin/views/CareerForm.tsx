import { useEffect, useState } from "react"
import { useParams, useNavigate, Link } from "react-router-dom"
import { collection, getDocs, getDoc, doc, setDoc, addDoc } from "firebase/firestore"
import { db } from "../../lib/firebase"
import { ArrowLeft, Plus, Trash2 } from "lucide-react"
import type {
  CareerDoc,
  SubjectDoc,
  SubjectTypeDoc,
  ElectiveRuleDoc,
  ExtraRequirementDoc,
  UniversityDocWithId,
} from "../types"

const emptySubject: SubjectDoc = {
  code: "",
  name: "",
  prerequisites: [],
  quadrimester: 1,
  year: 1,
  type: "mandatory",
  extraConditions: "",
}

const emptyRule: ElectiveRuleDoc = {
  groupId: "",
  requiredSubjects: 1,
  availableSubjects: [],
}

const emptyCareer: CareerDoc = {
  name: "",
  area: "",
  plan: "",
  year: 1,
  icon: "",
  universityId: "",
  subjects: [],
  electiveRules: [],
  extraRequirements: [],
}

export function CareerForm() {
  const { id } = useParams<"id">()
  const navigate = useNavigate()
  const isNew = id === undefined || id === "new"

  const [universities, setUniversities] = useState<UniversityDocWithId[]>([])
  const [form, setForm] = useState<CareerDoc>({ ...emptyCareer })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [subjectsJson, setSubjectsJson] = useState("")
  const [subjectsJsonError, setSubjectsJsonError] = useState<string | null>(null)

  // Cargar universidades para el <select>
  useEffect(() => {
    const load = async () => {
      try {
        const snap = await getDocs(collection(db, "universities"))
        const list: UniversityDocWithId[] = snap.docs.map((d) => ({
          id: d.id,
          ...(d.data() as Omit<UniversityDocWithId, "id">),
        }))
        setUniversities(list)
      } catch (e) {
        console.error(e)
      }
    }
    void load()
  }, [])

  // Cargar carrera al editar
  useEffect(() => {
    if (isNew) {
      setForm({ ...emptyCareer })
      setLoading(false)
      return
    }
    const load = async () => {
      if (!id) return
      setLoading(true)
      try {
        const snap = await getDoc(doc(db, "careers", id))
        if (snap.exists()) {
          const data = snap.data() as CareerDoc
          setForm({
            name: data.name ?? "",
            area: data.area ?? "",
            plan: data.plan ?? "",
            year: typeof data.year === "number" ? data.year : 1,
            icon: data.icon ?? "",
            universityId: data.universityId ?? "",
            subjects: Array.isArray(data.subjects)
              ? data.subjects.map((s) => ({
                  code: s.code ?? "",
                  name: s.name ?? "",
                  prerequisites: Array.isArray(s.prerequisites) ? s.prerequisites : [],
                  quadrimester: s.quadrimester != null && typeof s.quadrimester === "number" ? s.quadrimester : null,
                  year: s.year != null && typeof s.year === "number" ? s.year : null,
                  type: (s.type === "elective" || s.type === "requirement" ? s.type : "mandatory") as SubjectTypeDoc,
                  groupId: typeof s.groupId === "string" ? s.groupId : undefined,
                }))
              : [],
            electiveRules: Array.isArray(data.electiveRules)
              ? data.electiveRules.map((r) => ({
                  groupId: r.groupId ?? "",
                  requiredSubjects: typeof r.requiredSubjects === "number" ? r.requiredSubjects : 1,
                  availableSubjects: Array.isArray(r.availableSubjects)
                    ? r.availableSubjects.map(String)
                    : [],
                }))
              : [],
            extraRequirements: Array.isArray(data.extraRequirements)
              ? data.extraRequirements.map((r) => ({
                  subjectCode: String(r.subjectCode ?? ""),
                  minApprovedSubjects:
                    typeof r.minApprovedSubjects === "number" ? r.minApprovedSubjects : undefined,
                }))
              : [],
          })
        }
      } catch (e) {
        console.error(e)
      } finally {
        setLoading(false)
      }
    }
    void load()
  }, [id, isNew])

  const update = <K extends keyof CareerDoc>(field: K, value: CareerDoc[K]) => {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  const addSubject = () => {
    update("subjects", [...form.subjects, { ...emptySubject }])
  }

  const removeSubject = (index: number) => {
    update(
      "subjects",
      form.subjects.filter((_, i) => i !== index)
    )
  }

  const updateSubject = (index: number, field: keyof SubjectDoc, value: SubjectDoc[keyof SubjectDoc]) => {
    const next = form.subjects.map((s, i) =>
      i === index ? { ...s, [field]: value } : s
    )
    update("subjects", next)
  }

  const setPrerequisitesFromString = (index: number, raw: string) => {
    const list = raw
      .split(",")
      .map((c) => c.trim())
      .filter(Boolean)
    updateSubject(index, "prerequisites", list)
  }

  const addElectiveRule = () => {
    update("electiveRules", [...(form.electiveRules ?? []), { ...emptyRule }])
  }

  const removeElectiveRule = (index: number) => {
    update("electiveRules", form.electiveRules?.filter((_, i) => i !== index) ?? [])
  }

  const updateElectiveRule = (index: number, field: keyof ElectiveRuleDoc, value: ElectiveRuleDoc[keyof ElectiveRuleDoc]) => {
    const rules = form.electiveRules ?? []
    const next = rules.map((r, i) => (i === index ? { ...r, [field]: value } : r))
    update("electiveRules", next)
  }

  const setAvailableSubjectsFromString = (index: number, raw: string) => {
    const list = raw.split(",").map((c) => c.trim())
    updateElectiveRule(index, "availableSubjects", list)
  }

  const addExtraRequirement = () => {
    update("extraRequirements", [
      ...(form.extraRequirements ?? []),
      { subjectCode: "", minApprovedSubjects: undefined },
    ])
  }

  const removeExtraRequirement = (index: number) => {
    update(
      "extraRequirements",
      form.extraRequirements?.filter((_, i) => i !== index) ?? []
    )
  }

  const updateExtraRequirement = (
    index: number,
    field: keyof ExtraRequirementDoc,
    value: ExtraRequirementDoc[keyof ExtraRequirementDoc]
  ) => {
    const rules = form.extraRequirements ?? []
    const next = rules.map((r, i) => (i === index ? { ...r, [field]: value } : r))
    update("extraRequirements", next)
  }

  const handleImportSubjectsJson = () => {
    setSubjectsJsonError(null)
    if (!subjectsJson.trim()) return

    try {
      const parsed = JSON.parse(subjectsJson)
      if (!Array.isArray(parsed)) {
        throw new Error("El JSON debe ser un array de materias.")
      }

      const extraReqs: ExtraRequirementDoc[] = []

      const mapped: SubjectDoc[] = parsed.map((item, index) => {
        if (!item || typeof item !== "object") {
          throw new Error(`Materia en posición ${index} no es un objeto válido.`)
        }

        const raw: any = item as any

        // Soportar formato antiguo: requirements.subjectPrerequisites y requirements.minApprovedSubjects
        const requirements = raw.requirements && typeof raw.requirements === "object"
          ? raw.requirements
          : undefined

        const subjectPrereqs = Array.isArray(requirements?.subjectPrerequisites)
          ? requirements.subjectPrerequisites.map((p: unknown) => String(p))
          : []

        const prerequisites = Array.isArray(raw.prerequisites)
          ? raw.prerequisites.map((p: unknown) => String(p))
          : subjectPrereqs

        const minApprovedFromReq =
          requirements && typeof requirements.minApprovedSubjects === "number"
            ? requirements.minApprovedSubjects
            : undefined

        const type = (item as any).type === "elective" || (item as any).type === "requirement" ? (item as any).type : "mandatory"
        const yearVal = (item as any).year
        const quadVal = (item as any).quadrimester
        const code = String(raw.code ?? "")

        if (minApprovedFromReq && minApprovedFromReq > 0) {
          extraReqs.push({
            subjectCode: code,
            minApprovedSubjects: minApprovedFromReq,
          })
        }

        const extraConditions: string | undefined =
          typeof raw.extraConditions === "string"
            ? raw.extraConditions
            : minApprovedFromReq && minApprovedFromReq > 0
              ? `Requiere al menos ${minApprovedFromReq} materias aprobadas`
              : undefined

        return {
          code,
          name: String(raw.name ?? ""),
          prerequisites,
          quadrimester: quadVal != null && typeof quadVal === "number" ? quadVal : null,
          year: yearVal != null && typeof yearVal === "number" ? yearVal : null,
          type: type as SubjectTypeDoc,
          groupId: typeof raw.groupId === "string" ? raw.groupId : undefined,
          extraConditions,
        }
      })

      update("subjects", mapped)
      if (extraReqs.length > 0) {
        update("extraRequirements", extraReqs)
      }
    } catch (error) {
      console.error(error)
      setSubjectsJsonError(
        "JSON inválido. Array de objetos con: code, name, prerequisites[]/requirements, quadrimester?, year?, type?, groupId?"
      )
    }
  }

  /** Firestore no acepta undefined; eliminamos campos undefined del payload. */
  const removeUndefined = <T extends Record<string, unknown>>(obj: T): T => {
    const out = { ...obj }
    for (const key of Object.keys(out)) {
      if (out[key] === undefined) delete out[key]
    }
    return out
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.universityId) {
      alert("Seleccioná una universidad.")
      return
    }
    setSaving(true)
    try {
      const subjectsPayload = form.subjects.map((s) => {
        const raw: Record<string, unknown> = {
          code: s.code,
          name: s.name,
          prerequisites: s.prerequisites,
          quadrimester: s.quadrimester != null ? Number(s.quadrimester) : null,
          year: s.year != null ? Number(s.year) : null,
        }
        if (s.type != null) raw.type = s.type
        if (s.groupId != null && s.groupId !== "") raw.groupId = s.groupId
         if (s.extraConditions && s.extraConditions.trim() !== "") {
          raw.extraConditions = s.extraConditions.trim()
        }
        return removeUndefined(raw)
      })
      const electiveRulesPayload = (form.electiveRules ?? []).map((r) =>
        removeUndefined({
          groupId: r.groupId,
          requiredSubjects: r.requiredSubjects,
          availableSubjects: (r.availableSubjects ?? []).filter((c): c is string => c.length > 0),
        } as Record<string, unknown>)
      )
      const extraRequirementsPayload = (form.extraRequirements ?? []).map((r) =>
        removeUndefined({
          subjectCode: r.subjectCode,
          minApprovedSubjects:
            r.minApprovedSubjects != null ? Number(r.minApprovedSubjects) : undefined,
        } as Record<string, unknown>)
      )
      const payload = removeUndefined({
        name: form.name,
        area: form.area,
        plan: form.plan,
        year: Number(form.year),
        icon: form.icon,
        universityId: form.universityId,
        subjects: subjectsPayload,
        electiveRules: electiveRulesPayload,
        extraRequirements: extraRequirementsPayload,
      } as Record<string, unknown>)
      if (isNew) {
        await addDoc(collection(db, "careers"), payload)
      } else if (id) {
        await setDoc(doc(db, "careers", id), payload)
      }
      navigate("/admin/careers")
    } catch (e) {
      console.error(e)
      alert("Error al guardar.")
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return <p className="text-slate-400">Cargando...</p>
  }

  return (
    <div className="max-w-4xl">
      <Link
        to="/admin/careers"
        className="inline-flex items-center gap-2 text-slate-400 hover:text-white text-sm mb-6"
      >
        <ArrowLeft className="w-4 h-4" />
        Volver a carreras
      </Link>

      <h2 className="text-xl font-semibold text-white mb-6">
        {isNew ? "Nueva carrera" : "Editar carrera"}
      </h2>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">Nombre</label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => update("name", e.target.value)}
              className="w-full px-4 py-2 rounded-lg bg-slate-800 border border-white/10 text-white"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">Área</label>
            <input
              type="text"
              value={form.area}
              onChange={(e) => update("area", e.target.value)}
              className="w-full px-4 py-2 rounded-lg bg-slate-800 border border-white/10 text-white"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">Plan</label>
            <input
              type="text"
              value={form.plan}
              onChange={(e) => update("plan", e.target.value)}
              className="w-full px-4 py-2 rounded-lg bg-slate-800 border border-white/10 text-white"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">Año del plan</label>
            <input
              type="number"
              min={1}
              value={form.year}
              onChange={(e) => update("year", Number(e.target.value) || 1)}
              className="w-full px-4 py-2 rounded-lg bg-slate-800 border border-white/10 text-white"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">Icono (emoji o texto)</label>
            <input
              type="text"
              value={form.icon}
              onChange={(e) => update("icon", e.target.value)}
              className="w-full px-4 py-2 rounded-lg bg-slate-800 border border-white/10 text-white"
              placeholder="ej. 📘"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">Universidad</label>
            <select
              value={form.universityId}
              onChange={(e) => update("universityId", e.target.value)}
              className="w-full px-4 py-2 rounded-lg bg-slate-800 border border-white/10 text-white"
              required
            >
              <option value="">Seleccionar universidad</option>
              {universities.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.acronym || u.fullName || u.id}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-3">
            <label className="text-sm font-medium text-slate-300">
              Requisitos extra por materia
            </label>
            <button
              type="button"
              onClick={addExtraRequirement}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-white/10 text-slate-300 hover:bg-white/15 text-sm"
            >
              <Plus className="w-4 h-4" />
              Agregar requisito
            </button>
          </div>
          <p className="text-xs text-slate-400 mb-3">
            Útil para finales que piden una cantidad mínima de materias aprobadas (ej:
            &quot;25 asignaturas aprobadas&quot;). Se usa para validaciones y puede
            complementarse con el texto de &quot;Condición especial&quot; en la materia.
          </p>
          <div className="space-y-3 rounded-xl border border-white/10 bg-slate-800/30 p-4">
            {(form.extraRequirements ?? []).length === 0 ? (
              <p className="text-slate-500 text-sm">
                Sin requisitos extra. Agregá uno si alguna materia tiene condiciones
                adicionales (finales integradores, etc.).
              </p>
            ) : (
              (form.extraRequirements ?? []).map((rule, idx) => (
                <div
                  key={idx}
                  className="grid grid-cols-1 md:grid-cols-12 gap-2 p-3 rounded-lg bg-slate-800/50 border border-white/5"
                >
                  <input
                    placeholder="Código de materia (ej: FINAL_ING1)"
                    value={rule.subjectCode}
                    onChange={(e) => updateExtraRequirement(idx, "subjectCode", e.target.value)}
                    className="md:col-span-6 px-3 py-2 rounded bg-slate-900 border border-white/10 text-white text-sm font-mono"
                  />
                  <input
                    type="number"
                    min={0}
                    placeholder="Mín. materias aprobadas (ej: 25)"
                    value={rule.minApprovedSubjects ?? ""}
                    onChange={(e) =>
                      updateExtraRequirement(
                        idx,
                        "minApprovedSubjects",
                        e.target.value === "" ? undefined : Number(e.target.value) || 0
                      )
                    }
                    className="md:col-span-4 px-3 py-2 rounded bg-slate-900 border border-white/10 text-white text-sm"
                  />
                  <div className="md:col-span-2 flex items-center md:justify-end">
                    <button
                      type="button"
                      onClick={() => removeExtraRequirement(idx)}
                      className="p-2 rounded text-slate-400 hover:bg-red-500/10 hover:text-red-400"
                      aria-label="Quitar requisito"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-3">
            <label className="text-sm font-medium text-slate-300">Materias</label>
            <button
              type="button"
              onClick={addSubject}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-white/10 text-slate-300 hover:bg-white/15 text-sm"
            >
              <Plus className="w-4 h-4" />
              Agregar materia
            </button>
          </div>

          <div className="mb-4 space-y-2">
            <label className="block text-xs font-medium text-slate-400">
              Importar materias desde JSON (array de objetos con code, name, prerequisites[], quadrimester, year)
            </label>
            <textarea
              value={subjectsJson}
              onChange={(e) => setSubjectsJson(e.target.value)}
              rows={4}
              className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-white/10 text-xs text-slate-100 font-mono"
              placeholder='[\n  {\n    "code": "ALG1",\n    "name": "Álgebra 1",\n    "prerequisites": [],\n    "quadrimester": 1,\n    "year": 1\n  }\n]'
            />
            {subjectsJsonError && (
              <p className="text-xs text-red-400">{subjectsJsonError}</p>
            )}
            <button
              type="button"
              onClick={handleImportSubjectsJson}
              className="px-3 py-1.5 rounded-lg bg-blue-500/20 border border-blue-500/40 text-blue-300 hover:bg-blue-500/30 text-xs font-medium"
            >
              Cargar JSON de materias
            </button>
          </div>

          <div className="space-y-4 rounded-xl border border-white/10 bg-slate-800/30 p-4">
            {form.subjects.length === 0 ? (
              <p className="text-slate-500 text-sm">Sin materias. Agregá al menos una.</p>
            ) : (
              form.subjects.map((sub, idx) => (
                <div
                  key={idx}
                  className="grid grid-cols-1 md:grid-cols-12 gap-2 p-3 rounded-lg bg-slate-800/50 border border-white/5"
                >
                  <input
                    placeholder="Código"
                    value={sub.code}
                    onChange={(e) => updateSubject(idx, "code", e.target.value)}
                    className="md:col-span-2 px-3 py-2 rounded bg-slate-900 border border-white/10 text-white text-sm font-mono"
                  />
                  <input
                    placeholder="Nombre"
                    value={sub.name}
                    onChange={(e) => updateSubject(idx, "name", e.target.value)}
                    className="md:col-span-3 px-3 py-2 rounded bg-slate-900 border border-white/10 text-white text-sm"
                  />
                  <select
                    value={sub.type ?? "mandatory"}
                    onChange={(e) => updateSubject(idx, "type", e.target.value as SubjectTypeDoc)}
                    className="md:col-span-1 px-2 py-2 rounded bg-slate-900 border border-white/10 text-white text-sm"
                  >
                    <option value="mandatory">Oblig.</option>
                    <option value="elective">Optativa</option>
                    <option value="requirement">Requisito</option>
                  </select>
                  {sub.type === "elective" && (
                    <input
                      placeholder="groupId"
                      value={sub.groupId ?? ""}
                      onChange={(e) => updateSubject(idx, "groupId", e.target.value || undefined)}
                      className="md:col-span-1 px-2 py-2 rounded bg-slate-900 border border-white/10 text-white text-sm font-mono"
                    />
                  )}
                  <input
                    placeholder="Correlativas (códigos separados por coma)"
                    value={sub.prerequisites.join(", ")}
                    onChange={(e) => setPrerequisitesFromString(idx, e.target.value)}
                    className="md:col-span-2 px-3 py-2 rounded bg-slate-900 border border-white/10 text-white text-sm"
                  />
                  <input
                    type="number"
                    min={0}
                    placeholder="Cuat. (0=no)"
                    value={sub.quadrimester ?? ""}
                    onChange={(e) => updateSubject(idx, "quadrimester", e.target.value === "" ? null : Number(e.target.value) || null)}
                    className="md:col-span-1 px-2 py-2 rounded bg-slate-900 border border-white/10 text-white text-sm"
                  />
                  <input
                    type="number"
                    min={0}
                    placeholder="Año (0=no)"
                    value={sub.year ?? ""}
                    onChange={(e) => updateSubject(idx, "year", e.target.value === "" ? null : Number(e.target.value) || null)}
                    className="md:col-span-1 px-2 py-2 rounded bg-slate-900 border border-white/10 text-white text-sm"
                  />
                  <div className="md:col-span-12">
                    <input
                      placeholder='Condición especial (ej: "Requiere 25 materias aprobadas")'
                      value={sub.extraConditions ?? ""}
                      onChange={(e) => updateSubject(idx, "extraConditions", e.target.value)}
                      className="w-full mt-2 px-3 py-2 rounded bg-slate-900 border border-amber-500/30 text-amber-100 text-xs"
                    />
                  </div>
                  <div className="md:col-span-1 flex items-center md:justify-end">
                    <button
                      type="button"
                      onClick={() => removeSubject(idx)}
                      className="p-2 rounded text-slate-400 hover:bg-red-500/10 hover:text-red-400"
                      aria-label="Quitar materia"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-3">
            <label className="text-sm font-medium text-slate-300">Reglas de optativas</label>
            <button
              type="button"
              onClick={addElectiveRule}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-white/10 text-slate-300 hover:bg-white/15 text-sm"
            >
              <Plus className="w-4 h-4" />
              Agregar regla
            </button>
          </div>
          <p className="text-xs text-slate-400 mb-3">
            Definí grupos de optativas: &quot;Elegí N materias de esta lista&quot;. El groupId debe coincidir con el de las materias type: elective.
          </p>
          <div className="space-y-4 rounded-xl border border-white/10 bg-slate-800/30 p-4">
            {(form.electiveRules ?? []).length === 0 ? (
              <p className="text-slate-500 text-sm">Sin reglas. Agregá una si la carrera tiene optativas.</p>
            ) : (
              (form.electiveRules ?? []).map((rule, rIdx) => (
                <div key={rIdx} className="p-3 rounded-lg bg-slate-800/50 border border-white/5 space-y-2">
                  <div className="flex flex-wrap gap-2 items-center">
                    <input
                      placeholder="groupId"
                      value={rule.groupId}
                      onChange={(e) => updateElectiveRule(rIdx, "groupId", e.target.value)}
                      className="w-32 px-3 py-2 rounded bg-slate-900 border border-white/10 text-white text-sm font-mono"
                    />
                    <span className="text-slate-400 text-sm">Elegir</span>
                    <input
                      type="number"
                      min={1}
                      value={rule.requiredSubjects}
                      onChange={(e) => updateElectiveRule(rIdx, "requiredSubjects", Number(e.target.value) || 1)}
                      className="w-16 px-2 py-2 rounded bg-slate-900 border border-white/10 text-white text-sm"
                    />
                    <span className="text-slate-400 text-sm">de (códigos separados por coma):</span>
                    <input
                      placeholder="CODE1, CODE2, ..."
                      value={rule.availableSubjects.join(", ")}
                      onChange={(e) => setAvailableSubjectsFromString(rIdx, e.target.value)}
                      className="flex-1 min-w-[180px] px-3 py-2 rounded bg-slate-900 border border-white/10 text-white text-sm font-mono"
                    />
                    <button
                      type="button"
                      onClick={() => removeElectiveRule(rIdx)}
                      className="p-2 rounded text-slate-400 hover:bg-red-500/10 hover:text-red-400"
                      aria-label="Quitar regla"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="flex gap-3 pt-4">
          <button
            type="submit"
            disabled={saving}
            className="px-4 py-2 rounded-lg bg-blue-500 hover:bg-blue-600 text-white font-medium disabled:opacity-50"
          >
            {saving ? "Guardando…" : "Guardar"}
          </button>
          <Link
            to="/admin/careers"
            className="px-4 py-2 rounded-lg border border-white/20 text-slate-300 hover:bg-white/5"
          >
            Cancelar
          </Link>
        </div>
      </form>
    </div>
  )
}
