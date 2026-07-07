import { isAxiosError } from 'axios';

type ApiValidationErrors = Record<string, string[] | string>;

interface ApiErrorBody {
  message?: string;
  error?: string;
  errors?: ApiValidationErrors;
}

function firstValidationMessage(errors?: ApiValidationErrors): string | undefined {
  if (!errors) return undefined;

  const firstValue = Object.values(errors)[0];
  if (Array.isArray(firstValue)) {
    return firstValue[0];
  }

  return firstValue;
}

export function getApiErrorMessage(error: unknown, fallback: string): string {
  if (isAxiosError<ApiErrorBody>(error)) {
    const data = error.response?.data;
    return data?.message || data?.error || firstValidationMessage(data?.errors) || fallback;
  }

  if (error instanceof Error && error.message) {
    return error.message;
  }

  return fallback;
}
