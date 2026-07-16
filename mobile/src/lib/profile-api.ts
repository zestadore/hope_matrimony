import { Platform } from 'react-native';

import { api } from '@/lib/api';

export type LookupOption = { id: number; name: string };

export type MemberOptions = {
  genders: string[];
  marital_statuses: string[];
  on_behalf: string[];
  languages: string[];
  complexions: string[];
  body_types: string[];
  blood_groups: string[];
  diets: string[];
  habit_levels: string[];
  living_with: string[];
  manglik: string[];
  malayalam_stars: string[];
  children_acceptable: string[];
  family_values: string[];
  family_statuses: string[];
};

export type MemberProfileData = {
  gender: string | null;
  date_of_birth: string | null;
  marital_status: string | null;
  children: number | null;
  on_behalf: string | null;
  mother_tongue: string | null;
  known_languages: string[] | null;
  introduction: string | null;
  height_cm: number | null;
  weight_kg: number | null;
  complexion: string | null;
  body_type: string | null;
  blood_group: string | null;
  disability: string | null;
  diet: string | null;
  drink: string | null;
  smoke: string | null;
  living_with: string | null;
  time_of_birth: string | null;
  birth_city: string | null;
  malayalam_star: string | null;
  manglik: string | null;
  sudha_jathakam: string | null;
  hobbies: string | null;
  interests: string | null;
  music: string | null;
  movies: string | null;
  sports: string | null;
  cuisines: string | null;
};

export type MemberFamilyData = {
  religion_id: number | null;
  caste_id: number | null;
  sub_caste: string | null;
  community_value: string | null;
  father_name: string | null;
  mother_name: string | null;
  siblings: string | null;
  family_status: string | null;
  family_value: string | null;
};

export type MemberResidencyData = {
  native_state_id: number | null;
  native_district_id: number | null;
  current_state_id: number | null;
  current_district_id: number | null;
  current_address: string | null;
  postal_code: string | null;
  immigration_status: string | null;
};

export type MemberEducationRow = {
  education_level_id: number | null;
  qualification_id: number | null;
  institution: string | null;
  start_year: number | null;
  end_year: number | null;
  is_current: boolean;
};

export type MemberCareerRow = {
  designation: string | null;
  company: string | null;
  industry_id: number | null;
  start_year: number | null;
  end_year: number | null;
  is_current: boolean;
};

export type MemberPartnerPreferenceData = {
  age_from: number | null;
  age_to: number | null;
  height_from_cm: number | null;
  height_to_cm: number | null;
  marital_status: string | null;
  children_acceptable: string | null;
  religion_id: number | null;
  caste_id: number | null;
  sub_caste: string | null;
  education_level_id: number | null;
  industry_id: number | null;
  diet: string | null;
  smoking_acceptable: string | null;
  drinking_acceptable: string | null;
  body_type: string | null;
  complexion: string | null;
  manglik: string | null;
  mother_tongue: string | null;
  family_value: string | null;
  preferred_state_id: number | null;
  general: string | null;
};

export type MemberPhotoData = {
  id: number;
  /** Location on the backend's public disk, e.g. member-photos/x.jpg. */
  path: string;
  /**
   * Absolute URL built from the backend's APP_URL. Prefer resolvePhotoUrl(),
   * which derives the origin from API_BASE_URL — the host this app can
   * actually reach, which on a device is not what APP_URL usually names.
   */
  url: string;
  original_name: string;
  is_default: boolean;
};

export type ProfileBundle = {
  profile: MemberProfileData | null;
  family: MemberFamilyData | null;
  residency: MemberResidencyData | null;
  partner_preference: MemberPartnerPreferenceData | null;
  educations: MemberEducationRow[];
  careers: MemberCareerRow[];
  photos: MemberPhotoData[];
};

export const emptyProfile: MemberProfileData = {
  gender: null,
  date_of_birth: null,
  marital_status: null,
  children: null,
  on_behalf: null,
  mother_tongue: null,
  known_languages: null,
  introduction: null,
  height_cm: null,
  weight_kg: null,
  complexion: null,
  body_type: null,
  blood_group: null,
  disability: null,
  diet: null,
  drink: null,
  smoke: null,
  living_with: null,
  time_of_birth: null,
  birth_city: null,
  malayalam_star: null,
  manglik: null,
  sudha_jathakam: null,
  hobbies: null,
  interests: null,
  music: null,
  movies: null,
  sports: null,
  cuisines: null,
};

