import { useState, useCallback, useRef, useEffect } from 'react';

interface UseAsyncState<T> {
  data: T | null;
  loading: boolean;
  error: Error | null;
}

interface UseAsyncOptions {
  onSuccess?: () => void;
  onError?: (error: Error) => void;
  retries?: number;
  retryDelay?: number;
}

export function useAsync<T>(
  asyncFunction: () => Promise<T>,
  immediate: boolean = true,
  options: UseAsyncOptions = {}
) {
  const { retries = 3, retryDelay = 1000 } = options;
  const [state, setState] = useState<UseAsyncState<T>>({
    data: null,
    loading: immediate,
    error: null,
  });

  const retryCountRef = useRef(0);

  const execute = useCallback(
    async (retriesLeft = retries) => {
      setState({ data: null, loading: true, error: null });
      try {
        const response = await asyncFunction();
        setState({ data: response, loading: false, error: null });
        options.onSuccess?.();
        return response;
      } catch (error) {
        const err = error instanceof Error ? error : new Error(String(error));
        
        if (retriesLeft > 0) {
          setTimeout(() => execute(retriesLeft - 1), retryDelay);
          return;
        }

        setState({ data: null, loading: false, error: err });
        options.onError?.(err);
        throw err;
      }
    },
    [asyncFunction, retries, retryDelay, options]
  );

  useEffect(() => {
    if (immediate) {
      execute();
    }
  }, [execute, immediate]);

  return {
    ...state,
    execute,
  };
}
