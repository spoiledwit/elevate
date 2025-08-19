'use server'

import { getApiClient } from '@/lib/api'
import type { registerFormSchema } from '@/lib/validation'
import { ApiError, type UserCreateError } from '@frontend/types/api'
import type { z } from 'zod'

export type RegisterFormSchema = z.infer<typeof registerFormSchema>

export async function registerAction(
  data: RegisterFormSchema
): Promise<UserCreateError | boolean> {
  try {
    const apiClient = await getApiClient()

    await apiClient.users.usersCreate({
      username: data.username,
      email: data.email,
      password: data.password,
      password_retype: data.passwordRetype,
      // Include social media links if provided
      instagram: data.instagram || '',
      facebook: data.facebook || '',
      pinterest: data.pinterest || '',
      linkedin: data.linkedin || '',
      tiktok: data.tiktok || '',
      youtube: data.youtube || '',
      twitter: data.twitter || '',
      website: data.website || '',
    })

    return true
  } catch (error) {
    if (error instanceof ApiError) {
      return error.body as UserCreateError
    }
  }

  return false
}