export const emptyFamily: MemberFamilyData = {
  religion_id: null,
  caste_id: null,
  sub_caste: null,
  community_value: null,
  father_name: null,
  mother_name: null,
  siblings: null,
  family_status: null,
  family_value: null,
};

export const emptyResidency: MemberResidencyData = {
  native_state_id: null,
  native_district_id: null,
  current_state_id: null,
  current_district_id: null,
  current_address: null,
  postal_code: null,
  immigration_status: null,
};

export const emptyPartnerPreference: MemberPartnerPreferenceData = {
  age_from: null,
  age_to: null,
  height_from_cm: null,
  height_to_cm: null,
  marital_status: null,
  children_acceptable: null,
  religion_id: null,
  caste_id: null,
  sub_caste: null,
  education_level_id: null,
  industry_id: null,
  diet: null,
  smoking_acceptable: null,
  drinking_acceptable: null,
  body_type: null,
  complexion: null,
  manglik: null,
  mother_tongue: null,
  family_value: null,
  preferred_state_id: null,
  general: null,
};

export const emptyEducationRow: MemberEducationRow = {
  education_level_id: null,
  qualification_id: null,
  institution: null,
  start_year: null,
  end_year: null,
  is_current: false,
};

export const emptyCareerRow: MemberCareerRow = {
  designation: null,
  company: null,
  industry_id: null,
  start_year: null,
  end_year: null,
  is_current: false,
};

export async function fetchProfileBundle(): Promise<ProfileBundle> {
  const { data } = await api.get<ProfileBundle>('/member/profile');
  return data;
}

/**
 * Saves exactly one profile section at a time — pass only the top-level
 * key(s) being edited (e.g. `{ family: updatedFamily }`), not the whole
 * bundle. The backend only touches sections present in the payload, so other
 * sections are left untouched no matter what state they're in.
 */
export async function saveProfileSection(payload: Partial<ProfileBundle>): Promise<ProfileBundle> {
  const { data } = await api.put<ProfileBundle>('/member/profile', payload);
  return data;
}

export async function uploadMemberPhoto(file: { uri: string; name: string; type: string }) {
  const form = new FormData();

  if (Platform.OS === 'web') {
    // Web gets the DOM FormData, which stringifies a { uri, name, type } object
    // to "[object Object]" instead of attaching a file. The picker hands back a
    // blob:/data: URI here, so read it and append a real File.
    const blob = await fetch(file.uri).then((res) => res.blob());
    form.append('photo', new File([blob], file.name, { type: file.type }));
  } else {
    // React Native's FormData accepts { uri, name, type } objects for files; this
    // isn't representable in the DOM FormData type, hence the cast.
    form.append('photo', { uri: file.uri, name: file.name, type: file.type } as unknown as Blob);
  }

  const { data } = await api.post<{ photos: MemberPhotoData[] }>('/member/photos', form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return data.photos;
}

export async function deleteMemberPhoto(photoId: number) {
  const { data } = await api.delete<{ photos: MemberPhotoData[] }>(`/member/photos/${photoId}`);
  return data.photos;
}

export async function fetchMemberOptions(): Promise<MemberOptions> {
  const { data } = await api.get<MemberOptions>('/lookups');
  return data;
}

export async function fetchStates(): Promise<LookupOption[]> {
  const { data } = await api.get<{ states: LookupOption[] }>('/states');
  return data.states;
}

export async function fetchDistricts(stateId: number): Promise<LookupOption[]> {
  const { data } = await api.get<{ districts: LookupOption[] }>(`/states/${stateId}/districts`);
  return data.districts;
}

export async function fetchReligions(): Promise<LookupOption[]> {
  const { data } = await api.get<{ religions: LookupOption[] }>('/religions');
  return data.religions;
}

export async function fetchCastes(religionId: number): Promise<LookupOption[]> {
  const { data } = await api.get<{ castes: LookupOption[] }>(`/religions/${religionId}/castes`);
  return data.castes;
}

export async function fetchEducationLevels(): Promise<LookupOption[]> {
  const { data } = await api.get<{ education_levels: LookupOption[] }>('/education-levels');
  return data.education_levels;
}

export async function fetchQualifications(educationLevelId: number): Promise<LookupOption[]> {
  const { data } = await api.get<{ qualifications: LookupOption[] }>(
    `/education-levels/${educationLevelId}/qualifications`,
  );
  return data.qualifications;
}

export async function fetchIndustries(): Promise<LookupOption[]> {
  const { data } = await api.get<{ industries: LookupOption[] }>('/industries');
  return data.industries;
}
