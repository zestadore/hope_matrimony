import { LogOut } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import { useIdleTimeout } from '../hooks/useIdleTimeout'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
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

export default function Dashboard() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = async () => {
    await logout()
    navigate('/login', { replace: true })
  }

  useIdleTimeout(() => {
    void handleLogout()
  })

  return (
    <div className="min-h-svh bg-muted/30">
      <header className="sticky top-0 z-10 border-b border-border bg-background/95 backdrop-blur">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-6 py-3">
          <div className="flex items-center gap-3">
            <img src="/logo2.png" alt="Hope Matrimony" className="h-8" />
            <Separator orientation="vertical" className="h-5" />
            <span className="text-sm font-medium text-muted-foreground">Admin Panel</span>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden text-right sm:block">
              <p className="text-sm leading-tight font-medium">{user?.name}</p>
              <p className="text-xs leading-tight text-muted-foreground">{user?.mobile_number}</p>
            </div>
            <Avatar>
              <AvatarFallback className="bg-brand-blue/10 font-medium text-brand-blue">
                {user ? initials(user.name) : ''}
              </AvatarFallback>
            </Avatar>
            <Button variant="outline" size="sm" onClick={() => void handleLogout()}>
              <LogOut />
              Sign out
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-6 py-8">
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
      </main>
    </div>
  )
}
