import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom"
import Login from "./views/Login"
import Plans from "./views/Plans"
import NotFound from "./views/NotFound"
import { AuthProvider } from "./AuthContext"
import { AdminProtectedRoute } from "./admin/AdminProtectedRoute"
import { AdminLayout } from "./admin/AdminLayout"
import { UniversitiesList } from "./admin/views/UniversitiesList"
import { UniversityForm } from "./admin/views/UniversityForm"
import { CareersList } from "./admin/views/CareersList"
import { CareerForm } from "./admin/views/CareerForm"

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={<Plans />} />
          <Route
            path="/admin"
            element={
              <AdminProtectedRoute>
                <AdminLayout />
              </AdminProtectedRoute>
            }
          >
            <Route index element={<Navigate to="/admin/universities" replace />} />
            <Route path="universities" element={<UniversitiesList />} />
            <Route path="universities/new" element={<UniversityForm />} />
            <Route path="universities/:id/edit" element={<UniversityForm />} />
            <Route path="careers" element={<CareersList />} />
            <Route path="careers/new" element={<CareerForm />} />
            <Route path="careers/:id/edit" element={<CareerForm />} />
          </Route>
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}

export default App
