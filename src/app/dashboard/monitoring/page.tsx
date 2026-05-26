'use client';

import { useEffect, useState } from 'react';
import { Card } from '@/components/shared/Card';
import { LineChart } from '@/components/shared/LineChart';
import { BarChart } from '@/components/shared/BarChart';

interface MetricsData {
  timestamp: string;
  memory: {
    rss: number;
    heapTotal: number;
    heapUsed: number;
    external: number;
  };
  uptime: number;
  database: {
    status: string;
    latency: number;
  };
  performance: {
    requests: number;
    errors: number;
    avgResponseTime: number;
  };
}

export default function MonitoringPage() {
  const [metrics, setMetrics] = useState<MetricsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchMetrics = async () => {
    try {
      const response = await fetch('/api/health');
      const data = await response.json();

      if (response.ok) {
        setMetrics(data);
      } else {
        setError(data.error || 'Failed to fetch metrics');
      }
    } catch (err) {
      setError('Network error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMetrics();
    const interval = setInterval(fetchMetrics, 30000); // Refresh every 30 seconds

    return () => clearInterval(interval);
  }, []);

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatUptime = (seconds: number) => {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${days}d ${hours}h ${minutes}m`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg text-gray-600">Loading metrics...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg text-red-600">Error: {error}</div>
      </div>
    );
  }

  if (!metrics) {
    return null;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">System Monitoring</h1>
        <button
          onClick={fetchMetrics}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          Refresh
        </button>
      </div>

      {/* Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card title="System Status">
          <div className="flex items-center space-x-2">
            <div className={`w-3 h-3 rounded-full ${
              metrics.database.status === 'up' ? 'bg-green-500' : 'bg-red-500'
            }`} />
            <span className="text-sm">
              {metrics.database.status === 'up' ? 'Healthy' : 'Degraded'}
            </span>
          </div>
        </Card>

        <Card title="Uptime">
          <div className="text-sm">{formatUptime(metrics.uptime)}</div>
        </Card>

        <Card title="Database Latency">
          <div className="text-sm">
            {metrics.database.latency}ms
            {metrics.database.latency > 200 && (
              <span className="text-red-500 ml-2">Slow</span>
            )}
          </div>
        </Card>

        <Card title="Memory Usage">
          <div className="text-sm">
            <div>Used: {formatBytes(metrics.memory.heapUsed)}</div>
            <div>Total: {formatBytes(metrics.memory.heapTotal)}</div>
          </div>
        </Card>
      </div>

      {/* Memory Chart */}
      <Card title="Memory Usage">
        <LineChart
          data={[
            { timestamp: new Date().toISOString(), used: metrics.memory.heapUsed, total: metrics.memory.heapTotal }
          ]}
          xKey="timestamp"
          yKey="used"
          title="Memory Usage (MB)"
        />
      </Card>

      {/* Performance Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card title="Request Performance">
          <BarChart
            data={[
              { name: 'Requests', value: metrics.performance.requests },
              { name: 'Errors', value: metrics.performance.errors }
            ]}
            xKey="name"
            yKey="value"
          />
        </Card>

        <Card title="Response Times">
          <div className="space-y-2">
            <div className="flex justify-between">
              <span>Average Response Time:</span>
              <span>{metrics.performance.avgResponseTime}ms</span>
            </div>
            <div className="flex justify-between">
              <span>Database Latency:</span>
              <span>{metrics.database.latency}ms</span>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}