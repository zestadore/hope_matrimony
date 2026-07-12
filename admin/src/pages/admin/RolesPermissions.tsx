import axios from 'axios'
import { Pencil, Search, Trash2 } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import { toast } from 'sonner'
import { useAuth } from '../../auth/AuthContext'
import {
  createRole,
  deleteRole,
  listPermissions,
  listRoles,
  listUsers,
  updateRole,
  updateUserRoles,
  type AdminUser,
  type PermissionGroups,
  type Role,
} from '@/api/roles'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import AdminLayout from '@/components/layout/AdminLayout'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

function formatLabel(value: string): string {
  return value
    .split(/[._]/)
    .map((word) => (word[0] ? word[0].toUpperCase() + word.slice(1) : word))
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

function extractErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data as
      | { message?: string; errors?: Record<string, string[]> }
      | undefined
    const firstFieldError = data?.errors ? Object.values(data.errors)[0]?.[0] : undefined
    return firstFieldError ?? data?.message ?? 'Something went wrong.'
  }
  return 'Something went wrong.'
}

interface RoleFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  role: Role | null
  permissionGroups: PermissionGroups
  onSaved: (role: Role) => void
}

function RoleFormDialog({ open, onOpenChange, role, permissionGroups, onSaved }: RoleFormDialogProps) {
  const [name, setName] = useState('')
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (open) {
      setName(role?.name ?? '')
      setSelected(new Set(role?.permissions ?? []))
      setError(null)
    }
  }, [open, role])

  const togglePermission = (permission: string, checked: boolean) => {
    setSelected((prev) => {
      const next = new Set(prev)
      if (checked) next.add(permission)
      else next.delete(permission)
      return next
    })
  }

  const handleSubmit = async () => {
    setSubmitting(true)
    setError(null)
    try {
      const payload = { name: name.trim(), permissions: Array.from(selected) }
      const saved = role ? await updateRole(role.id, payload) : await createRole(payload)
      onSaved(saved)
      toast.success(role ? 'Role updated.' : 'Role created.')
      onOpenChange(false)
    } catch (err) {
      setError(extractErrorMessage(err))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{role ? 'Edit role' : 'New role'}</DialogTitle>
          <DialogDescription>
            {role
              ? `Update permissions for "${formatLabel(role.name)}".`
              : 'Define a name and the permissions it grants.'}
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4">
          <div className="grid gap-1.5">
            <Label htmlFor="role-name">Role name</Label>
            <Input
              id="role-name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="e.g. support"
              disabled={submitting}
            />
          </div>

          <div className="grid max-h-72 gap-3 overflow-y-auto pr-1">
            {Object.entries(permissionGroups).map(([group, permissions]) => (
              <div key={group}>
                <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
                  {formatLabel(group)}
                </p>
                <div className="mt-1.5 grid gap-1.5">
                  {permissions.map((permission) => (
                    <label key={permission} className="flex items-center gap-2 text-sm">
                      <Checkbox
                        checked={selected.has(permission)}
                        onCheckedChange={(checked) => togglePermission(permission, checked === true)}
                        disabled={submitting}
                      />
                      {formatLabel(permission.split('.')[1] ?? permission)}
                    </label>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={submitting}>
            Cancel
          </Button>
          <Button onClick={() => void handleSubmit()} disabled={submitting || !name.trim()}>
            {submitting ? 'Saving…' : 'Save'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

interface UserRolesDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  user: AdminUser | null
  roles: Role[]
  onSaved: (user: AdminUser) => void
}

function UserRolesDialog({ open, onOpenChange, user, roles, onSaved }: UserRolesDialogProps) {
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (open) {
      setSelected(new Set(user?.roles ?? []))
      setError(null)
    }
  }, [open, user])

  const toggleRole = (role: string, checked: boolean) => {
    setSelected((prev) => {
      const next = new Set(prev)
      if (checked) next.add(role)
      else next.delete(role)
      return next
    })
  }

  const handleSubmit = async () => {
    if (!user) return
    setSubmitting(true)
    setError(null)
    try {
      const saved = await updateUserRoles(user.id, Array.from(selected))
      onSaved(saved)
      toast.success('Roles updated.')
      onOpenChange(false)
    } catch (err) {
      setError(extractErrorMessage(err))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Edit roles</DialogTitle>
          <DialogDescription>
            {user?.name} · {user?.mobile_number}
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-1.5">
          {roles.map((role) => (
            <label key={role.id} className="flex items-center gap-2 text-sm">
              <Checkbox
                checked={selected.has(role.name)}
                onCheckedChange={(checked) => toggleRole(role.name, checked === true)}
                disabled={submitting}
              />
              {formatLabel(role.name)}
            </label>
          ))}
        </div>

        {error && <p className="text-sm text-destructive">{error}</p>}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={submitting}>
            Cancel
          </Button>
          <Button onClick={() => void handleSubmit()} disabled={submitting}>
            {submitting ? 'Saving…' : 'Save'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default function RolesPermissions() {
  const { user: currentUser } = useAuth()

  const [roles, setRoles] = useState<Role[]>([])
  const [permissionGroups, setPermissionGroups] = useState<PermissionGroups>({})
  const [users, setUsers] = useState<AdminUser[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)

  const [roleDialogOpen, setRoleDialogOpen] = useState(false)
  const [editingRole, setEditingRole] = useState<Role | null>(null)
  const [deletingRole, setDeletingRole] = useState<Role | null>(null)

  const [userDialogOpen, setUserDialogOpen] = useState(false)
  const [editingUser, setEditingUser] = useState<AdminUser | null>(null)

  const canCreateRoles = currentUser?.permissions.includes('roles.create') ?? false
  const canUpdateRoles = currentUser?.permissions.includes('roles.update') ?? false
  const canDeleteRoles = currentUser?.permissions.includes('roles.delete') ?? false
  const canAssignRoles = currentUser?.permissions.includes('users.assign-roles') ?? false

  const loadAll = useCallback(async () => {
    setLoading(true)
    try {
      const [rolesData, permissionsData] = await Promise.all([listRoles(), listPermissions()])
      setRoles(rolesData)
      setPermissionGroups(permissionsData)
    } catch {
      toast.error('Failed to load roles & permissions.')
    } finally {
      setLoading(false)
    }
  }, [])

  const loadUsers = useCallback(async (query: string) => {
    try {
      const { users } = await listUsers(query)
      setUsers(users)
    } catch {
      toast.error('Failed to load users.')
    }
  }, [])

  useEffect(() => {
    void loadAll()
  }, [loadAll])

  useEffect(() => {
    const timeout = setTimeout(() => void loadUsers(search), 300)
    return () => clearTimeout(timeout)
  }, [search, loadUsers])

  const openCreateRole = () => {
    setEditingRole(null)
    setRoleDialogOpen(true)
  }

  const openEditRole = (role: Role) => {
    setEditingRole(role)
    setRoleDialogOpen(true)
  }

  const handleRoleSaved = (saved: Role) => {
    setRoles((prev) => {
      const exists = prev.some((role) => role.id === saved.id)
      const next = exists
        ? prev.map((role) => (role.id === saved.id ? saved : role))
        : [...prev, saved]
      return [...next].sort((a, b) => a.name.localeCompare(b.name))
    })
  }

  const handleDeleteRole = async () => {
    if (!deletingRole) return
    try {
      await deleteRole(deletingRole.id)
      setRoles((prev) => prev.filter((role) => role.id !== deletingRole.id))
      toast.success('Role deleted.')
    } catch (err) {
      toast.error(extractErrorMessage(err))
    } finally {
      setDeletingRole(null)
    }
  }

  const openEditUserRoles = (user: AdminUser) => {
    setEditingUser(user)
    setUserDialogOpen(true)
  }

  const handleUserSaved = (saved: AdminUser) => {
    setUsers((prev) => prev.map((user) => (user.id === saved.id ? saved : user)))
  }

  return (
    <AdminLayout title="Roles & Permissions" description="Manage staff roles and access">
      <div className="mx-auto max-w-6xl">
        <Tabs defaultValue="roles">
          <TabsList>
            <TabsTrigger value="roles">Roles</TabsTrigger>
            <TabsTrigger value="users">User assignments</TabsTrigger>
          </TabsList>

          <TabsContent value="roles" className="mt-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-base">Roles</CardTitle>
                {canCreateRoles && (
                  <Button size="sm" onClick={openCreateRole}>
                    New role
                  </Button>
                )}
              </CardHeader>
              <CardContent>
                <Separator className="mb-4" />
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Permissions</TableHead>
                      <TableHead>Users</TableHead>
                      <TableHead className="w-10" />
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {roles.map((role) => (
                      <TableRow key={role.id}>
                        <TableCell className="font-medium">
                          {formatLabel(role.name)}
                          {role.protected && (
                            <Badge variant="secondary" className="ml-2">
                              System
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="max-w-xs whitespace-normal">
                          <div className="flex flex-wrap gap-1">
                            {role.permissions.length === 0 && (
                              <span className="text-xs text-muted-foreground">No permissions</span>
                            )}
                            {role.permissions.slice(0, 4).map((permission) => (
                              <Badge key={permission} variant="outline" className="text-xs">
                                {permission}
                              </Badge>
                            ))}
                            {role.permissions.length > 4 && (
                              <Badge variant="outline" className="text-xs">
                                +{role.permissions.length - 4}
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>{role.users_count}</TableCell>
                        <TableCell>
                          {!role.protected && (
                            <div className="flex items-center gap-1">
                              {canUpdateRoles && (
                                <Button
                                  variant="ghost"
                                  size="icon-sm"
                                  aria-label="Edit"
                                  title="Edit"
                                  onClick={() => openEditRole(role)}
                                >
                                  <Pencil />
                                </Button>
                              )}
                              {canDeleteRoles && (
                                <Button
                                  variant="ghost"
                                  size="icon-sm"
                                  aria-label="Delete"
                                  title="Delete"
                                  className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                                  onClick={() => setDeletingRole(role)}
                                >
                                  <Trash2 />
                                </Button>
                              )}
                            </div>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                    {!loading && roles.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center text-sm text-muted-foreground">
                          No roles yet.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="users" className="mt-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between gap-4">
                <CardTitle className="text-base">Staff users</CardTitle>
                <div className="relative w-64">
                  <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Search by name or mobile"
                    className="pl-8"
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                  />
                </div>
              </CardHeader>
              <CardContent>
                <Separator className="mb-4" />
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>User</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Roles</TableHead>
                      <TableHead className="w-10" />
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Avatar size="sm">
                              <AvatarFallback className="text-xs">{initials(user.name)}</AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="text-sm leading-tight font-medium">{user.name}</p>
                              <p className="text-xs leading-tight text-muted-foreground">
                                {user.mobile_number}
                              </p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge
                            className="capitalize"
                            variant={user.status === 'active' ? 'secondary' : 'destructive'}
                          >
                            {user.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="max-w-xs whitespace-normal">
                          <div className="flex flex-wrap gap-1">
                            {user.roles.length === 0 && (
                              <span className="text-xs text-muted-foreground">No roles</span>
                            )}
                            {user.roles.map((role) => (
                              <Badge key={role} variant="outline" className="text-xs">
                                {formatLabel(role)}
                              </Badge>
                            ))}
                          </div>
                        </TableCell>
                        <TableCell>
                          {canAssignRoles && (
                            <Button variant="ghost" size="sm" onClick={() => openEditUserRoles(user)}>
                              Edit roles
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                    {users.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center text-sm text-muted-foreground">
                          No users found.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      <RoleFormDialog
        open={roleDialogOpen}
        onOpenChange={setRoleDialogOpen}
        role={editingRole}
        permissionGroups={permissionGroups}
        onSaved={handleRoleSaved}
      />

      <UserRolesDialog
        open={userDialogOpen}
        onOpenChange={setUserDialogOpen}
        user={editingUser}
        roles={roles}
        onSaved={handleUserSaved}
      />

      <AlertDialog open={deletingRole !== null} onOpenChange={(open) => !open && setDeletingRole(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete role?</AlertDialogTitle>
            <AlertDialogDescription>
              {deletingRole &&
                `"${formatLabel(deletingRole.name)}" will be removed from ${deletingRole.users_count} user(s). This can't be undone.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => void handleDeleteRole()}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AdminLayout>
  )
}
