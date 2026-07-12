import {
  Briefcase,
  ChevronsUpDown,
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
import { cn } from '@/lib/utils'

interface NavItem {
  to: string
  label: string
  icon: LucideIcon
  permission?: string
}

interface NavSection {
  label: string
  items: NavItem[]
}

const NAV_SECTIONS: NavSection[] = [
  {
    label: 'Overview',
    items: [{ to: '/', label: 'Dashboard', icon: LayoutDashboard }],
  },
  {
    label: 'Management',
    items: [
      { to: '/admin/users', label: 'Members', icon: UsersRound, permission: 'users.view' },
      { to: '/admin/team', label: 'Team', icon: UserCog, permission: 'users.view' },
      {
        to: '/admin/roles',
        label: 'Roles & Permissions',
        icon: ShieldCheck,
        permission: 'roles.view',
      },
    ],
  },
  {
    label: 'Master Data',
    items: [
      { to: '/admin/castes', label: 'Castes', icon: Users, permission: 'castes.view' },
      {
        to: '/admin/qualifications',
        label: 'Qualifications',
        icon: GraduationCap,
        permission: 'qualifications.view',
      },
      {
        to: '/admin/industries',
        label: 'Industries',
        icon: Briefcase,
        permission: 'industries.view',
      },
    ],
  },
]

function initials(name: string): string {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('')
}

function formatRole(role: string): string {
  return role
    .split('_')
    .map((word) => word[0]?.toUpperCase() + word.slice(1))
    .join(' ')
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

  const sections = NAV_SECTIONS.map((section) => ({
    ...section,
    items: section.items.filter(
      (item) => !item.permission || user?.permissions.includes(item.permission),
    ),
  })).filter((section) => section.items.length > 0)

  return (
    <nav className="flex flex-col gap-5 p-3">
      {sections.map((section) => (
        <div key={section.label} className="flex flex-col gap-1">
          {!collapsed && (
            <p className="px-3 pb-1 text-[0.6875rem] font-semibold tracking-wider text-sidebar-foreground/40 uppercase">
              {section.label}
            </p>
          )}
          {section.items.map((item) => {
            const active = location.pathname === item.to
            return (
              <Link
                key={item.to}
                to={item.to}
                onClick={onNavigate}
                title={collapsed ? item.label : undefined}
                className={cn(
                  'group relative flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                  collapsed && 'justify-center px-2',
                  active
                    ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                    : 'text-sidebar-foreground/70 hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground',
                )}
              >
                {active && (
                  <span className="absolute inset-y-1.5 left-0 w-1 rounded-full bg-gradient-to-b from-brand-blue to-brand-pink" />
                )}
                <item.icon
                  className={cn(
                    'size-4 shrink-0 transition-colors',
                    active
                      ? 'text-brand-blue'
                      : 'text-sidebar-foreground/50 group-hover:text-sidebar-accent-foreground',
                  )}
                />
                {!collapsed && item.label}
              </Link>
            )
          })}
        </div>
      ))}
    </nav>
  )
}

function UserMenu({
  collapsed = false,
  onLogout,
}: {
  collapsed?: boolean
  onLogout: () => void
}) {
  const { user } = useAuth()
  if (!user) return null

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          className={cn(
            'flex w-full items-center gap-2.5 rounded-lg p-2 text-left outline-none transition-colors hover:bg-sidebar-accent focus-visible:ring-3 focus-visible:ring-ring/50',
            collapsed && 'justify-center',
          )}
        >
          <Avatar>
            <AvatarFallback className="bg-brand-blue/10 text-xs font-medium text-brand-blue">
              {initials(user.name)}
            </AvatarFallback>
          </Avatar>
          {!collapsed && (
            <>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-sidebar-foreground">{user.name}</p>
                <p className="truncate text-xs text-sidebar-foreground/60">
                  {user.roles.map(formatRole).join(', ') || user.mobile_number}
                </p>
              </div>
              <ChevronsUpDown className="size-4 shrink-0 text-sidebar-foreground/40" />
            </>
          )}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" side="top" className="w-56">
        <DropdownMenuLabel className="font-normal">
          <p className="text-sm leading-tight font-medium text-foreground">{user.name}</p>
          <p className="text-xs leading-tight text-muted-foreground">{user.mobile_number}</p>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem variant="destructive" onSelect={onLogout}>
          <LogOut />
          Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

function SidebarHeader({
  collapsed,
  onToggle,
  onClose,
}: {
  collapsed?: boolean
  onToggle?: () => void
  onClose?: () => void
}) {
  return (
    <div
      className={cn(
        'flex h-14 items-center border-b border-sidebar-border px-4',
        collapsed ? 'justify-center px-2' : 'justify-between',
      )}
    >
      {!collapsed && <img src="/logo2.png" alt="Hope Matrimony" className="h-7" />}
      {onToggle && (
        <Button variant="ghost" size="icon-sm" onClick={onToggle}>
          {collapsed ? <PanelLeftOpen /> : <PanelLeftClose />}
        </Button>
      )}
      {onClose && (
        <Button variant="ghost" size="icon-sm" onClick={onClose}>
          <X />
        </Button>
      )}
    </div>
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
  const { logout } = useAuth()
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
    <div className="flex min-h-svh w-full bg-muted/40">
      <aside
        className={cn(
          'sticky top-0 hidden h-svh shrink-0 flex-col border-r border-sidebar-border bg-sidebar transition-[width] duration-200 lg:flex',
          collapsed ? 'w-16' : 'w-64',
        )}
      >
        <SidebarHeader collapsed={collapsed} onToggle={() => setCollapsed((prev) => !prev)} />
        <div className="flex-1 overflow-y-auto">
          <SidebarNav collapsed={collapsed} />
        </div>
        <div className="border-t border-sidebar-border p-2">
          <UserMenu collapsed={collapsed} onLogout={() => void handleLogout()} />
        </div>
      </aside>

      {mobileNavOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-black/40" onClick={() => setMobileNavOpen(false)} />
          <div className="absolute inset-y-0 left-0 flex w-64 flex-col bg-sidebar shadow-xl">
            <SidebarHeader onClose={() => setMobileNavOpen(false)} />
            <div className="flex-1 overflow-y-auto">
              <SidebarNav onNavigate={() => setMobileNavOpen(false)} />
            </div>
            <div className="border-t border-sidebar-border p-2">
              <UserMenu onLogout={() => void handleLogout()} />
            </div>
          </div>
        </div>
      )}

      <div className="flex min-h-svh flex-1 flex-col">
        <header className="sticky top-0 z-10 flex h-14 items-center justify-between gap-4 border-b border-border bg-background/80 px-4 backdrop-blur sm:px-6 lg:px-8">
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
                <p className="hidden truncate text-xs text-muted-foreground sm:block">
                  {description}
                </p>
              )}
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-2">
            {actions}
            <ThemeToggle />
          </div>
        </header>

        <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8">{children}</main>
      </div>
    </div>
  )
}
