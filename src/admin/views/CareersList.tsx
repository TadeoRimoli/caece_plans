import { useEffect, useState } from "react"
import { Link } from "react-router-dom"
import { collection, getDocs, deleteDoc, doc } from "firebase/firestore"
import { db } from "../../lib/firebase"
import { Plus, Pencil, Trash2 } from "lucide-react"
import type { CareerDocWithId } from "../types"

export function CareersList() {
  const [careers, setCareers] = useState<CareerDocWithId[]>([])
  const [loading, setLoading] = useState(true)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const load = async () => {
    setLoading(true)
    try {
      const snap = await getDocs(collection(db, "careers"))
      const list: CareerDocWithId[] = snap.docs.map((d) => ({
        id: d.id,
        ...(d.data() as Omit<CareerDocWithId, "id">),
      }))
      setCareers(list)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void load()
  }, [])

  const handleDelete = async (id: string) => {
    if (!confirm("¿Eliminar esta carrera?")) return
    setDeletingId(id)
    try {
      await deleteDoc(doc(db, "careers", id))
      await load()
    } catch (e) {
      console.error(e)
    } finally {
      setDeletingId(null)
    }
  }

  if (loading) {
    return <p className="text-slate-400">Cargando carreras...</p>
  }

  return (
    <div className="max-w-5xl">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-white">Carreras</h2>
        <Link
          to="/admin/careers/new"
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-500/20 border border-blue-500/40 text-blue-300 hover:bg-blue-500/30 text-sm font-medium"
        >
          <Plus className="w-4 h-4" />
          Nueva carrera
        </Link>
      </div>

      <div className="rounded-xl border border-white/10 overflow-hidden bg-slate-900/50">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-white/10 bg-slate-800/50">
              <th className="px-4 py-3 text-xs font-medium text-slate-400 uppercase tracking-wider">Nombre</th>
              <th className="px-4 py-3 text-xs font-medium text-slate-400 uppercase tracking-wider">Área</th>
              <th className="px-4 py-3 text-xs font-medium text-slate-400 uppercase tracking-wider">Plan</th>
              <th className="px-4 py-3 text-xs font-medium text-slate-400 uppercase tracking-wider">Año</th>
              <th className="px-4 py-3 text-xs font-medium text-slate-400 uppercase tracking-wider">Universidad ID</th>
              <th className="px-4 py-3 text-xs font-medium text-slate-400 uppercase tracking-wider">Materias</th>
              <th className="px-4 py-3 text-xs font-medium text-slate-400 uppercase tracking-wider w-24">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {careers.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-slate-500">
                  No hay carreras. Creá una desde "Nueva carrera".
                </td>
              </tr>
            ) : (
              careers.map((c) => (
                <tr key={c.id} className="border-b border-white/5 hover:bg-white/5">
                  <td className="px-4 py-3 text-sm text-white">{c.name}</td>
                  <td className="px-4 py-3 text-sm text-slate-400">{c.area ?? "—"}</td>
                  <td className="px-4 py-3 text-sm text-slate-400">{c.plan}</td>
                  <td className="px-4 py-3 text-sm text-slate-400">{c.year}</td>
                  <td className="px-4 py-3 text-sm font-mono text-slate-400">{c.universityId}</td>
                  <td className="px-4 py-3 text-sm text-slate-400">{c.subjects?.length ?? 0}</td>
                  <td className="px-4 py-3 flex items-center gap-2">
                    <Link
                      to={`/admin/careers/${c.id}/edit`}
                      className="p-2 rounded-lg text-slate-400 hover:bg-white/10 hover:text-white"
                      aria-label="Editar"
                    >
                      <Pencil className="w-4 h-4" />
                    </Link>
                    <button
                      type="button"
                      onClick={() => handleDelete(c.id)}
                      disabled={deletingId === c.id}
                      className="p-2 rounded-lg text-slate-400 hover:bg-red-500/10 hover:text-red-400 disabled:opacity-50"
                      aria-label="Eliminar"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
