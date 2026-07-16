import type { Href } from 'expo-router';

import type { TranslationKey } from '@/lib/i18n/translations';

/**
 * The dashboard API sends each section's English `label` alongside its `key`.
 * The app translates from the key instead, so section names follow the chosen
 * language without the server needing to know it. Falls back to the server's
 * label for any key not listed here.
 */
export const SECTION_LABEL_KEYS: Record<string, TranslationKey> = {
  basic_info: 'section.basic_info',
  family: 'section.family',
  residency: 'section.residency',
  education: 'section.education',
  career: 'section.career',
  partner_preference: 'section.partner_preference',
  photos: 'section.photos',
};

export const SECTION_ROUTES: Record<string, Href> = {
  basic_info: '/profile-editor/basic-info',
  family: '/profile-editor/family',
  residency: '/profile-editor/residency',
  education: '/profile-editor/education',
  career: '/profile-editor/career',
  partner_preference: '/profile-editor/partner-preference',
  photos: '/profile-editor/photos',
};
