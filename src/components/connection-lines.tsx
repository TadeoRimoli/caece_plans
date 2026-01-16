import { memo, useMemo } from "react"
import type { Subject, NodePosition } from "../types"
import { STATUS_META } from "../types"

interface ConnectionLinesProps {
  subjects: Subject[]
  nodePositions: Record<string, NodePosition>
  hoveredSubject: string | null
}

const ConnectionLines = memo(({ subjects, nodePositions, hoveredSubject }: ConnectionLinesProps) => {
  // Build subject index map for O(1) lookups (Rule 7.2)
  const subjectByCode = useMemo(() => {
    const map = new Map<string, Subject>()
    for (const subject of subjects) {
      map.set(subject.code, subject)
    }
    return map
  }, [subjects])

  // Calculate SVG dimensions - use loop for min/max instead of spread (Rule 7.10)
  const { maxX, maxY } = useMemo(() => {
    const positions = Object.values(nodePositions)
    if (positions.length === 0) return { maxX: 800, maxY: 600 }
    
    // Use loop for O(n) instead of spread which can be slower for large arrays
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

  // Pre-calculate all paths - only recalc when positions change, not hover
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

        // Use Map for O(1) lookup instead of O(n) find() (Rule 7.2)
        const prereqSubject = subjectByCode.get(prereqId)
        const lineColor = prereqSubject 
          ? STATUS_META[prereqSubject.status].color 
          : "#475569"

        // Calculate connection points
        const sourceX = subjectPos.x - 145
        const sourceY = subjectPos.y
        const targetX = prereqPos.x + 145
        const targetY = prereqPos.y

        // Simple bezier curve
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
  }, [subjects, nodePositions, subjectByCode])

  // Create Set for O(1) lookup of highlighted paths
  const highlightedPaths = useMemo(() => {
    if (!hoveredSubject) return new Set<string>()
    
    const set = new Set<string>()
    for (const path of paths) {
      if (path.subjectCode === hoveredSubject || path.prereqId === hoveredSubject) {
        set.add(path.key)
      }
    }
    return set
  }, [hoveredSubject, paths])

  // Render empty SVG when no hover to avoid unmount/remount
  if (!hoveredSubject) {
    return (
      <svg
        className="absolute top-0 left-0 pointer-events-none opacity-0"
        style={{ width: maxX, height: maxY }}
      >
        <defs>
          <marker
            id="arrowHighlight"
            markerWidth="8"
            markerHeight="6"
            refX="7"
            refY="3"
            orient="auto"
          >
            <path d="M0,0 L8,3 L0,6 L1.5,3 Z" fill="#34d399" />
          </marker>

          <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="2" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
      </svg>
    )
  }

  return (
    <svg
      className="absolute top-0 left-0 pointer-events-none"
      style={{ width: maxX, height: maxY }}
    >
      <defs>
        {/* Arrow markers */}
        <marker
          id="arrowHighlight"
          markerWidth="8"
          markerHeight="6"
          refX="7"
          refY="3"
          orient="auto"
        >
          <path d="M0,0 L8,3 L0,6 L1.5,3 Z" fill="#34d399" />
        </marker>

      </defs>

      {paths.map(({ key, pathData }) => {
        // Only show lines related to hovered subject
        const isHighlighted = highlightedPaths.has(key)
        
        // Explicit conditional rendering (Rule 6.7)
        if (!isHighlighted) return null
        
        // Memoize styles to avoid recreation (Rule 7.1)
        const glowPathStyle = {
          pointerEvents: 'none' as const
        }
        
        const mainPathStyle = {
          pointerEvents: 'none' as const
        }
        
        return (
          <g key={key}>
            {/* Glow layer */}
            <path
              d={pathData}
              stroke="#34d399"
              strokeWidth="6"
              fill="none"
              opacity="0.2"
              markerEnd="url(#arrowHighlight)"
              className="transition-opacity duration-100 ease-out"
              style={glowPathStyle}
            />

            {/* Main path - only visible when highlighted */}
            <path
              d={pathData}
              stroke="#34d399"
              strokeWidth="2.5"
              fill="none"
              strokeDasharray="6 3"
              opacity="1"
              markerEnd="url(#arrowHighlight)"
              className="transition-all duration-100 ease-out"
              style={mainPathStyle}
            />
          </g>
        )
      })}
    </svg>
  )
})

ConnectionLines.displayName = 'ConnectionLines'

export default ConnectionLines