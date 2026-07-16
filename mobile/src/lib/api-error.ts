import axios from 'axios';

type ValidationErrorBody = {
  message?: string;
  errors?: Record<string, string[]>;
};

export function getErrorMessage(err: unknown, fallback: string): string {
  if (!axios.isAxiosError(err)) return fallback;

  const data = err.response?.data as ValidationErrorBody | undefined;
  const firstFieldError = data?.errors ? Object.values(data.errors)[0]?.[0] : undefined;

  return firstFieldError ?? data?.message ?? fallback;
}
