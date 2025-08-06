"use client"

import type React from "react"
import { useState, useCallback, useMemo, useRef, useEffect } from "react"
import { ThemeProvider, createTheme } from "@mui/material/styles"
import CssBaseline from "@mui/material/CssBaseline"
import {
  Box,
  Typography,
  IconButton,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  ListItemIcon,
  Chip,
} from "@mui/material"
import SubjectNode from "./components/SubjectNode"
import SubjectModal from "./components/SubjectModal"
import { careersData } from "./data/careers"
import ConnectionLines from "./components/connection-lines"
import type { Subject, Career, NodePosition, SubjectStatus } from "./types"
import { NODE_WIDTH, statusOptions } from "./constants"

const theme = createTheme({
  palette: {
    mode: "light",
    primary: {
      main: "#1e3a8a",
    },
    secondary: {
      main: "#3b82f6",
    },
  },
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
    h4: {
      fontWeight: 700,
      letterSpacing: "-0.02em",
    },
    h6: {
      fontWeight: 600,
    },
  },
})


function App() {
  const [selectedSubject, setSelectedSubject] = useState<Subject | null>(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [currentCareer, setCurrentCareer] = useState<Career>(careersData[0])
  const [hoveredSubject, setHoveredSubject] = useState<number | null>(null)
  const [scale, setScale] = useState(1)
  const [position, setPosition] = useState({ x: 0, y: 0 })
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  const nodePositions = useMemo(() => {
    const positions: Record<number, NodePosition> = {}

    const groupedSubjects = currentCareer.subjects.reduce(
      (acc, subject) => {
        const key = `${subject.year}-${subject.quadrimester}`
        if (!acc[key]) acc[key] = []
        acc[key].push(subject)
        return acc
      },
      {} as Record<string, Subject[]>,
    )

    Object.entries(groupedSubjects).forEach(([, subjectList], columnIndex) => {
      subjectList.forEach((subject, index) => {
        positions[subject.code] = {
          x: columnIndex * 380 + 110,
          y: 160 + index * 220,
        }
      })
    })

    return positions
  }, [currentCareer.subjects])

  const groupedSubjects = useMemo(() => {
    const a = currentCareer.subjects.reduce(
      (acc, subject) => {
        const key = `${subject.year}-${subject.quadrimester}`
        if (!acc[key]) acc[key] = []
        acc[key].push(subject)
        return acc
      },
      {} as Record<string, Subject[]>,
    )
    return a
  }, [currentCareer.subjects])
  const handleCareerChange = useCallback((career: Career) => {
    const saved = loadSubjectsFromStorage(career.id.toString())
      setCurrentCareer({
    ...career,
    subjects: saved ?? career.subjects
  })
    setSidebarOpen(false)
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect()
      setPosition({
        x: rect.width / 4,
        y: 50,
      })
    }
  }, [])

  const handleNodeClick = useCallback((subject: Subject) => {
    setSelectedSubject(subject)
    setModalOpen(true)
  }, [])

  const handleNodeHover = useCallback((subjectId: number | null) => {
    setHoveredSubject(subjectId)
  }, [])

  const handleStatusChange = useCallback((subjectId: number, newStatus: SubjectStatus) => {
    setCurrentCareer((prev) => {
  const updatedSubjects = prev.subjects.map((subject) =>
    subject.code === subjectId ? { ...subject, status: newStatus } : subject
  )
  saveSubjectsToStorage(prev.id.toString(), updatedSubjects)
  return {
    ...prev,
    subjects: updatedSubjects
  }
})

    setModalOpen(false)
    setSelectedSubject(null)
  }, [])

  const handleCloseModal = useCallback(() => {
    setModalOpen(false)
    setSelectedSubject(null)
  }, [])

  const handleWheel = useCallback((e: React.WheelEvent) => {
    const delta = e.deltaY > 0 ? 0.9 : 1.1
    setScale((prev) => Math.max(0.3, Math.min(2, prev * delta)))
  }, [])

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (e.target === e.currentTarget) {
        setIsDragging(true)
        setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y })
      }
    },
    [position],
  )

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (isDragging) {
        setPosition({
          x: e.clientX - dragStart.x,
          y: e.clientY - dragStart.y,
        })
      }
    },
    [isDragging, dragStart],
  )

  const handleMouseUp = useCallback(() => {
    setIsDragging(false)
  }, [])

  useEffect(() => {
  const saved = loadSubjectsFromStorage(currentCareer.id.toString())
  setCurrentCareer((prev) => ({
    ...prev,
    subjects: saved ?? prev.subjects
  }))
  if (containerRef.current) {
    const rect = containerRef.current.getBoundingClientRect()
    setPosition({
      x: rect.width / 4,
      y: 50,
    })
  }
}, [])

 const loadSubjectsFromStorage = (careerId: string): Subject[] | null => {
  try {
    const raw = localStorage.getItem(`subjects_${careerId}`)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

const saveSubjectsToStorage = (careerId: string, subjects: Subject[]) => {
  localStorage.setItem(`subjects_${careerId}`, JSON.stringify(subjects))
}
  

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box sx={{ width: "100vw", height: "100vh", display: "flex", flexDirection: "column" }}>
        {/* Header minimalista */}
        <Box
          sx={{
            backgroundColor: "#0f172a", // azul muy oscuro
            backdropFilter: "blur(6px)",
            borderBottom: "1px solid rgba(148, 163, 184, 0.1)", // gris azulado
            py: 2,
            px: 3,
            boxShadow: "0 2px 6px rgba(0, 0, 0, 0.2)",
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
              <IconButton
                onClick={() => setSidebarOpen(true)}
                sx={{
                  color: "#e2e8f0", // texto claro
                  backgroundColor: "rgba(255, 255, 255, 0.05)",
                  "&:hover": {
                    backgroundColor: "rgba(255, 255, 255, 0.1)",
                  },
                  width: 40,
                  height: 40,
                }}
              >
                <span style={{ fontSize: "18px" }}>☰</span>
              </IconButton>
              <Typography
                variant="h6"
                sx={{
                  color: "#e2e8f0",
                  fontWeight: 600,
                  fontSize: "1.05rem",
                }}
              >
                {currentCareer.icon} {currentCareer.name}
              </Typography>
            </Box>

            <Box sx={{ display: "flex", gap: 2, alignItems: "center" }}>
              {statusOptions.map((opt) => {
                const count = currentCareer.subjects.filter((s) => s.status === opt.value).length
                return (
                  <Box key={opt.value} sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <Box
                      sx={{
                        width: 12,
                        height: 12,
                        borderRadius: "50%",
                        backgroundColor: statusOptions[opt.value].color,
                      }}
                    />
                    <Typography variant="body2" sx={{ color: "#94a3b8", fontWeight: 500 }}>
                      {count} {opt.label.toLowerCase()}
                    </Typography>
                  </Box>
                )
              })}
            </Box>
          </Box>
        </Box>

        {/* Sidebar con estilo CAECE */}
        <Drawer
          anchor="left"
          open={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
          sx={{
            "& .MuiDrawer-paper": {
              width: NODE_WIDTH,
              backgroundColor: "#1e293b", // fondo azul grisáceo oscuro
              color: "#e2e8f0",
              boxShadow: "4px 0 20px rgba(0,0,0,0.3)",
            },
          }}
        >
          <Box
            sx={{
              p: 3,
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              borderBottom: "1px solid rgba(255, 255, 255, 0.1)",
            }}
          >
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 700, mb: 0.5 }}>
                🏛️ CAECE
              </Typography>
              <Typography variant="caption" sx={{ opacity: 0.7 }}>
                Carreras Disponibles
              </Typography>
            </Box>
            <IconButton onClick={() => setSidebarOpen(false)} sx={{ color: "#e2e8f0" }}>
              <span style={{ fontSize: "18px" }}>✕</span>
            </IconButton>
          </Box>

          <List sx={{ px: 2, py: 2 }}>
            {careersData.map((career) => {
              const isActive = currentCareer.id === career.id

              return (
                <ListItem key={career.id} disablePadding sx={{ mb: 1 }}>
                  <ListItemButton
                    onClick={() => handleCareerChange(career)}
                    sx={{
                      backgroundColor: isActive ? "rgba(255,255,255,0.05)" : "transparent",
                      "&:hover": {
                        backgroundColor: "rgba(255,255,255,0.07)",
                      },
                      borderRadius: 2,
                      p: 2,
                      border: isActive ? "1px solid rgba(255,255,255,0.1)" : "1px solid transparent",
                    }}
                  >
                    <ListItemIcon sx={{ color: "white", minWidth: 50 }}>
                      <Box
                        sx={{
                          fontSize: "28px",
                          backgroundColor: "rgba(255,255,255,0.07)",
                          borderRadius: 2,
                          p: 1,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          marginRight: 1,
                        }}
                      >
                        {career.icon}
                      </Box>
                    </ListItemIcon>
                    <Box sx={{ flex: 1 }}>
                      <ListItemText
                        primary={career.name}
                        secondary={`${career.subjects.length} materias • Plan ${career.plan} • ${career.year} `}
                        sx={{
                          "& .MuiListItemText-primary": {
                            color: "#e2e8f0",
                            fontWeight: isActive ? 700 : 500,
                            fontSize: "1rem",
                            lineHeight: 1.3,
                          },
                          "& .MuiListItemText-secondary": {
                            color: "rgba(255,255,255,0.6)",
                            fontSize: "0.8rem",
                            mt: 0.5,
                          },
                        }}
                      />
                      {isActive && (
                        <Chip
                          label="ACTIVA"
                          size="small"
                          sx={{
                            backgroundColor: "rgba(16, 185, 129, 0.2)",
                            color: "#10b981",
                            fontWeight: 700,
                            fontSize: "0.7rem",
                            height: 22,
                            mt: 1,
                            border: "1px solid rgba(16, 185, 129, 0.3)",
                          }}
                        />
                      )}
                    </Box>
                  </ListItemButton>
                </ListItem>
              )
            })}
          </List>

          <Box
            sx={{
              mt: "auto",
              p: 3,
              borderTop: "1px solid rgba(255,255,255,0.1)",
              backgroundColor: "rgba(255,255,255,0.03)",
            }}
          >
            <Typography variant="body2" sx={{ fontWeight: 600, mb: 1 }}>
              Universidad CAECE
            </Typography>
            <Typography variant="caption" sx={{ color: "rgba(255,255,255,0.6)", display: "block", mb: 0.5 }}>
              Mar del Plata, Argentina
            </Typography>
          </Box>
        </Drawer>

        <Box
          ref={containerRef}
          sx={{
            userSelect: "none",
            flex: 1,
            overflow: "hidden",
            position: "relative",
            cursor: isDragging ? "grabbing" : "grab",
             backgroundImage: `
              url("https://www.transparenttextures.com/patterns/45-degree-fabric-light.png")
            `,
            backgroundColor: '#001c4a',
          }}
          
          onWheel={handleWheel}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        >
          <Box
            sx={{
              transform: `translate(${position.x}px, ${position.y}px) scale(${scale})`,
              transformOrigin: "0 0",
              transition: isDragging ? "none" : "transform 0.1s ease-out",
              position: "relative",
              width: "fit-content",
              height: "fit-content",
            }}
          >
            {Object.entries(groupedSubjects)
              .sort(([a], [b]) => {
                const [anioA, cuatriA] = a.split("-").map(Number)
                const [anioB, cuatriB] = b.split("-").map(Number)
                if (anioA !== anioB) return anioA - anioB
                return cuatriA - cuatriB
              })
              .map(([key], columnIndex) => {
                const [anio, cuatrimestre] = key.split("-")
                return (
                  <Box
                    key={key}
                    sx={{
                      position: "absolute",
                      left: columnIndex * 380,
                      top: 20,
                      width: NODE_WIDTH,
                      textAlign: "center",
                      zIndex: 20,
                    }}
                  >
                    <Box
                      sx={{
                        backgroundColor: "rgba(0, 0, 0, 0.5)",
                        backdropFilter: "blur(10px)",
                        border: "1px solid rgba(255,255,255,0.2)",
                        boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)",
                        borderRadius: 3,
                        px: 2.5,
                        py: 1.5,
                        width: "100%",
                      }}
                    >
                      <Typography
                        sx={{
                          fontSize: "0.85rem",
                          fontWeight: 700,
                          color: "#e2e8f0",
                          textShadow: "0 1px 2px rgba(0,0,0,0.4)",
                          letterSpacing: "0.03em",
                        }}
                      >
                        {anio}º AÑO 
                      </Typography>
                      <Typography
                        sx={{
                          fontSize: "0.85rem",
                          fontWeight: 700,
                          color: "#e2e8f0",
                          textShadow: "0 1px 2px rgba(0,0,0,0.4)",
                          letterSpacing: "0.03em",
                        }}
                      >
                        {cuatrimestre}º CUATRIMESTRE
                      </Typography>
                    </Box>
                  </Box>
                )
              })}

            <ConnectionLines subjects={currentCareer.subjects} nodePositions={nodePositions} hoveredSubject={hoveredSubject} />

            {currentCareer.subjects.map((subject) => {
              const pos = nodePositions[subject.code]
              if (!pos) return null

              return (
                <Box
                  key={subject.code}
                  sx={{
                    position: "absolute",
                    left: pos.x - 110,
                    top: pos.y - 50,
                  }}
                >
                  <SubjectNode
                    subject={subject}
                    statusColor={statusOptions[subject.status].color}
                    onNodeClick={handleNodeClick}
                    onNodeHover={handleNodeHover}
                    allSubjects={currentCareer.subjects}
                      hoveredSubject={hoveredSubject}

                  />
                </Box>
              )
            })}
          </Box>

          {/* Controles de zoom con estilo discreto */}
          <Box
            sx={{
              position: "absolute",
              bottom: 30,
              right: 30,
              display: "flex",
              flexDirection: "column",
              gap: 1,
              bgcolor: "rgba(255, 255, 255, 0.9)",
              borderRadius: 3,
              boxShadow: "0 4px 20px rgba(0, 0, 0, 0.1)",
              p: 1,
              border: "1px solid rgba(30, 58, 138, 0.1)",
              backdropFilter: "blur(10px)",
            }}
          >
            <button
              onClick={() => setScale((prev) => Math.min(2, prev * 1.2))}
              style={{
                border: "none",
                background: "linear-gradient(135deg, #1e3a8a, #3b82f6)",
                color: "white",
                padding: "12px 16px",
                borderRadius: "8px",
                cursor: "pointer",
                fontSize: "16px",
                fontWeight: "bold",
                transition: "all 0.3s ease",
                boxShadow: "0 2px 10px rgba(30, 58, 138, 0.3)",
              }}
            >
              ➕
            </button>
            <button
              onClick={() => setScale((prev) => Math.max(0.3, prev * 0.8))}
              style={{
                border: "none",
                background: "linear-gradient(135deg, #1e3a8a, #3b82f6)",
                color: "white",
                padding: "12px 16px",
                borderRadius: "8px",
                cursor: "pointer",
                fontSize: "16px",
                fontWeight: "bold",
                transition: "all 0.3s ease",
                boxShadow: "0 2px 10px rgba(30, 58, 138, 0.3)",
              }}
            >
              ➖
            </button>
          </Box>
        </Box>

        <SubjectModal
          open={modalOpen}
          subject={selectedSubject}
          onClose={handleCloseModal}
          onStatusChange={handleStatusChange}
          allSubjects={currentCareer.subjects}
        />
      </Box>
    </ThemeProvider>
  )
}

export default App
