import { useCallback, useRef, useState } from 'react';

import { ApiError } from '@/api/client';

export interface AsyncState<T> {
  data: T | null;
  error: ApiError | null;
  isLoading: boolean;
}

export interface AsyncActions<T> {
  run: (operation: () => Promise<T>) => Promise<T | undefined>;
  reset: () => void;
}

export function useAsync<T>(initialData: T | null = null): AsyncState<T> & AsyncActions<T> {
  const initialDataRef = useRef(initialData);
  const requestIdRef = useRef(0);
  const [state, setState] = useState<AsyncState<T>>({ data: initialData, error: null, isLoading: false });

  const run = useCallback(async (operation: () => Promise<T>): Promise<T | undefined> => {
    const requestId = requestIdRef.current + 1;
    requestIdRef.current = requestId;
    setState((current) => ({ ...current, error: null, isLoading: true }));
    try {
      const data = await operation();
      if (requestId === requestIdRef.current) setState({ data, error: null, isLoading: false });
      return data;
    } catch (error: unknown) {
      const apiError = error instanceof ApiError
        ? error
        : new ApiError(0, error instanceof Error ? error.message : 'Network request failed.');
      if (requestId === requestIdRef.current) setState((current) => ({ ...current, error: apiError, isLoading: false }));
      return undefined;
    }
  }, []);

  const reset = useCallback(() => {
    requestIdRef.current += 1;
    setState({ data: initialDataRef.current, error: null, isLoading: false });
  }, []);

  return { ...state, run, reset };
}
