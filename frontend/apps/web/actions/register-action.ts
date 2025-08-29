'use server'

import { getApiClient } from '@/lib/api'
import type { registerFormSchema } from '@/lib/validation'
import { ApiError, type UserCreateError } from '@frontend/types/api'
import type { z } from 'zod'

export type RegisterFormSchema = z.infer<typeof registerFormSchema>

export async function registerAction(
  data: RegisterFormSchema,
  googleUserInfo?: {
    email: string;
    name: string;
    given_name: string;
    family_name: string;
    picture: string;
  }
): Promise<UserCreateError | { success: true; needsClientSignIn: true; credentials: { username: string; password: string } } | boolean> {
  try {
    const apiClient = await getApiClient()

    const user = await apiClient.users.usersCreate({
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
      // Include Google profile data if provided (OAuth users)
      google_profile_image: googleUserInfo?.picture || '',
      google_display_name: googleUserInfo?.name || `${googleUserInfo?.given_name || ''} ${googleUserInfo?.family_name || ''}`.trim(),
    })

    // Return credentials for client-side sign in
    return {
      success: true,
      needsClientSignIn: true,
      credentials: {
        username: data.username,
        password: data.password
      }
    }
  } catch (error) {
    if (error instanceof ApiError) {
      return error.body as UserCreateError
    }
  }

  return false
}
