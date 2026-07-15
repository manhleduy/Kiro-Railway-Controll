import { useState, useEffect, useCallback } from 'react';
import { gql } from '@/services/graphql.service';

interface GraphQLState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
}

export function useGraphQL<T>(
  query: string,
  variables?: Record<string, unknown>,
): GraphQLState<T> & { refetch: () => void } {
  const [state, setState] = useState<GraphQLState<T>>({
    data: null,
    loading: true,
    error: null,
  });

  const fetchData = useCallback(() => {
    setState((prev) => ({ ...prev, loading: true, error: null }));
    gql<T>(query, variables)
      .then((data: T) => setState({ data, loading: false, error: null }))
      .catch((err: unknown) => {
        const message =
          err instanceof Error ? err.message : 'An error occurred';
        setState({ data: null, loading: false, error: message });
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query, JSON.stringify(variables)]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { ...state, refetch: fetchData };
}
