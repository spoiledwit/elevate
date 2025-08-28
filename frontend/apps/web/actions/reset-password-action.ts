"use server"

import { getApiClient } from '@/lib/api'
import { authOptions } from '@/lib/auth'
import { ApiError } from '@frontend/types/api'
import { getServerSession } from 'next-auth'

export async function resetPasswordAction(
  data: { uid: string; token: string; password: string; password_retype: string }
): Promise<boolean | any> {
  const session = await getServerSession(authOptions)

  try {
    const apiClient = await getApiClient(session)

    await apiClient.users.usersPasswordResetConfirmCreate({
      uid: data.uid,
      token: data.token,
      password: data.password,
      password_retype: data.password_retype,
    })

    return true
  } catch (error) {
    if (error instanceof ApiError) {
      return error.body
    }
  }

  return false
}
