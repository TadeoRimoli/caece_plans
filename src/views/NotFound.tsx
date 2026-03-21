import { useEffect } from "react"
import { Link } from "react-router-dom"

export default function NotFound() {
  useEffect(() => {
    document.title = "Visualizador de planes de estudio - Página no encontrada"
  }, [])

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-950 px-4">
      <h1 className="text-6xl sm:text-8xl font-bold text-slate-700">404</h1>
      <p className="mt-4 text-slate-400 text-center text-lg">
        No encontramos esta página.
      </p>
      <Link
        to="/"
        className="mt-8 px-6 py-3 rounded-xl bg-slate-700 hover:bg-slate-600 text-white font-medium transition-colors"
      >
        Volver al inicio
      </Link>
      <p className="mt-10 text-xs text-slate-600">
        Desarrollado por{" "}
        <a
          href="https://www.linkedin.com/in/tadeo-rimoli-9aa24b1a7/"
          target="_blank"
          rel="noopener noreferrer"
          className="font-medium text-slate-700 hover:text-blue-500 underline underline-offset-2"
        >
          Tadeo Rimoli
        </a>
      </p>
    </div>
  )
}
