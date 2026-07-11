import type { ReactNode } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuth, type Role } from '../auth/AuthContext'

// The admin panel is staff-only — Super Admin, Admin, Accounts. The 'user'
// role (public matrimonial members) authenticates against the same API but
// has no access here.
const STAFF_ROLES: Role[] = ['super_admin', 'admin', 'accounts']

export default function ProtectedRoute({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth()
  const location = useLocation()

  if (loading) {
    return <div style={{ padding: 24 }}>Loading…</div>
  }

  if (!user) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />
  }

  const isStaff = user.roles.some((role) => STAFF_ROLES.includes(role))

  if (!isStaff) {
    return <Navigate to="/403" replace />
  }

  return <>{children}</>
}
