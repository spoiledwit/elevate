'use server'

import { getApiClient } from '@/lib/api'
import { ApiError } from '@frontend/types/api'

export async function checkUsernameAction(username: string): Promise<{
  available: boolean
  username: string
} | null> {
  try {
    if (!username || username.length < 3) {
      return null
    }

    const apiClient = await getApiClient()
    
    //@ts-ignore
    const response = await apiClient.auth.authCheckUsernameCreate({
      username: username,
    })

    return {
      available: response.available,
      username: response.username
    }
  } catch (error) {
    if (error instanceof ApiError) {
      console.error('API Error checking username:', error.body)
    } else {
      console.error('Error checking username availability:', error)
    }
    return null
  }
}