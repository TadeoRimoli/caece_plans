"use client"

import type React from "react"
import { Card, CardContent, Typography, Box } from "@mui/material"
import type { Subject } from "../types"
import { NODE_WIDTH } from "../constants"

interface SubjectNodeProps {
  subject: Subject
  statusColor: string
  onNodeClick: (subject: Subject) => void
  onNodeHover: (subjectId: number | null) => void
  allSubjects: Subject[],
  hoveredSubject: number | null
}

const SubjectNode: React.FC<SubjectNodeProps> = ({ subject, statusColor, onNodeClick, onNodeHover, allSubjects, hoveredSubject }) => {
  
  const isRelated =
  hoveredSubject === null ||
  subject.code === hoveredSubject ||
  subject.prerequisites.includes(hoveredSubject) ||
  allSubjects.find((s) => s.code === hoveredSubject)?.prerequisites.includes(subject.code)


  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    onNodeClick(subject)
  }

  const handleMouseEnter = () => {
    onNodeHover(subject.code)
  }

  const handleMouseLeave = () => {
    onNodeHover(null)
  }

  // Obtener nombres de correlativas
 const getCorrelativeNames = () => {
  return subject.prerequisites
    .map((code) => allSubjects.find((s) => s.code === code)?.name)
    .filter(Boolean) as string[]
}

  return (
    <Box sx={{ position: "relative",opacity: isRelated ? 1 : 0.3, transition: "opacity 0.3s ease",
 }} onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave}>
      {/* Puntos de conexión con estilo CAECE */}
      <Box
        sx={{
          position: "absolute",
          left: -10,
          top: "50%",
          transform: "translateY(-50%)",
          width: 20,
          height: 20,
          borderRadius: "50%",
          background: `linear-gradient(135deg, ${statusColor}, ${statusColor}dd)`,
          border: "3px solid white",
          boxShadow: "0 4px 12px rgba(30, 58, 138, 0.2)",
          zIndex: 10,
        }}
      />
      <Box
        sx={{
          position: "absolute",
          right: -10,
          top: "50%",
          transform: "translateY(-50%)",
          width: 20,
          height: 20,
          borderRadius: "50%",
          background: `linear-gradient(135deg, ${statusColor}, ${statusColor}dd)`,
          border: "3px solid white",
          boxShadow: "0 4px 12px rgba(30, 58, 138, 0.2)",
          zIndex: 10,
        }}
      />

      <Card
        sx={{
          width: NODE_WIDTH, // Reducir de 220 a 200
          cursor: "pointer",
          border: "1px solid rgba(30, 58, 138, 0.1)",
          borderRadius: 4,
          backgroundImage: `
              url("https://www.transparenttextures.com/patterns/brushed-alum-dark.png")
            `,
          backgroundColor: `${statusColor}B3`,
          backdropFilter: "blur(20px)",
          "&:hover": {
            boxShadow: `0 20px 40px ${statusColor}30`,
            transform: "scale(1.03) translateY(-4px)", // Reducir escala de hover de 1.05 a 1.03
            borderColor: statusColor,
          },
          transition: "all 0.4s cubic-bezier(0.4, 0, 0.2, 1)",
          position: "relative",
          zIndex: 5,
          overflow: "hidden",
          maxHeight: "none", // Agregar altura máxima
          "&::after": {
            content: '""',
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "linear-gradient(135deg, rgba(255,255,255,0.1), transparent)",
            pointerEvents: "none",
          },
        }}
        onClick={handleClick}
      >
        <CardContent sx={{ p: 2, "&:last-child": { pb: 2 } }}>
          {" "}
          {/* Reducir padding de 2.5 a 2 */}
          <Typography
            variant="h6"
            component="h3"
            sx={{
              fontSize: "1.5rem", // Reducir de 1rem a 0.9rem
              fontWeight: 700,
              mb: 1,
              textAlign: "center",
              minHeight: "2.5em", // Reducir de 3em a 2.5em
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              lineHeight: 1.2, // Reducir line-height de 1.3 a 1.2
              color: "#000000ff",
              letterSpacing: "-0.01em",
            }}
          >
            {subject.name}
          </Typography>
          {subject.prerequisites.length > 0 && (
            <Box sx={{ display: "flex", flexDirection: "column", gap: 0.5 }}>
              {getCorrelativeNames().map((name, idx) => (
                <Typography
                  key={idx}
                  variant="caption"
                  sx={{
                    fontSize: "0.7rem",
                    color: "#1f1f1fff",
                    fontWeight: 600,
                    textAlign: "center",
                    lineHeight: 1.2,
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  📚 {name}
                </Typography>
              ))}
            </Box>
          )}
          {subject.extraConditions && (
            <Box sx={{ display: "flex", flexDirection: "column", mt: 1 }}>
            <Typography
                  variant="caption"
                  sx={{
                    fontSize: "0.7rem",
                    color: "#1f1f1fff",
                    fontWeight: 600,
                    textAlign: "center",
                    lineHeight: 1.2,
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
            📚 {subject.extraConditions}
            </Typography>
            </Box>
          )}
          
        </CardContent>
      </Card>
    </Box>
  )
}

export default SubjectNode
