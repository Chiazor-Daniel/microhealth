import { useState, useEffect, useCallback } from "react";
import { useSocket } from "../../hooks/useSocket";
import { aiService, type Insight } from "../../services/ai.service";

export function useInsights() {
  const [insights, setInsights] = useState<Insight[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { on } = useSocket();

  const fetch = useCallback(async () => {
    setLoading(true);
    try {
      const data = await aiService.listInsights();
      setInsights(data);
      setError(null);
    } catch (err: any) {
      setError(err.message || "Failed to load insights");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetch();
  }, [fetch]);

  useEffect(() => {
    const off = on("ai:insight", (insight: Insight) => {
      setInsights((prev) => [insight, ...prev]);
    });
    return () => { off(); };
  }, [on]);

  const markRead = useCallback(async (id: string) => {
    await aiService.markRead(id);
    setInsights((prev) =>
      prev.map((i) => (i.id === id ? { ...i, isRead: true } : i))
    );
  }, []);

  const dismiss = useCallback(async (id: string) => {
    await aiService.dismiss(id);
    setInsights((prev) => prev.filter((i) => i.id !== id));
  }, []);

  return { insights, loading, error, refresh: fetch, markRead, dismiss };
}
