// Project Amnion 2.0 - Error Composables

import { AxiosError } from 'axios';

export function useError() {
  function getErrorMessage(err: unknown): string {
    if (err instanceof AxiosError) {
      const data = err.response?.data as { error?: string; message?: string };
      return data?.error || data?.message || err.message || 'Er is een onbekende fout opgetreden.';
    } else if (err instanceof Error) {
      return err.message;
    } else if (typeof err === 'string') {
      return err;
    } else {
      return 'Er is een onbekende fout opgetreden.';
    }
  }

  function getErrorDetails(err: unknown): { message: string; status?: number } {
    if (err instanceof AxiosError) {
      return {
        message: getErrorMessage(err),
        status: err.response?.status,
      };
    }
    return {
      message: getErrorMessage(err),
    };
  }

  return {
    getErrorMessage,
    getErrorDetails,
  };
}
