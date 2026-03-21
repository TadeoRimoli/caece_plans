import { useEffect, useState } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { doc, getDoc, setDoc } from "firebase/firestore"
import { db } from "../../lib/firebase"
import { ArrowLeft } from "lucide-react"
import { Link } from "react-router-dom"
import type { UniversityDoc } from "../types"

const emptyDoc: UniversityDoc = {
  acronym: "",
  fullName: "",
  location: "",
  type: "",
  website: "",
  logoUrl: "",
}

export function UniversityForm() {
  const { id } = useParams<"id">()
  const navigate = useNavigate()
  const isNew = id === undefined || id === "new"

  const [form, setForm] = useState<UniversityDoc & { id: string }>({ ...emptyDoc, id: "" })
  const [manualId, setManualId] = useState("")
  const [loading, setLoading] = useState(!isNew)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (isNew) {
      setForm({ ...emptyDoc, id: "" })
      setManualId("")
      setLoading(false)
      return
    }
    const load = async () => {
      if (!id) return
      setLoading(true)
      try {
        const snap = await getDoc(doc(db, "universities", id))
        if (snap.exists()) {
          setForm({ id: snap.id, ...(snap.data() as UniversityDoc) })
          setManualId(snap.id)
        }
      } catch (e) {
        console.error(e)
      } finally {
        setLoading(false)
      }
    }
    void load()
  }, [id, isNew])

  const update = (field: keyof UniversityDoc, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const docId = isNew ? manualId.trim() : id
    if (!docId) {
      alert("El ID del documento es obligatorio.")
      return
    }
    setSaving(true)
    try {
      const payload: UniversityDoc = {
        acronym: form.acronym,
        fullName: form.fullName,
        location: form.location,
        type: form.type,
        website: form.website,
        logoUrl: form.logoUrl,
      }
      await setDoc(doc(db, "universities", docId), payload)
      navigate("/admin/universities")
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
    <div className="max-w-2xl">
      <Link
        to="/admin/universities"
        className="inline-flex items-center gap-2 text-slate-400 hover:text-white text-sm mb-6"
      >
        <ArrowLeft className="w-4 h-4" />
        Volver a universidades
      </Link>

      <h2 className="text-xl font-semibold text-white mb-6">
        {isNew ? "Nueva universidad" : "Editar universidad"}
      </h2>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-1">
            ID del documento (ej. caece)
          </label>
          <input
            type="text"
            value={isNew ? manualId : id}
            onChange={(e) => isNew && setManualId(e.target.value)}
            disabled={!isNew}
            className="w-full px-4 py-2 rounded-lg bg-slate-800 border border-white/10 text-white font-mono disabled:opacity-60"
            required
          />
        </div>

        {(["acronym", "fullName", "location", "type", "website", "logoUrl"] as const).map(
          (field) => (
            <div key={field}>
              <label className="block text-sm font-medium text-slate-300 mb-1">
                {field === "acronym" && "Sigla"}
                {field === "fullName" && "Nombre completo"}
                {field === "location" && "Ubicación"}
                {field === "type" && "Tipo"}
                {field === "website" && "Sitio web"}
                {field === "logoUrl" && "URL del logo"}
              </label>
              <input
                type={field === "website" || field === "logoUrl" ? "url" : "text"}
                value={form[field]}
                onChange={(e) => update(field, e.target.value)}
                className="w-full px-4 py-2 rounded-lg bg-slate-800 border border-white/10 text-white"
              />
            </div>
          )
        )}

        <div className="flex gap-3 pt-4">
          <button
            type="submit"
            disabled={saving}
            className="px-4 py-2 rounded-lg bg-blue-500 hover:bg-blue-600 text-white font-medium disabled:opacity-50"
          >
            {saving ? "Guardando…" : "Guardar"}
          </button>
          <Link
            to="/admin/universities"
            className="px-4 py-2 rounded-lg border border-white/20 text-slate-300 hover:bg-white/5"
          >
            Cancelar
          </Link>
        </div>
      </form>
    </div>
  )
}
