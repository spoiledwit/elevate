"use server"

import { getApiClient } from '@/lib/api'
import { authOptions } from '@/lib/auth'
import { ApiError } from '@frontend/types/api'
import { getServerSession } from 'next-auth'

export async function forgotPasswordAction(
  data: { username: string }
): Promise<boolean | any> {
  const session = await getServerSession(authOptions)

  try {
    const apiClient = await getApiClient(session)

    await apiClient.users.usersPasswordResetRequestCreate({
      username: data.username,
    })

    return true
  } catch (error) {
    console.log(error)
    if (error instanceof ApiError) {
      return error.body
    }
  }

  return false
}
