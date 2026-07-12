import { apiClient } from './client'

export interface Industry {
  id: number
  name: string
}

export interface PaginationMeta {
  current_page: number
  last_page: number
  total: number
}

export async function listIndustries(params: {
  search?: string
} = {}): Promise<{ industries: Industry[]; meta: PaginationMeta }> {
  const response = await apiClient.get<{ industries: Industry[]; meta: PaginationMeta }>(
    '/api/admin/industries',
    {
      params: {
        search: params.search || undefined,
      },
    },
  )
  return response.data
}

export async function createIndustry(payload: { name: string }): Promise<Industry> {
  const response = await apiClient.post<{ industry: Industry }>('/api/admin/industries', payload)
  return response.data.industry
}

export async function updateIndustry(id: number, payload: { name: string }): Promise<Industry> {
  const response = await apiClient.put<{ industry: Industry }>(`/api/admin/industries/${id}`, payload)
  return response.data.industry
}

export async function deleteIndustry(id: number): Promise<void> {
  await apiClient.delete(`/api/admin/industries/${id}`)
}
