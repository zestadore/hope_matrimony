import type { ReactNode } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'

export default function RequirePermission({
  permission,
  children,
}: {
  permission: string
  children: ReactNode
}) {
  const { user } = useAuth()

  if (!user?.permissions.includes(permission)) {
    return <Navigate to="/403" replace />
  }

  return <>{children}</>
}
