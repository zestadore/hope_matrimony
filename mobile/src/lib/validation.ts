import { z } from 'zod';

import type { Translate } from '@/lib/i18n/locale-context';

// These are factories rather than constants because the messages are shown to
// the user and must follow the active language. Build them inside a
// useMemo(..., [t]) so the schema is rebuilt when the language changes.

// Mirrors backend/app/Http/Requests/Auth/LoginRequest.php
export const mobileNumberSchema = (t: Translate) =>
  z.string().regex(/^[6-9]\d{9}$/, t('validation.mobile'));

// Mirrors the Password::min(10)->mixedCase()->numbers()->symbols() policy used by
// backend/app/Http/Requests/Auth/RegisterRequest.php and ResetPasswordRequest.php
export const passwordSchema = (t: Translate) =>
  z
    .string()
    .min(10, t('validation.passwordMin'))
    .regex(/[a-z]/, t('validation.passwordLower'))
    .regex(/[A-Z]/, t('validation.passwordUpper'))
    .regex(/[0-9]/, t('validation.passwordNumber'))
    .regex(/[^a-zA-Z0-9]/, t('validation.passwordSymbol'));
