import { ShieldCheck, UserCheck, Users } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useAuth } from '../auth/AuthContext'
import { listRoles, listUsers } from '@/api/roles'
import AdminLayout from '@/components/layout/AdminLayout'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'

function formatRole(role: string): string {
  return role
    .split('_')
    .map((word) => word[0]?.toUpperCase() + word.slice(1))
    .join(' ')
}

function initials(name: string): string {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('')
}

interface StatCardProps {
  label: string
  value: string | number
  icon: typeof Users
}

function StatCard({ label, value, icon: Icon }: StatCardProps) {
  return (
    <Card>
      <CardContent className="flex items-center gap-4">
        <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-brand-blue/10 text-brand-blue">
          <Icon className="size-5" />
        </div>
        <div>
          <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">{label}</p>
          <p className="text-xl font-semibold">{value}</p>
        </div>
      </CardContent>
    </Card>
  )
}

export default function Dashboard() {
  const { user } = useAuth()
  const [totalUsers, setTotalUsers] = useState<number | null>(null)
  const [totalRoles, setTotalRoles] = useState<number | null>(null)

  useEffect(() => {
    if (user?.permissions.includes('users.view')) {
      void listUsers()
        .then(({ meta }) => setTotalUsers(meta.total))
        .catch(() => setTotalUsers(null))
    }
    if (user?.permissions.includes('roles.view')) {
      void listRoles()
        .then((roles) => setTotalRoles(roles.length))
        .catch(() => setTotalRoles(null))
    }
  }, [user])

  return (
    <AdminLayout title="Dashboard" description="Overview of your admin account">
      <div className="mx-auto flex max-w-6xl flex-col gap-6">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {totalUsers !== null && <StatCard label="Staff users" value={totalUsers} icon={Users} />}
          {totalRoles !== null && <StatCard label="Roles" value={totalRoles} icon={ShieldCheck} />}
          <StatCard
            label="Account status"
            value={user?.status ? user.status[0].toUpperCase() + user.status.slice(1) : '—'}
            icon={UserCheck}
          />
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-4">
              <Avatar size="lg">
                <AvatarFallback className="bg-gradient-to-br from-brand-blue to-brand-pink text-base font-semibold text-white">
                  {user ? initials(user.name) : ''}
                </AvatarFallback>
              </Avatar>
              <div>
                <CardTitle className="text-lg">Welcome, {user?.name}</CardTitle>
                <p className="text-sm text-muted-foreground">{user?.mobile_number}</p>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Separator className="mb-4" />
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
                  Roles
                </p>
                <div className="mt-1.5 flex flex-wrap gap-1.5">
                  {user?.roles.map((role) => (
                    <Badge key={role} variant="secondary">
                      {formatRole(role)}
                    </Badge>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
                  Account status
                </p>
                <div className="mt-1.5">
                  <Badge className="bg-emerald-100 text-emerald-700 capitalize dark:bg-emerald-500/15 dark:text-emerald-400">
                    {user?.status}
                  </Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  )
}
