import { useMemo } from "react"
import type { Career, Subject, NodePosition } from "../../../types"
import { hasGridPosition, getSubjectType } from "../../../types"
import type { SelectedElectives } from "../../../services/firebase/careerProgress"
import { COLUMN_GAP, ROW_GAP } from "../../../constants"

interface ColumnGroup {
  key: string
  year: number
  quadrimester: number
  subjects: Subject[]
}

/**
 * Materias que deben mostrarse en la grilla: obligatorias (+ posición por defecto si falta) + optativas elegidas con posición
 * Compatibilidad: si una obligatoria tiene year/quadrimester null o 0, se muestra en 1º año, 1º cuat.
 */
export function getGridSubjects(
  subjects: Subject[],
  selectedElectives: SelectedElectives
): Subject[] {
  const selectedSet = new Set<string>()
  for (const codes of Object.values(selectedElectives)) {
    codes.forEach((c) => selectedSet.add(c))
  }
  return subjects.filter((s) => {
    const t = getSubjectType(s)
    if (t === "requirement") return false
    if (t === "mandatory") return true
    if (t === "elective") return selectedSet.has(s.code) && hasGridPosition(s.year, s.quadrimester)
    return false
  })
}

/**
 * Materias tipo requisito (extracurriculares/atemporales)
 */
export function getRequirementSubjects(subjects: Subject[]): Subject[] {
  return subjects.filter((s) => getSubjectType(s) === "requirement")
}

/**
 * Lista de materias que cuentan para el avance: obligatorias + optativas elegidas + requisitos
 */
export function getRequiredSubjectsForStats(
  career: Career,
  selectedElectives: SelectedElectives
): Subject[] {
  const selectedSet = new Set<string>()
  for (const codes of Object.values(selectedElectives)) {
    codes.forEach((c) => selectedSet.add(c))
  }
  return career.subjects.filter((s) => {
    const t = getSubjectType(s)
    if (t === "mandatory" || t === "requirement") return true
    if (t === "elective") return selectedSet.has(s.code)
    return false
  })
}

/**
 * Año/cuatrimestre efectivos para la grilla.
 * quadrimester null/0 = materia anual → quadrimester 0 para agrupar.
 * Sin año = obligatoria sin posición → (1, 1) por compatibilidad.
 */
function effectiveGridPosition(s: Subject): { year: number; quadrimester: number } {
  const t = getSubjectType(s)
  const y = s.year ?? 0
  const q = s.quadrimester ?? 0
  if (y > 0) {
    return { year: y, quadrimester: q > 0 ? q : 0 }
  }
  if (t === "mandatory") return { year: 1, quadrimester: 1 }
  return { year: 1, quadrimester: q || 1 }
}

/**
 * Agrupa materias por año y cuatrimestre (usa posición efectiva para obligatorias sin posición)
 */
export function useSubjectColumns(subjects: Subject[]) {
  return useMemo(() => {
    const map = new Map<string, Subject[]>()
    for (const subject of subjects) {
      const { year, quadrimester } = effectiveGridPosition(subject)
      const key = `${year}-${quadrimester}`
      const existing = map.get(key) || []
      map.set(key, [...existing, subject])
    }
    const columns: ColumnGroup[] = []
    for (const [key, subs] of map.entries()) {
      const [year, quadrimester] = key.split("-").map(Number)
      columns.push({ key, year, quadrimester, subjects: subs })
    }
    columns.sort((a, b) => a.year - b.year || a.quadrimester - b.quadrimester)
    return columns
  }, [subjects])
}

/**
 * Calcula posiciones de nodos basado en columnas
 */
export function useNodePositions(columns: ColumnGroup[]): Record<string, NodePosition> {
  return useMemo(() => {
    const positions: Record<string, NodePosition> = {}
    
    for (let colIdx = 0; colIdx < columns.length; colIdx++) {
      const column = columns[colIdx]
      const x = colIdx * COLUMN_GAP + 150
      
      for (let rowIdx = 0; rowIdx < column.subjects.length; rowIdx++) {
        const subject = column.subjects[rowIdx]
        positions[subject.code] = {
          x,
          y: 200 + rowIdx * ROW_GAP,
        }
      }
    }

    return positions
  }, [columns])
}

/**
 * Calcula estadísticas de progreso.
 * - % avance: solo materias promocionadas o aprobadas.
 * - Promedio: solo notas de materias promocionadas o aprobadas.
 */
export function useProgressStats(subjects: Subject[]) {
  return useMemo(() => {
    const total = subjects.length
    let completed = 0
    let sumGrades = 0
    let countGrades = 0

    for (const subject of subjects) {
      const isCompleted =
        subject.status === "approved_with_final" || subject.status === "promoted"
      if (isCompleted) {
        completed++
        if (typeof subject.finalGrade === "number") {
          sumGrades += subject.finalGrade
          countGrades++
        }
      }
    }

    const percentage = total > 0 ? Math.round((completed / total) * 100) : 0
    const averageGrade =
      countGrades > 0 ? Number((sumGrades / countGrades).toFixed(2)) : null

    return {
      total,
      completed,
      percentage,
      averageGrade,
    }
  }, [subjects])
}

/**
 * Crea un mapa de materias por código para lookups O(1)
 */
export function useSubjectMap(subjects: Subject[]): Map<string, Subject> {
  return useMemo(() => {
    const map = new Map<string, Subject>()
    for (const subject of subjects) {
      map.set(subject.code, subject)
    }
    return map
  }, [subjects])
}
