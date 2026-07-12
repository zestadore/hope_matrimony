import {
  Briefcase,
  GraduationCap,
  LayoutDashboard,
  LogOut,
  Menu,
  PanelLeftClose,
  PanelLeftOpen,
  ShieldCheck,
  UserCog,
  Users,
  UsersRound,
  X,
  type LucideIcon,
} from 'lucide-react'
import { type ReactNode, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../../auth/AuthContext'
import { useIdleTimeout } from '../../hooks/useIdleTimeout'
import { ThemeToggle } from '@/components/theme-toggle'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Separator } from '@/components/ui/separator'
import { cn } from '@/lib/utils'

interface NavItem {
  to: string
  label: string
  icon: LucideIcon
  permission?: string
}

const NAV_ITEMS: NavItem[] = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/admin/roles', label: 'Roles & Permissions', icon: ShieldCheck, permission: 'roles.view' },
  { to: '/admin/users', label: 'Members', icon: UsersRound, permission: 'users.view' },
  { to: '/admin/team', label: 'Team', icon: UserCog, permission: 'users.view' },
  { to: '/admin/castes', label: 'Castes', icon: Users, permission: 'castes.view' },
  {
    to: '/admin/qualifications',
    label: 'Qualifications',
    icon: GraduationCap,
    permission: 'qualifications.view',
  },
  { to: '/admin/industries', label: 'Industries', icon: Briefcase, permission: 'industries.view' },
]

function initials(name: string): string {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('')
}

function SidebarNav({
  collapsed = false,
  onNavigate,
}: {
  collapsed?: boolean
  onNavigate?: () => void
}) {
  const { user } = useAuth()
  const location = useLocation()

  return (
    <nav className="flex flex-col gap-0.5 p-3">
      {NAV_ITEMS.filter((item) => !item.permission || user?.permissions.includes(item.permission)).map(
        (item) => {
          const active = location.pathname === item.to
          return (
            <Link
              key={item.to}
              to={item.to}
              onClick={onNavigate}
              title={collapsed ? item.label : undefined}
              className={cn(
                'flex items-center gap-2.5 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                collapsed && 'justify-center px-2',
                active
                  ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                  : 'text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
              )}
            >
              <item.icon className={cn('size-4 shrink-0', active && 'text-brand-blue')} />
              {!collapsed && item.label}
            </Link>
          )
        },
      )}
    </nav>
  )
}

export default function AdminLayout({
  title,
  description,
  actions,
  children,
}: {
  title: string
  description?: string
  actions?: ReactNode
  children: ReactNode
}) {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [mobileNavOpen, setMobileNavOpen] = useState(false)
  const [collapsed, setCollapsed] = useState(false)

  const handleLogout = async () => {
    await logout()
    navigate('/login', { replace: true })
  }

  useIdleTimeout(() => {
    void handleLogout()
  })

  return (
    <div className="flex min-h-svh w-full bg-muted/30">
      <aside
        className={cn(
          'hidden shrink-0 flex-col border-r border-sidebar-border bg-sidebar transition-[width] duration-200 lg:flex',
          collapsed ? 'w-16' : 'w-60',
        )}
      >
        <div
          className={cn(
            'flex h-14 items-center px-4',
            collapsed ? 'justify-center px-2' : 'justify-between',
          )}
        >
          {!collapsed && <img src="/logo2.png" alt="Hope Matrimony" className="h-7" />}
          <Button variant="ghost" size="icon-sm" onClick={() => setCollapsed((prev) => !prev)}>
            {collapsed ? <PanelLeftOpen /> : <PanelLeftClose />}
          </Button>
        </div>
        <Separator />
        <SidebarNav collapsed={collapsed} />
      </aside>

      {mobileNavOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setMobileNavOpen(false)}
          />
          <div className="absolute inset-y-0 left-0 flex w-64 flex-col bg-sidebar shadow-xl">
            <div className="flex h-14 items-center justify-between px-4">
              <img src="/logo2.png" alt="Hope Matrimony" className="h-7" />
              <Button variant="ghost" size="icon-sm" onClick={() => setMobileNavOpen(false)}>
                <X />
              </Button>
            </div>
            <Separator />
            <SidebarNav onNavigate={() => setMobileNavOpen(false)} />
          </div>
        </div>
      )}

      <div className="flex min-h-svh flex-1 flex-col">
        <header className="sticky top-0 z-10 flex h-14 items-center justify-between gap-4 border-b border-border bg-background/95 px-4 backdrop-blur sm:px-6 lg:px-8">
          <div className="flex min-w-0 items-center gap-3">
            <Button
              variant="ghost"
              size="icon-sm"
              className="lg:hidden"
              onClick={() => setMobileNavOpen(true)}
            >
              <Menu />
            </Button>
            <div className="min-w-0">
              <h1 className="truncate text-sm font-semibold">{title}</h1>
              {description && (
                <p className="hidden truncate text-xs text-muted-foreground sm:block">{description}</p>
              )}
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-3">
            {actions}
            <ThemeToggle />
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-2 rounded-full outline-none focus-visible:ring-3 focus-visible:ring-ring/50">
                  <Avatar>
                    <AvatarFallback className="bg-brand-blue/10 font-medium text-brand-blue">
                      {user ? initials(user.name) : ''}
                    </AvatarFallback>
                  </Avatar>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel className="font-normal">
                  <p className="text-sm leading-tight font-medium text-foreground">{user?.name}</p>
                  <p className="text-xs leading-tight text-muted-foreground">{user?.mobile_number}</p>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem variant="destructive" onSelect={() => void handleLogout()}>
                  <LogOut />
                  Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8">{children}</main>
      </div>
    </div>
  )
}
