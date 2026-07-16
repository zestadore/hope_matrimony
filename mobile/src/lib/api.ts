import axios from 'axios';

export const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:8000/api';

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: { Accept: 'application/json' },
});

/**
 * Tells the API which language to answer in — Laravel's SetLocale middleware
 * reads this and localises validation and error messages, which the auth
 * screens surface verbatim via getErrorMessage().
 */
export function setApiLocale(locale: string) {
  api.defaults.headers.common['Accept-Language'] = locale;
}

export function setAuthToken(token: string | null) {
  if (token) {
    api.defaults.headers.common.Authorization = `Bearer ${token}`;
  } else {
    delete api.defaults.headers.common.Authorization;
  }
}

let onUnauthorized: (() => void) | null = null;

/**
 * Registers the callback fired when the API rejects our bearer token. Set by
 * AuthProvider, which clears the session — the route guards then redirect to
 * login on their own.
 */
export function setUnauthorizedHandler(handler: (() => void) | null) {
  onUnauthorized = handler;
}

// These endpoints answer 401 to mean "wrong credentials", not "session
// expired", so a 401 from them must not tear down the session — otherwise a
// failed sign-in attempt would look like an expiry.
const CREDENTIAL_PATHS = ['/auth/login', '/auth/register', '/auth/forgot-password', '/auth/reset-password'];

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const url = error.config?.url ?? '';
    const isCredentialCheck = CREDENTIAL_PATHS.some((path) => url.startsWith(path));

    if (error.response?.status === 401 && !isCredentialCheck) {
      onUnauthorized?.();
    }

    // Still reject: callers that are mid-flight decide their own messaging.
    return Promise.reject(error);
  },
);
