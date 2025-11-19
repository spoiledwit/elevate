'use server'

import { getApiClient } from '@/lib/api'
import { authOptions } from '@/lib/auth'
import { ApiError } from '@frontend/types/api'
import { getServerSession } from 'next-auth'

// =============================================================================
// IFRAME MENU ITEMS ACTIONS
// =============================================================================

/**
 * Get all active iframe menu items
 * Requires authentication
 */
export async function getIframeMenuItemsAction(page?: number) {
  const session = await getServerSession(authOptions)

  if (!session) {
    return { error: 'Authentication required' }
  }

  try {
    const apiClient = await getApiClient(session)
    const response = await apiClient.system.iframeMenuItemsList(page)

    return response
  } catch (error) {
    console.error('Failed to get iframe menu items:', error)
    if (error instanceof ApiError) {
      return { error: error.body?.error || 'Failed to fetch iframe menu items' }
    }
    return { error: 'Failed to fetch iframe menu items' }
  }
}