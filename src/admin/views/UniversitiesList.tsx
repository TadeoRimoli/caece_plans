import { useEffect, useState } from "react"
import { Link } from "react-router-dom"
import { collection, getDocs, deleteDoc, doc, query, where, getCountFromServer } from "firebase/firestore"
import { db } from "../../lib/firebase"
import { Plus, Pencil, Trash2 } from "lucide-react"
import type { UniversityDocWithId } from "../types"

export function UniversitiesList() {
  const [universities, setUniversities] = useState<UniversityDocWithId[]>([])
  const [loading, setLoading] = useState(true)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const load = async () => {
    setLoading(true)
    try {
      const snap = await getDocs(collection(db, "universities"))
      const list: UniversityDocWithId[] = snap.docs.map((d) => ({
        id: d.id,
        ...(d.data() as Omit<UniversityDocWithId, "id">),
      }))
      setUniversities(list)
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
    // Verificar si hay carreras asociadas antes de eliminar
    try {
      const careersRef = collection(db, "careers")
      const careersQuery = query(careersRef, where("universityId", "==", id))
      const countSnap = await getCountFromServer(careersQuery)
      const careersCount = countSnap.data().count

      if (careersCount > 0) {
        alert(
          `No se puede eliminar esta universidad porque tiene ${careersCount} carrera(s) asociada(s). ` +
          "Eliminalas o desvinculalas primero."
        )
        return
      }
    } catch (error) {
      console.error("Error verificando carreras asociadas:", error)
      alert("Ocurrió un error verificando carreras asociadas. Intentalo de nuevo.")
      return
    }

    if (!confirm("¿Eliminar esta universidad? Esta acción no se puede deshacer.")) return
    setDeletingId(id)
    try {
      await deleteDoc(doc(db, "universities", id))
      await load()
    } catch (e) {
      console.error(e)
    } finally {
      setDeletingId(null)
    }
  }

  if (loading) {
    return <p className="text-slate-400">Cargando universidades...</p>
  }

  return (
    <div className="max-w-4xl">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-white">Universidades</h2>
        <Link
          to="/admin/universities/new"
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-500/20 border border-blue-500/40 text-blue-300 hover:bg-blue-500/30 text-sm font-medium"
        >
          <Plus className="w-4 h-4" />
          Nueva universidad
        </Link>
      </div>

      <div className="rounded-xl border border-white/10 overflow-hidden bg-slate-900/50">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-white/10 bg-slate-800/50">
              <th className="px-4 py-3 text-xs font-medium text-slate-400 uppercase tracking-wider">ID</th>
              <th className="px-4 py-3 text-xs font-medium text-slate-400 uppercase tracking-wider">Sigla</th>
              <th className="px-4 py-3 text-xs font-medium text-slate-400 uppercase tracking-wider">Nombre</th>
              <th className="px-4 py-3 text-xs font-medium text-slate-400 uppercase tracking-wider">Ubicación</th>
              <th className="px-4 py-3 text-xs font-medium text-slate-400 uppercase tracking-wider">Tipo</th>
              <th className="px-4 py-3 text-xs font-medium text-slate-400 uppercase tracking-wider w-24">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {universities.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-slate-500">
                  No hay universidades. Creá una desde "Nueva universidad".
                </td>
              </tr>
            ) : (
              universities.map((u) => (
                <tr key={u.id} className="border-b border-white/5 hover:bg-white/5">
                  <td className="px-4 py-3 text-sm font-mono text-slate-300">{u.id}</td>
                  <td className="px-4 py-3 text-sm text-white">{u.acronym ?? "—"}</td>
                  <td className="px-4 py-3 text-sm text-white">{u.fullName ?? "—"}</td>
                  <td className="px-4 py-3 text-sm text-slate-400">{u.location ?? "—"}</td>
                  <td className="px-4 py-3 text-sm text-slate-400">{u.type ?? "—"}</td>
                  <td className="px-4 py-3 flex items-center gap-2">
                    <Link
                      to={`/admin/universities/${u.id}/edit`}
                      className="p-2 rounded-lg text-slate-400 hover:bg-white/10 hover:text-white"
                      aria-label="Editar"
                    >
                      <Pencil className="w-4 h-4" />
                    </Link>
                    <button
                      type="button"
                      onClick={() => handleDelete(u.id)}
                      disabled={deletingId === u.id}
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
