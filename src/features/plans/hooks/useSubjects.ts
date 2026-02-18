import { useMemo } from "react"
import type { Subject, NodePosition } from "../../../types"
import { COLUMN_GAP, ROW_GAP } from "../../../constants"

interface ColumnGroup {
  key: string
  year: number
  quadrimester: number
  subjects: Subject[]
}

/**
 * Agrupa materias por año y cuatrimestre
 */
export function useSubjectColumns(subjects: Subject[]) {
  return useMemo(() => {
    const map = new Map<string, Subject[]>()
    
    for (const subject of subjects) {
      const key = `${subject.year}-${subject.quadrimester}`
      const existing = map.get(key) || []
      map.set(key, [...existing, subject])
    }

    const columns: ColumnGroup[] = []
    for (const [key, subjects] of map.entries()) {
      const [year, quadrimester] = key.split("-").map(Number)
      columns.push({ key, year, quadrimester, subjects })
    }

    // Ordenar por año y cuatrimestre
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
 * Calcula estadísticas de progreso
 */
export function useProgressStats(subjects: Subject[]) {
  return useMemo(() => {
    const total = subjects.length
    let completed = 0

    let sumGrades = 0
    let countGrades = 0

    for (const subject of subjects) {
      if (subject.status === "approved_with_final" || subject.status === "promoted") {
        completed++
      }
      if (typeof subject.finalGrade === "number") {
        sumGrades += subject.finalGrade
        countGrades++
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
