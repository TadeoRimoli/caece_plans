"use client"

import type React from "react"
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  FormControl,
  FormLabel,
  Select,
  MenuItem,
  Box,
  Typography,
  Chip,
} from "@mui/material"
import type { Subject, SubjectStatus } from "../types"
import { statusOptions } from "../constants"

interface SubjectModalProps {
  open: boolean
  subject: Subject | null
  onClose: () => void
  onStatusChange: (subjectId: number, newStatus: SubjectStatus) => void
  allSubjects?: Subject[]
}



const SubjectModal: React.FC<SubjectModalProps> = ({ open, subject, onClose, onStatusChange, allSubjects = [] }) => {
  if (!subject) return null

  const handleStatusChange = (newStatus: SubjectStatus) => {
    onStatusChange(subject.code, newStatus)
  }


  // Obtener nombres de correlativas
  const getCorrelativeNames = () => {
    return subject.prerequisites.map((code) => allSubjects.find((s) => s.code === code)?.name).filter(Boolean)
  }

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      sx={{
        "& .MuiDialog-paper": {
          borderRadius: 4,
          boxShadow: "0 25px 50px rgba(30, 58, 138, 0.15)",
          border: "1px solid rgba(30, 58, 138, 0.1)",
        },
      }}
    >
      <DialogTitle
        sx={{
          textAlign: "center",
          pb: 2,
          background: "linear-gradient(135deg, #1e3a8a, #3b82f6)",
          color: "white",
          borderRadius: "16px 16px 0 0",
        }}
      >
        <Typography variant="h5" component="div" fontWeight={700} sx={{ mb: 1 }}>
          {subject.name}
        </Typography>
        <Typography variant="body2" sx={{ opacity: 0.9 }}>
          {subject.year}º año - {subject.quadrimester}º cuatrimestre
        </Typography>
      </DialogTitle>

      <DialogContent sx={{ p: 3 }}>
        <FormControl fullWidth>
          <FormLabel
            component="legend"
            sx={{
              mt: 2,
              fontWeight: 700,
              color: "#1e293b",
              fontSize: "1rem",
              "&.Mui-focused": {
                color: "#1e3a8a",
              },
            }}
          >
            Cambiar estado de la materia:
          </FormLabel>
          <Select
            value={subject.status}
            onChange={(e) => handleStatusChange(Number(e.target.value) as SubjectStatus)}
            fullWidth
            sx={{
              mt: 1,
              borderRadius: 3,
              "& .MuiOutlinedInput-root": {
                borderRadius: 3,
              },
            }}
          >
            {statusOptions.map((option) => (
              <MenuItem key={option.value} value={option.value}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                  <Box
                    sx={{
                      width: 20,
                      height: 20,
                      borderRadius: "50%",
                      backgroundColor: option.color,
                      border: option.value === 0 ? "2px solid #cbd5e1" : "none",
                    }}
                  />
                  <Typography sx={{ fontWeight: 600 }}>{option.label}</Typography>
                </Box>
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        {subject.prerequisites.length > 0 && (
          <Box sx={{ mt: 4 }}>
            <Typography variant="body1" sx={{ mb: 2, fontWeight: 600, color: "#1e293b" }}>
              Materias correlativas:
            </Typography>
            <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
              {getCorrelativeNames().map((name, index) => (
                <Chip
                  key={index}
                  label={name}
                  variant="outlined"
                  sx={{
                    alignSelf: "flex-start",
                    borderColor: "#3b82f6",
                    color: "#1e3a8a",
                    fontWeight: 600,
                    fontSize: "1rem",
                    borderRadius: 3,
                    px: 1,
                    "&:hover": {
                      backgroundColor: "#eff6ff",
                    },
                  }}
                />
              ))}
            </Box>
          </Box>
        )}
      </DialogContent>

      <DialogActions sx={{ p: 3, pt: 1 }}>
        <Button
          onClick={onClose}
          variant="contained"
          size="large"
          sx={{
            background: "linear-gradient(135deg, #1e3a8a, #3b82f6)",
            borderRadius: 3,
            px: 4,
            py: 1.5,
            fontWeight: 700,
            textTransform: "none",
            boxShadow: "0 4px 15px rgba(30, 58, 138, 0.3)",
            "&:hover": {
              background: "linear-gradient(135deg, #1e40af, #2563eb)",
              boxShadow: "0 6px 20px rgba(30, 58, 138, 0.4)",
            },
          }}
        >
          Cerrar
        </Button>
      </DialogActions>
    </Dialog>
  )
}

export default SubjectModal
