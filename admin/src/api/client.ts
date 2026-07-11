import axios, { type AxiosError, type InternalAxiosRequestConfig } from 'axios'

const baseURL = import.meta.env.VITE_API_BASE_URL || ''

// The access token lives in memory only (never localStorage/sessionStorage)
// so it can't be lifted by an XSS payload reading browser storage. It is
// restored on page load via the httpOnly refresh-token cookie instead.
let accessToken: string | null = null
let unauthorizedHandler: (() => void) | null = null

export function setAccessToken(token: string | null): void {
  accessToken = token
}

export function getAccessToken(): string | null {
  return accessToken
}

export function onUnauthorized(handler: () => void): void {
  unauthorizedHandler = handler
}

export const apiClient = axios.create({
  baseURL,
  withCredentials: true,
  headers: {
    Accept: 'application/json',
  },
})

apiClient.interceptors.request.use((config) => {
  if (accessToken) {
    config.headers.set('Authorization', `Bearer ${accessToken}`)
  }
  return config
})

interface RetryableConfig extends InternalAxiosRequestConfig {
  _retried?: boolean
}

let refreshPromise: Promise<string | null> | null = null

export async function refreshAccessToken(): Promise<string | null> {
  if (!refreshPromise) {
    refreshPromise = axios
      .post<{ access_token: string }>(
        `${baseURL}/api/auth/refresh`,
        null,
        { withCredentials: true, headers: { Accept: 'application/json' } },
      )
      .then((response) => {
        const token = response.data.access_token
        setAccessToken(token)
        return token
      })
      .catch(() => {
        setAccessToken(null)
        return null
      })
      .finally(() => {
        refreshPromise = null
      })
  }

  return refreshPromise
}

apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const config = error.config as RetryableConfig | undefined
    const isAuthEndpoint = config?.url?.includes('/auth/login') || config?.url?.includes('/auth/refresh')

    if (error.response?.status === 401 && config && !config._retried && !isAuthEndpoint) {
      config._retried = true
      const token = await refreshAccessToken()

      if (token) {
        config.headers.set('Authorization', `Bearer ${token}`)
        return apiClient(config)
      }

      unauthorizedHandler?.()
    }

    return Promise.reject(error)
  },
)
