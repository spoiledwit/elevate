'use server'

import { getApiClient } from '@/lib/api'
import { ApiError, type PaginatedPlanList } from '@frontend/types/api'

export async function getPlansAction(page?: number): Promise<PaginatedPlanList | null> {
  try {
    const apiClient = await getApiClient()

    const response = await apiClient.plans.plansList(page)

    return response
  } catch (error) {
    console.error('Failed to fetch plans:', error)
    if (error instanceof ApiError) {
      console.error('API Error:', error.body)
    }
    return null
  }
}