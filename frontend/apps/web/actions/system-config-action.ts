'use server'

import { getApiClient } from '@/lib/api'
import { ApiError, type SystemConfig } from '@frontend/types/api'

export async function getSystemConfigAction(): Promise<SystemConfig | null> {
  try {
    const apiClient = await getApiClient()

    const response = await apiClient.systemConfig.systemConfigCurrentRetrieve()

    return response
  } catch (error) {
    console.error('Failed to fetch system config:', error)
    if (error instanceof ApiError) {
      console.error('API Error:', error.body)
    }
    return null
  }
}
