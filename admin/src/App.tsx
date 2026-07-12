import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AuthProvider } from './auth/AuthContext'
import { Toaster } from '@/components/ui/sonner'
import Castes from './pages/admin/Castes'
import Dashboard from './pages/Dashboard'
import Forbidden from './pages/Forbidden'
import Industries from './pages/admin/Industries'
import Login from './pages/Login'
import Qualifications from './pages/admin/Qualifications'
import RolesPermissions from './pages/admin/RolesPermissions'
import ProtectedRoute from './routes/ProtectedRoute'
import RequirePermission from './routes/RequirePermission'

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Toaster position="top-right" />
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/403" element={<Forbidden />} />
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/roles"
            element={
              <ProtectedRoute>
                <RequirePermission permission="roles.view">
                  <RolesPermissions />
                </RequirePermission>
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/castes"
            element={
              <ProtectedRoute>
                <RequirePermission permission="castes.view">
                  <Castes />
                </RequirePermission>
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/qualifications"
            element={
              <ProtectedRoute>
                <RequirePermission permission="qualifications.view">
                  <Qualifications />
                </RequirePermission>
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/industries"
            element={
              <ProtectedRoute>
                <RequirePermission permission="industries.view">
                  <Industries />
                </RequirePermission>
              </ProtectedRoute>
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}

export default App
