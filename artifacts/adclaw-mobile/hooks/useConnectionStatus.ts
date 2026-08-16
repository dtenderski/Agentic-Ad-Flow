import { useEffect, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';

export type ErrorKind = 'network' | 'server' | 'api' | null;

export interface ConnectionStatus {
  /** True when every active query has failed (server unreachable or no network). */
  isUnreachable: boolean;
  /** Classification of the dominant error type across failing queries. */
  errorKind: ErrorKind;
}

/**
 * Classify a single error object into one of three buckets:
 *  - 'network'  → fetch/TCP failure; device is offline or server is not listening
 *  - 'server'   → HTTP 5xx; server is up but crashing
 *  - 'api'      → HTTP 4xx; request is bad but server is healthy
 */
export function classifyError(err: unknown): ErrorKind {
  if (!err) return null;

  // TypeError from fetch() when the request never gets a response
  if (err instanceof TypeError) {
    const msg = err.message.toLowerCase();
    if (
      msg.includes('network request failed') ||
      msg.includes('failed to fetch') ||
      msg.includes('fetch failed') ||
      msg.includes('network error') ||
      msg.includes('econnrefused') ||
      msg.includes('econnreset') ||
      msg.includes('etimedout')
    ) {
      return 'network';
    }
  }

  // Orval / axios / ky style errors that carry a numeric status
  const withStatus = err as { status?: number; response?: { status?: number } };
  const status = withStatus.status ?? withStatus.response?.status;
  if (typeof status === 'number') {
    if (status >= 500) return 'server';
    if (status >= 400) return 'api';
  }

  // Fall through for unknown shapes — treat like network error so users know
  // something is wrong rather than getting a generic "API error" for a crash.
  return 'network';
}

function deriveStatus(queryCache: ReturnType<ReturnType<typeof useQueryClient>['getQueryCache']>): ConnectionStatus {
  const queries = queryCache.getAll().filter((q) => q.getObserversCount() > 0);

  if (queries.length === 0) {
    return { isUnreachable: false, errorKind: null };
  }

  const errorQueries = queries.filter((q) => q.state.status === 'error');

  // Only signal unreachable when every active query has failed
  const isUnreachable = errorQueries.length > 0 && errorQueries.length === queries.length;

  if (!isUnreachable) {
    return { isUnreachable: false, errorKind: null };
  }

  // Pick the most severe error kind across all failing queries
  const kinds = errorQueries.map((q) => classifyError(q.state.error));
  const errorKind: ErrorKind = kinds.includes('network')
    ? 'network'
    : kinds.includes('server')
    ? 'server'
    : kinds.includes('api')
    ? 'api'
    : 'network';

  return { isUnreachable: true, errorKind };
}

export function useConnectionStatus(): ConnectionStatus {
  const queryClient = useQueryClient();
  const queryCache = queryClient.getQueryCache();

  const [status, setStatus] = useState<ConnectionStatus>(() =>
    deriveStatus(queryCache),
  );

  useEffect(() => {
    // Re-derive on every cache mutation (query added, status changed, etc.)
    const unsubscribe = queryCache.subscribe(() => {
      setStatus(deriveStatus(queryCache));
    });
    return unsubscribe;
  }, [queryCache]);

  return status;
}
