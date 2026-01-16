import type { Subject } from "../types"
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

/**
 * Merge Tailwind classes with clsx
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Detecta si el usuario está en un dispositivo móvil
 */
export const isMobileDevice = (): boolean => {
  if (typeof window === "undefined") return false
  return /Mobi|Android|iPhone|iPad|iPod/i.test(
    navigator.userAgent || navigator.vendor || (window as Window & { opera?: string }).opera || ""
  )
}

/**
 * Obtiene los nombres de las materias correlativas de una materia
 */
export const getCorrelativeNames = (subject: Subject, allSubjects: Subject[]): string[] => {
  return subject.prerequisites
    .map((code) => allSubjects.find((s) => s.code === code)?.name)
    .filter((name): name is string => Boolean(name))
}
