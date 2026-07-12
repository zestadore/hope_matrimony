import { apiClient } from './client'

export interface EducationLevel {
  id: number
  name: string
}

export interface Qualification {
  id: number
  name: string
  education_level_id: number
  education_level_name: string
}

export interface PaginationMeta {
  current_page: number
  last_page: number
  total: number
}

export async function listEducationLevels(): Promise<EducationLevel[]> {
  const response = await apiClient.get<{ education_levels: EducationLevel[] }>('/api/education-levels')
  return response.data.education_levels
}

export async function listQualifications(params: {
  search?: string
  educationLevelId?: number
} = {}): Promise<{ qualifications: Qualification[]; meta: PaginationMeta }> {
  const response = await apiClient.get<{ qualifications: Qualification[]; meta: PaginationMeta }>(
    '/api/admin/qualifications',
    {
      params: {
        search: params.search || undefined,
        education_level_id: params.educationLevelId || undefined,
      },
    },
  )
  return response.data
}

export async function createQualification(payload: {
  education_level_id: number
  name: string
}): Promise<Qualification> {
  const response = await apiClient.post<{ qualification: Qualification }>(
    '/api/admin/qualifications',
    payload,
  )
  return response.data.qualification
}

export async function updateQualification(
  id: number,
  payload: { education_level_id: number; name: string },
): Promise<Qualification> {
  const response = await apiClient.put<{ qualification: Qualification }>(
    `/api/admin/qualifications/${id}`,
    payload,
  )
  return response.data.qualification
}

export async function deleteQualification(id: number): Promise<void> {
  await apiClient.delete(`/api/admin/qualifications/${id}`)
}
