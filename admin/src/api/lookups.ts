import { apiClient } from './client'

export interface LookupOptions {
  genders: string[]
  marital_statuses: string[]
  on_behalf: string[]
  languages: string[]
  complexions: string[]
  body_types: string[]
  blood_groups: string[]
  diets: string[]
  habit_levels: string[]
  living_with: string[]
  manglik: string[]
  malayalam_stars: string[]
  children_acceptable: string[]
  family_values: string[]
  family_statuses: string[]
}

export async function getLookups(): Promise<LookupOptions> {
  const response = await apiClient.get<LookupOptions>('/api/lookups')
  return response.data
}

export interface State {
  id: number
  name: string
  code: string
}

export interface District {
  id: number
  name: string
  state_id: number
}

export async function listStates(): Promise<State[]> {
  const response = await apiClient.get<{ states: State[] }>('/api/states')
  return response.data.states
}

export async function listDistricts(stateId: number): Promise<District[]> {
  const response = await apiClient.get<{ districts: District[] }>(`/api/states/${stateId}/districts`)
  return response.data.districts
}
