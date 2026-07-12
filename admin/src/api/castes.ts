import { apiClient } from './client'

export interface Religion {
  id: number
  name: string
}

export interface Caste {
  id: number
  name: string
  religion_id: number
  religion_name: string
}

export interface PaginationMeta {
  current_page: number
  last_page: number
  total: number
}

export async function listReligions(): Promise<Religion[]> {
  const response = await apiClient.get<{ religions: Religion[] }>('/api/religions')
  return response.data.religions
}

export async function listCastes(params: {
  search?: string
  religionId?: number
} = {}): Promise<{ castes: Caste[]; meta: PaginationMeta }> {
  const response = await apiClient.get<{ castes: Caste[]; meta: PaginationMeta }>(
    '/api/admin/castes',
    {
      params: {
        search: params.search || undefined,
        religion_id: params.religionId || undefined,
      },
    },
  )
  return response.data
}

export async function createCaste(payload: { religion_id: number; name: string }): Promise<Caste> {
  const response = await apiClient.post<{ caste: Caste }>('/api/admin/castes', payload)
  return response.data.caste
}

export async function updateCaste(
  id: number,
  payload: { religion_id: number; name: string },
): Promise<Caste> {
  const response = await apiClient.put<{ caste: Caste }>(`/api/admin/castes/${id}`, payload)
  return response.data.caste
}

export async function deleteCaste(id: number): Promise<void> {
  await apiClient.delete(`/api/admin/castes/${id}`)
}
