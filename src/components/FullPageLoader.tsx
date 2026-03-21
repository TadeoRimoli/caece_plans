export function FullPageLoader() {
  return (
    <div className="w-screen h-screen flex items-center justify-center bg-slate-950">
      <div className="text-center">
        <div className="w-16 h-16 mx-auto mb-4 rounded-full border-2 border-blue-500/30 border-t-blue-500 animate-spin" />
        <p className="text-slate-400 text-lg">Cargando tu plan de estudios...</p>
      </div>
    </div>
  )
}

