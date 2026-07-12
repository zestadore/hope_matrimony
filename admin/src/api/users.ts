import { apiClient } from './client'

export interface MemberProfile {
  gender: 'male' | 'female' | ''
  date_of_birth: string
  marital_status: string | null
  children: number | null
  on_behalf: string | null
  mother_tongue: string | null
  known_languages: string[] | null
  introduction: string | null
  height_cm: number | null
  weight_kg: number | null
  complexion: string | null
  body_type: string | null
  blood_group: string | null
  disability: string | null
  diet: string | null
  drink: string | null
  smoke: string | null
  living_with: string | null
  time_of_birth: string | null
  birth_city: string | null
  malayalam_star: string | null
  manglik: string | null
  sudha_jathakam: string | null
  jathakam_path: string | null
  jathakam_original_name: string | null
  hobbies: string | null
  interests: string | null
  music: string | null
  movies: string | null
  sports: string | null
  cuisines: string | null
}

export interface MemberFamily {
  religion_id: number | null
  caste_id: number | null
  sub_caste: string | null
  community_value: string | null
  father_name: string | null
  mother_name: string | null
  siblings: string | null
  family_status: string | null
  family_value: string | null
}

export interface MemberResidency {
  native_state_id: number | null
  native_district_id: number | null
  current_state_id: number | null
  current_district_id: number | null
  current_address: string | null
  postal_code: string | null
  immigration_status: string | null
}

export interface MemberEducation {
  id?: number
  education_level_id: number | null
  qualification_id: number | null
  institution: string | null
  start_year: number | null
  end_year: number | null
  is_current: boolean
}

export interface MemberCareer {
  id?: number
  designation: string | null
  company: string | null
  industry_id: number | null
  start_year: number | null
  end_year: number | null
  is_current: boolean
}

export interface MemberPartnerPreference {
  age_from: number | null
  age_to: number | null
  height_from_cm: number | null
  height_to_cm: number | null
  marital_status: string | null
  children_acceptable: string | null
  religion_id: number | null
  caste_id: number | null
  sub_caste: string | null
  education_level_id: number | null
  industry_id: number | null
  diet: string | null
  smoking_acceptable: string | null
  drinking_acceptable: string | null
  body_type: string | null
  complexion: string | null
  manglik: string | null
  mother_tongue: string | null
  family_value: string | null
  preferred_state_id: number | null
  general: string | null
}

export interface MemberPhoto {
  id: number
  path: string
  original_name: string | null
  is_default: boolean
}

export interface UserSummary {
  id: number
  profile_id: string | null
  name: string
  mobile_number: string
  email: string | null
  status: string
  roles: string[]
  gender: string | null
  age: number | null
  education_level_name: string | null
  profile_photo: string | null
}

export interface UserDetail extends UserSummary {
  profile: MemberProfile | null
  family: MemberFamily | null
  residency: MemberResidency | null
  partner_preference: MemberPartnerPreference | null
  educations: MemberEducation[]
  careers: MemberCareer[]
  photos: MemberPhoto[]
}

export interface UserPayload {
  name: string
  mobile_number: string
  email: string | null
  password?: string
  status: string
  role: string
  profile: MemberProfile
  family: MemberFamily
  residency: MemberResidency
  educations: MemberEducation[]
  careers: MemberCareer[]
  partner_preference: MemberPartnerPreference
}

export interface TeamUserPayload {
  name: string
  mobile_number: string
  email: string | null
  password?: string
  status: string
  role: string
}

export interface PaginationMeta {
  current_page: number
  last_page: number
  total: number
}

export type UserSegment = 'members' | 'team'

export async function listUsers(params: {
  search?: string
  segment?: UserSegment
} = {}): Promise<{ users: UserSummary[]; meta: PaginationMeta }> {
  const response = await apiClient.get<{ users: UserSummary[]; meta: PaginationMeta }>('/api/admin/users', {
    params: {
      search: params.search || undefined,
      segment: params.segment || undefined,
    },
  })
  return response.data
}

export async function getUser(id: number): Promise<UserDetail> {
  const response = await apiClient.get<{ user: UserDetail }>(`/api/admin/users/${id}`)
  return response.data.user
}

export async function createUser(payload: UserPayload): Promise<UserDetail> {
  const response = await apiClient.post<{ user: UserDetail }>('/api/admin/users', payload)
  return response.data.user
}

export async function updateUser(id: number, payload: UserPayload): Promise<UserDetail> {
  const response = await apiClient.put<{ user: UserDetail }>(`/api/admin/users/${id}`, payload)
  return response.data.user
}

export async function deleteUser(id: number): Promise<void> {
  await apiClient.delete(`/api/admin/users/${id}`)
}

export async function createTeamUser(payload: TeamUserPayload): Promise<UserDetail> {
  const response = await apiClient.post<{ user: UserDetail }>('/api/admin/users', payload)
  return response.data.user
}

export async function updateTeamUser(id: number, payload: TeamUserPayload): Promise<UserDetail> {
  const response = await apiClient.put<{ user: UserDetail }>(`/api/admin/users/${id}`, payload)
  return response.data.user
}

export async function uploadJathakam(
  userId: number,
  file: File,
): Promise<{ jathakam_path: string; jathakam_original_name: string }> {
  const formData = new FormData()
  formData.append('jathakam', file)
  const response = await apiClient.post<{ jathakam_path: string; jathakam_original_name: string }>(
    `/api/admin/users/${userId}/jathakam`,
    formData,
  )
  return response.data
}

export async function deleteJathakam(userId: number): Promise<void> {
  await apiClient.delete(`/api/admin/users/${userId}/jathakam`)
}

export async function uploadPhoto(userId: number, file: File): Promise<MemberPhoto[]> {
  const formData = new FormData()
  formData.append('photo', file)
  const response = await apiClient.post<{ photos: MemberPhoto[] }>(
    `/api/admin/users/${userId}/photos`,
    formData,
  )
  return response.data.photos
}

export async function deletePhoto(userId: number, photoId: number): Promise<MemberPhoto[]> {
  const response = await apiClient.delete<{ photos: MemberPhoto[] }>(
    `/api/admin/users/${userId}/photos/${photoId}`,
  )
  return response.data.photos
}

export async function setDefaultPhoto(userId: number, photoId: number): Promise<MemberPhoto[]> {
  const response = await apiClient.put<{ photos: MemberPhoto[] }>(
    `/api/admin/users/${userId}/photos/${photoId}/default`,
  )
  return response.data.photos
}
