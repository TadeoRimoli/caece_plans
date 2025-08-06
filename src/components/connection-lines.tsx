import type React from "react"
import type { Subject, NodePosition } from "../types"

interface ConnectionLinesProps {
  subjects: Subject[]
  nodePositions: Record<number, NodePosition>
  hoveredSubject: number | null
}

const ConnectionLines: React.FC<ConnectionLinesProps> = ({ subjects, nodePositions, hoveredSubject }) => {
  // Calcular el área total del SVG
  const maxX = Math.max(...Object.values(nodePositions).map((pos) => pos.x)) + 200
  const maxY = Math.max(...Object.values(nodePositions).map((pos) => pos.y)) + 200

  // Función para detectar si una línea pasa cerca de un nodo
  const avoidsNode = (startX: number, startY: number, endX: number, endY: number, nodePos: NodePosition) => {
    const nodeLeft = nodePos.x - 110
    const nodeRight = nodePos.x + 110
    const nodeTop = nodePos.y - 50
    const nodeBottom = nodePos.y + 50

    // Si la línea está completamente fuera del área del nodo, no hay problema
    if (
      endX < nodeLeft ||
      startX > nodeRight ||
      Math.max(startY, endY) < nodeTop ||
      Math.min(startY, endY) > nodeBottom
    ) {
      return { avoids: true, offset: 0 }
    }

    // Si pasa por el área del nodo, calcular offset para evitarlo
    const centerY = (startY + endY) / 2
    const nodeCenter = nodePos.y

    if (centerY > nodeCenter) {
      // Pasar por debajo
      return { avoids: false, offset: 60 }
    } else {
      // Pasar por arriba
      return { avoids: false, offset: -60 }
    }
  }

  return (
    <svg
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        width: maxX,
        height: maxY,
        pointerEvents: "none",
        zIndex: 1,
      }}
    >
      <defs>
        {/* Marcador gris por defecto */}
        <marker id="arrowhead-gray" markerWidth="8" markerHeight="6" refX="7" refY="3" orient="auto">
          <polygon points="0 0, 8 3, 0 6" fill="#bdbdbd" />
        </marker>

        {/* Marcador azul para hover */}
        <marker id="arrowhead-blue" markerWidth="8" markerHeight="6" refX="7" refY="3" orient="auto">
          <polygon points="0 0, 8 3, 0 6" fill="#1976d2" />
        </marker>
      </defs>

      {subjects.map((subject) => {
        const subjectPos = nodePositions[subject.code]
        if (!subjectPos) return null

        return subject.prerequisites.map((correlativaId) => {
          const correlativaPos = nodePositions[correlativaId]
          if (!correlativaPos) return null

          // Determinar si esta conexión debe estar resaltada
          const isHighlighted = hoveredSubject === subject.code || hoveredSubject === correlativaId

          // Calcular puntos de conexión - DE MATERIA HACIA SU CORRELATIVA
          const sourceX = subjectPos.x - 110 // Punto izquierdo de la materia que requiere
          const sourceY = subjectPos.y
          const targetX = correlativaPos.x + 110 // Punto derecho de la correlativa
          const targetY = correlativaPos.y

          // Verificar si la línea directa pasa por otros nodos
          let pathData: string
          let needsRouting = false
          let routingOffset = 0

          // Verificar colisiones con otros nodos
          for (const otherSubject of subjects) {
            if (otherSubject.code === subject.code || otherSubject.code === correlativaId) continue

            const otherPos = nodePositions[otherSubject.code]
            if (!otherPos) continue

            const collision = avoidsNode(sourceX, sourceY, targetX, targetY, otherPos)
            if (!collision.avoids) {
              needsRouting = true
              routingOffset =
                Math.max(Math.abs(routingOffset), Math.abs(collision.offset)) * Math.sign(collision.offset)
            }
          }

          if (needsRouting) {
            // Crear ruta que evita obstáculos
            const midX = (sourceX + targetX) / 2
            const midY = (sourceY + targetY) / 2 + routingOffset

            pathData = `M ${sourceX} ${sourceY} Q ${midX} ${midY} ${targetX} ${targetY}`
          } else {
            // Ruta directa con curva suave
            const controlX1 = sourceX - 80
            const controlX2 = targetX + 80

            pathData = `M ${sourceX} ${sourceY} C ${controlX1} ${sourceY}, ${controlX2} ${targetY}, ${targetX} ${targetY}`
          }

          return (
            <g key={`${correlativaId}-${subject.code}`} >
              {/* Línea principal más discreta */}
              <path
                d={pathData}
                stroke={isHighlighted ? "#10b981" : "#bdbdbd"}
                
                strokeWidth={isHighlighted ? "3" : "2"}
                fill="none"
                markerEnd={isHighlighted ? "url(#arrowhead-blue)" : "url(#arrowhead-gray)"}
                strokeDasharray={isHighlighted ? "6,3" : "4,2"}
                opacity={isHighlighted ? 1 : 0.6}
                style={{
                  animation: isHighlighted ? "dash 2s linear infinite" : "none",
                  transition: "all 0.3s ease",
                }}
              />
            </g>
          )
        })
      })}

      <style>
        {`
          @keyframes dash {
            to {
              stroke-dashoffset: -9;
            }
          }
        `}
      </style>
    </svg>
  )
}

export default ConnectionLines
