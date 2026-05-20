import { useState, useEffect, useCallback } from 'react';
import { metrics } from '@/services/api';

interface MetricsData {
  cpu: { usage_percent: number; load_avg_1m: number; cores: number };
  memory: { used_percent: number; used_gb: number; total_gb: number };
  disk: { used_percent: number; free_gb: number; total_gb: number };
  network: { recv_rate_kbps: number; sent_rate_kbps: number; connections: number };
  agent: { hostname: string; version: string; platform: string; uptime_seconds: number; overall_health: number };
  process: { details: Array<{ name: string; running: boolean; cpu_percent: number; memory_percent: number; pid: string; uptime: string }> };
  alerts: Array<{ title: string; description: string; time: string; severity?: string }>;
}

export function useMetrics(pollInterval = 10000) {
  const [data, setData] = useState<MetricsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      const response = await metrics.getLatest();
      setData(response.data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch metrics');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, pollInterval);
    return () => clearInterval(interval);
  }, [fetchData, pollInterval]);

  return { data, loading, error, refetch: fetchData };
}
