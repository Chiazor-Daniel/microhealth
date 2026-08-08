import { useState, useEffect } from "react";
import { useSocket } from "./useSocket";

export function useRealtimeData<T>(
  event: string,
  fetchFn: () => Promise<T>,
  deps: any[] = []
) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const { on } = useSocket();

  const fetchData = async () => {
    try {
      setLoading(true);
      const result = await fetchFn();
      setData(result);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e : new Error(String(e)));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, deps);

  useEffect(() => {
    const unsubscribe = on(event, () => {
      fetchData();
    });
    return unsubscribe;
  }, [event, ...deps]);

  return { data, loading, error, refetch: fetchData };
}
