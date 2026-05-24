
import { testConnection } from '@/lib/queries/test'
import { EduQuestError } from '@/lib/errors'
import React, { ReactNode } from 'react'

interface TestResult {
  success: boolean
  message: string
  data?: unknown
  timestamp: string
}

export async function TestServerComponent() {
  let connectionResult: TestResult | null = null

  try {
    const connectionTest = await testConnection()
    connectionResult = {
      ...connectionTest,
      timestamp: new Date().toISOString(),
    }
  } catch (error) {
    if (error instanceof EduQuestError) {
      connectionResult = {
        success: false,
        message: error.message,
        timestamp: new Date().toISOString(),
      }
    } else {
      connectionResult = {
        success: false,
        message: 'Failed to connect to server',
        timestamp: new Date().toISOString(),
      }
    }
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">EduQuest - Server Connection Test</h1>

      <div className="border rounded-lg p-6">
        <h2 className="text-xl font-semibold mb-4">Server Connection Test</h2>
        {connectionResult ? (
          <div className={`p-4 rounded ${
            connectionResult.success ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
          }`}>
            <div className="flex items-center justify-between mb-2">
              <span className="font-medium">
                Status: {connectionResult.success ? '✅ SUCCESS' : '❌ FAILED'}
              </span>
              <span className="text-sm text-gray-600">
                {new Date(connectionResult.timestamp).toLocaleTimeString()}
              </span>
            </div>
            <p className="mb-2">{connectionResult.message}</p>
            {connectionResult.data != null && (
              <pre className="text-sm bg-gray-100 p-2 rounded mt-2 overflow-auto">
                {JSON.stringify(connectionResult.data, null, 2)}
              </pre>
            )}
          </div>
        ) : (
          <p className="text-gray-600">Running test...</p>
        )}
      </div>
    </div>
  )
}