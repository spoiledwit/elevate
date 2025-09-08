'use server'

import { getApiClient } from '@/lib/api'
import { authOptions } from '@/lib/auth'
import { ApiError, type UserCurrent } from '@frontend/types/api'
import { getServerSession } from 'next-auth'

/**
 * Get current user data including permissions
 */
export async function getCurrentUser(): Promise<{
  success: boolean
  user?: UserCurrent
  error?: string
}> {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.accessToken) {
      return {
        success: false,
        error: 'Not authenticated'
      }
    }

    const apiClient = await getApiClient(session)
    const user = await apiClient.auth.authMeRetrieve()

    return {
      success: true,
      user
    }
  } catch (error) {
    console.error('Failed to get current user:', error)
    
    if (error instanceof ApiError) {
      return {
        success: false,
        error: error.message || 'Failed to fetch user data'
      }
    }

    return {
      success: false,
      error: 'An unexpected error occurred'
    }
  }
}