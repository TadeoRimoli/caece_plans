import { useMemo } from "react"
import type { Subject, NodePosition } from "../../../types"
import { STATUS_META } from "../../../types"

interface ConnectionLinesProps {
  subjects: Subject[]
  nodePositions: Record<string, NodePosition>
  hoveredSubjectId?: string | null
}

export function ConnectionLines({
  subjects,
  nodePositions,
  hoveredSubjectId = null,
}: ConnectionLinesProps) {
  const subjectMap = useMemo(() => {
    const map = new Map<string, Subject>()
    for (const subject of subjects) {
      map.set(subject.code, subject)
    }
    return map
  }, [subjects])

  const paths = useMemo(() => {
    const result: Array<{
      key: string
      pathData: string
      lineColor: string
      subjectCode: string
      prereqId: string
    }> = []

    for (const subject of subjects) {
      const subjectPos = nodePositions[subject.code]
      if (!subjectPos) continue

      for (const prereqId of subject.prerequisites) {
        const prereqPos = nodePositions[prereqId]
        if (!prereqPos) continue

        const prereqSubject = subjectMap.get(prereqId)
        const lineColor = prereqSubject
          ? STATUS_META[prereqSubject.status].color
          : "#475569"

        const sourceX = subjectPos.x - 145
        const sourceY = subjectPos.y
        const targetX = prereqPos.x + 145
        const targetY = prereqPos.y

        const controlX1 = sourceX - 60
        const controlX2 = targetX + 60
        const pathData = `M ${sourceX} ${sourceY} C ${controlX1} ${sourceY}, ${controlX2} ${targetY}, ${targetX} ${targetY}`

        result.push({
          key: `${prereqId}-${subject.code}`,
          pathData,
          lineColor,
          subjectCode: subject.code,
          prereqId,
        })
      }
    }

    return result
  }, [subjects, nodePositions, subjectMap])

  // Calculate SVG dimensions
  const { maxX, maxY } = useMemo(() => {
    const positions = Object.values(nodePositions)
    if (positions.length === 0) return { maxX: 800, maxY: 600 }

    let maxX = positions[0].x
    let maxY = positions[0].y
    for (let i = 1; i < positions.length; i++) {
      if (positions[i].x > maxX) maxX = positions[i].x
      if (positions[i].y > maxY) maxY = positions[i].y
    }

    return {
      maxX: maxX + 300,
      maxY: maxY + 300,
    }
  }, [nodePositions])

  // Filter paths to show only if hovered
  const visiblePaths = useMemo(() => {
    if (!hoveredSubjectId) return []
    return paths.filter(
      (path) => path.subjectCode === hoveredSubjectId || path.prereqId === hoveredSubjectId
    )
  }, [paths, hoveredSubjectId])

  if (visiblePaths.length === 0) {
    return (
      <svg
        className="absolute top-0 left-0 pointer-events-none opacity-0"
        style={{ width: maxX, height: maxY }}
      />
    )
  }

  return (
    <svg
      className="absolute top-0 left-0 pointer-events-none"
      style={{ width: maxX, height: maxY }}
    >
      {visiblePaths.map(({ key, pathData }) => (
        <g key={key}>
          {/* Glow layer */}
          <path
            d={pathData}
            stroke="#34d399"
            strokeWidth="6"
            fill="none"
            opacity="0.2"
            className="transition-opacity duration-100"
          />
          {/* Main path */}
          <path
            d={pathData}
            stroke="#34d399"
            strokeWidth="2.5"
            fill="none"
            strokeDasharray="6 3"
            opacity="1"
            className="transition-all duration-100"
          />
        </g>
      ))}
    </svg>
  )
}
