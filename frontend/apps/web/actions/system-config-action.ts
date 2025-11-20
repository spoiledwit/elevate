'use server'

import { getApiClient } from '@/lib/api'
import { ApiError, type SystemConfig } from '@frontend/types/api'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function getSystemConfigAction(): Promise<SystemConfig | null> {
  try {
  const session = await getServerSession(authOptions);

    const apiClient = await getApiClient(session);

    const response = await apiClient.systemConfig.systemConfigCurrentRetrieve()
    console.log('Fetched system config:', response) // Debug log

    return response
  } catch (error) {
    console.error('Failed to fetch system config:', error)
    if (error instanceof ApiError) {
      console.error('API Error:', error.body)
    }
    return null
  }
}
