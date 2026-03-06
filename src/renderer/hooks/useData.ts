import { useState, useEffect, useCallback, useRef } from 'react';

export function useData<T>(fetcher: () => Promise<T[]>, deps: unknown[] = []) {
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);

  const fetcherRef = useRef(fetcher);
  fetcherRef.current = fetcher;

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const result = await fetcherRef.current();
      setData(result);
    } catch (err) {
      console.error('[useData] fetch error:', err);
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  useEffect(() => { refresh(); }, [refresh]);

  return { data, loading, refresh };
}
