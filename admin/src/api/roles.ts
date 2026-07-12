import { apiClient } from './client'

export interface Role {
  id: number
  name: string
  permissions: string[]
  users_count: number
  protected: boolean
}

export interface AdminUser {
  id: number
  name: string
  mobile_number: string
  email: string | null
  status: string
  roles: string[]
}

export interface PaginationMeta {
  current_page: number
  last_page: number
  total: number
}

export type PermissionGroups = Record<string, string[]>

export async function listRoles(): Promise<Role[]> {
  const response = await apiClient.get<{ roles: Role[] }>('/api/admin/roles')
  return response.data.roles
}

export async function createRole(payload: { name: string; permissions: string[] }): Promise<Role> {
  const response = await apiClient.post<{ role: Role }>('/api/admin/roles', payload)
  return response.data.role
}

export async function updateRole(
  id: number,
  payload: { name: string; permissions: string[] },
): Promise<Role> {
  const response = await apiClient.put<{ role: Role }>(`/api/admin/roles/${id}`, payload)
  return response.data.role
}

export async function deleteRole(id: number): Promise<void> {
  await apiClient.delete(`/api/admin/roles/${id}`)
}

export async function listPermissions(): Promise<PermissionGroups> {
  const response = await apiClient.get<{ permissions: PermissionGroups }>('/api/admin/permissions')
  return response.data.permissions
}

export async function listUsers(search = ''): Promise<{ users: AdminUser[]; meta: PaginationMeta }> {
  const response = await apiClient.get<{ users: AdminUser[]; meta: PaginationMeta }>('/api/admin/users', {
    params: search ? { search } : undefined,
  })
  return response.data
}

export async function updateUserRoles(userId: number, roles: string[]): Promise<AdminUser> {
  const response = await apiClient.put<{ user: AdminUser }>(`/api/admin/users/${userId}/roles`, { roles })
  return response.data.user
}
