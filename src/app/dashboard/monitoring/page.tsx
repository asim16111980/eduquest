'use client'

import { useState, useEffect } from 'react'
import { Card } from '@/components/shared/Card'
import { DashboardSectionBoundary } from '@/components/shared/ErrorBoundary'

interface HealthStatus {
  status: 'healthy' | 'unhealthy'
  timestamp: string
  uptime: number
  memory: NodeJS.MemoryUsage
  database: 'up' | 'down'
  error?: string
  details?: string
}

export default function MonitoringPage() {
  const [healthStatus, setHealthStatus] = useState<HealthStatus | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [lastCheck, setLastCheck] = useState<Date | null>(null)

  const fetchHealthStatus = async () => {
    try {
      const response = await fetch('/api/health')
      const data = await response.json()
      setHealthStatus(data)
      setLastCheck(new Date())
    } catch (error) {
      console.error('Failed to fetch health status:', error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchHealthStatus()
    const interval = setInterval(fetchHealthStatus, 30000) // Check every 30 seconds
    return () => clearInterval(interval)
  }, [])

  const formatMemoryUsage = (usage: NodeJS.MemoryUsage) => {
    const mb = (value: number) => Math.round(value / 1024 / 1024)
    return `RSS: ${mb(usage.rss)}MB, Heap: ${mb(usage.heapUsed)}MB, Total: ${mb(usage.heapTotal)}MB`
  }

  const formatUptime = (seconds: number) => {
    const days = Math.floor(seconds / 86400)
    const hours = Math.floor((seconds % 86400) / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)

    if (days > 0) return `${days}d ${hours}h ${minutes}m`
    if (hours > 0) return `${hours}h ${minutes}m`
    return `${minutes}m`
  }

  return (
    <DashboardSectionBoundary title="System Monitoring" id="monitoring">
      <div className="container mx-auto py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">System Monitoring</h1>
        <p className="text-muted-foreground">
          Real-time monitoring of application health and performance
          {lastCheck && (
            <span className="ml-2 text-sm">
              Last checked: {lastCheck.toLocaleTimeString()}
            </span>
          )}
        </p>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <Card title="System Status">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span>Overall Status</span>
                <span className={`px-2 py-1 rounded text-xs ${
                  healthStatus?.status === 'healthy' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                }`}>
                  {healthStatus?.status}
                </span>
              </div>
              {healthStatus?.error && (
                <div className="text-red-600 text-sm">
                  Error: {healthStatus.error}
                </div>
              )}
              {healthStatus?.details && (
                <div className="text-red-600 text-sm">
                  Details: {healthStatus.details}
                </div>
              )}
            </div>
          </Card>

          <Card title="Performance Metrics">
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>Uptime</span>
                <span className="font-mono">
                  {healthStatus?.uptime ? formatUptime(healthStatus.uptime) : 'N/A'}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Memory Usage</span>
                <span className="font-mono">
                  {healthStatus?.memory ? formatMemoryUsage(healthStatus.memory) : 'N/A'}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Heap Used</span>
                <span className="font-mono">
                  {healthStatus?.memory ? `${Math.round(healthStatus.memory.heapUsed / 1024 / 1024)}MB` : 'N/A'}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Heap Total</span>
                <span className="font-mono">
                  {healthStatus?.memory ? `${Math.round(healthStatus.memory.heapTotal / 1024 / 1024)}MB` : 'N/A'}
                </span>
              </div>
            </div>
          </Card>

          <Card title="Database Status">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                {healthStatus?.database === 'up' ? (
                  <>
                    <div className="h-2 w-2 bg-green-500 rounded-full"></div>
                    <span className="text-green-600">Connected</span>
                  </>
                ) : (
                  <>
                    <div className="h-2 w-2 bg-red-500 rounded-full"></div>
                    <span className="text-red-600">Disconnected</span>
                  </>
                )}
              </div>
              {healthStatus?.status === 'unhealthy' && healthStatus.error && (
                <div className="text-sm text-red-600">
                  Error: {healthStatus.error}
                </div>
              )}
            </div>
          </Card>

          <Card title="Health Check Details" className="md:col-span-2 lg:col-span-3">
            <pre className="text-xs bg-muted p-3 rounded overflow-auto max-h-48">
              {JSON.stringify(healthStatus, null, 2)}
            </pre>
          </Card>
        </div>
      )}
    </div>
    </DashboardSectionBoundary>
  )
}