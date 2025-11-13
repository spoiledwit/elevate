'use server'

import { getApiClient } from '@/lib/api'
import { authOptions } from '@/lib/auth'
import type { profileFormSchema } from '@/lib/validation'
import { ApiError, type UserCurrentError } from '@frontend/types/api'
import { getServerSession } from 'next-auth'
import type { z } from 'zod'

export type ProfileFormSchema = z.infer<typeof profileFormSchema>

export async function profileAction(
  data: ProfileFormSchema
): Promise<boolean | UserCurrentError> {
  const session = await getServerSession(authOptions)

  try {
    const apiClient = await getApiClient(session)

    await apiClient.users.usersMePartialUpdate({
      username: data.username,
      first_name: data.firstName,
      last_name: data.lastName
    })

    return true
  } catch (error) {
    if (error instanceof ApiError) {
      return error.body as UserCurrentError
    }
  }

  return false
}

/**
 * Update email automation default preference for user profile
 */
export async function updateProfileEmailAutomationAction(
  enabled: boolean
) {
  const session = await getServerSession(authOptions)

  if (!session) {
    return { success: false, error: 'Authentication required' }
  }

  try {
    const apiClient = await getApiClient(session)
    const response = await apiClient.profiles.profilesUpdateEmailAutomationDefaultPartialUpdate({
      enabled
    })

    return { success: true, data: response }
  } catch (error) {
    console.error('Error updating profile email automation preference:', error)
    if (error instanceof ApiError) {
      return { success: false, error: error.message }
    }
    return { success: false, error: 'Failed to update email automation preference' }
  }
}
