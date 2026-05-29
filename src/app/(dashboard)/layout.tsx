'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { signOut } from '@/app/(auth)/login/actions'

interface User {
  id: string
  email: string
  name: string
  role: string
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Get user from cookie or localStorage for demo
    const getUser = () => {
      try {
        const mockUserCookie = document.cookie
          .split('; ')
          .find(row => row.startsWith('mock-user='))
        if (mockUserCookie) {
          const userData = decodeURIComponent(mockUserCookie.split('=')[1])
          return JSON.parse(userData)
        }

        // Fallback for development
        if (process.env.NODE_ENV === 'development') {
          return {
            id: '1',
            email: 'admin@eduquest.com',
            name: 'Admin User',
            role: 'super_admin'
          }
        }
      } catch (error) {
        console.error('Error getting user:', error)
      }
      return null
    }

    setUser(getUser())
    setIsLoading(false)
  }, [])

  const handleSignOut = async () => {
    await signOut()
  }

  const getRoleDisplayName = (role: string) => {
    const roleMap: Record<string, string> = {
      super_admin: 'Super Admin',
      content_manager: 'Content Manager',
      teacher: 'Teacher',
      viewer: 'Viewer',
      student: 'Student'
    }
    return roleMap[role] || role
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex">
              <div className="flex-shrink-0 flex items-center">
                <h1 className="text-xl font-bold text-gray-900">EduQuest Admin Dashboard</h1>
              </div>
              <nav className="ml-6 flex space-x-8">
                <Link
                  href="/dashboard"
                  className="border-indigo-500 text-gray-900 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium"
                >
                  Overview
                </Link>
                <Link
                  href="/dashboard/users"
                  className="border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium"
                >
                  Users
                </Link>
                <Link
                  href="/dashboard/analytics"
                  className="border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium"
                >
                  Analytics
                </Link>
                <Link
                  href="/dashboard/settings"
                  className="border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium"
                >
                  Settings
                </Link>
              </nav>
            </div>
            <div className="flex items-center space-x-4">
              {isLoading ? (
                <span className="text-sm text-gray-500">Loading...</span>
              ) : user ? (
                <>
                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-gray-700">{user.name}</span>
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      {getRoleDisplayName(user.role)}
                    </span>
                  </div>
                  <button
                    onClick={handleSignOut}
                    className="text-sm text-gray-500 hover:text-gray-700 px-3 py-1 rounded-md hover:bg-gray-100"
                  >
                    Sign Out
                  </button>
                </>
              ) : (
                <span className="text-sm text-gray-500">Not authenticated</span>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {children}
      </main>
    </div>
  )
}