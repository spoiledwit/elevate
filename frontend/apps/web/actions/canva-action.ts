'use server'

import { getApiClient } from '@/lib/api'
import { authOptions } from '@/lib/auth'
import { ApiError, PatchedCanvaDesign, Status780Enum } from '@frontend/types/api'
import { getServerSession } from 'next-auth'

// Type for updating a Canva design (more flexible than the generated type)
export type UpdateCanvaDesignData = {
  title?: string
  status?: Status780Enum | 'draft' | 'editing' | 'completed' | 'exported' | 'failed'
  thumbnail_url?: string
}

/**
 * Canva Integration Actions
 *
 * Handles full integration with Canva's visual editor:
 * - OAuth authentication
 * - Design creation
 * - Design export
 * - Connection status
 */

export interface CanvaAuthUrl {
  auth_url: string
}

export interface CanvaConnectionStatus {
  connected: boolean
}

export interface CanvaDesign {
  design_id: string
  edit_url: string
  message: string
}

export interface CanvaExport {
  export_url: string
  design_id: string
  message: string
}

export interface CanvaOAuthCallback {
  code: string
  state: string
  user_id: number
}

/**
 * Get Canva OAuth authorization URL
 */
export async function getCanvaAuthUrlAction(): Promise<CanvaAuthUrl | { error: string }> {
  const session = await getServerSession(authOptions)

  if (!session) {
    return { error: 'Authentication required' }
  }

  try {
    const apiClient = await getApiClient(session)
    const response = await apiClient.canva.canvaAuthRetrieve()

    return response as CanvaAuthUrl
  } catch (error) {
    console.error('Failed to get Canva auth URL:', error)
    if (error instanceof ApiError) {
      return { error: error.body?.error || 'Failed to get authorization URL' }
    }
    return { error: 'Failed to get authorization URL' }
  }
}

/**
 * Handle Canva OAuth callback
 */
export async function handleCanvaCallbackAction(
  data: CanvaOAuthCallback
): Promise<{ success: boolean; message?: string } | { error: string }> {
  const session = await getServerSession(authOptions)

  if (!session) {
    return { error: 'Authentication required' }
  }

  try {
    const apiClient = await getApiClient(session)
    const response = await apiClient.canva.canvaCallbackCreate({
      code: data.code,
      state: data.state,
      user_id: data.user_id
    })

    return response as { success: boolean; message?: string }
  } catch (error) {
    console.error('Failed to handle Canva callback:', error)
    if (error instanceof ApiError) {
      return { error: error.body?.error || 'Failed to complete authorization' }
    }
    return { error: 'Failed to complete authorization' }
  }
}

/**
 * Create a new design in Canva and get the edit URL
 */
export async function createCanvaDesignAction(
  designType?: string
): Promise<CanvaDesign | { error: string; needs_auth?: boolean }> {
  const session = await getServerSession(authOptions)

  if (!session) {
    return { error: 'Authentication required' }
  }

  try {
    const apiClient = await getApiClient(session)
    const response = await apiClient.canva.canvaCreateDesignCreate({
      design_type: designType || 'doc'
    })

    return response as CanvaDesign
  } catch (error) {
    console.error('Failed to create Canva design:', error)
    if (error instanceof ApiError) {
      if (error.status === 401) {
        return { error: 'Not authenticated with Canva', needs_auth: true }
      }
      return { error: error.body?.error || 'Failed to create design' }
    }
    return { error: 'Failed to create design' }
  }
}

/**
 * Export a Canva design and get the download URL
 */
export async function exportCanvaDesignAction(
  designId?: string
): Promise<CanvaExport | { error: string }> {
  const session = await getServerSession(authOptions)

  if (!session) {
    return { error: 'Authentication required' }
  }

  try {
    const apiClient = await getApiClient(session)
    const response = await apiClient.canva.canvaExportCreate({
      design_id: designId
    })

    return response as CanvaExport
  } catch (error) {
    console.error('Failed to export Canva design:', error)
    if (error instanceof ApiError) {
      return { error: error.body?.error || 'Failed to export design' }
    }
    return { error: 'Failed to export design' }
  }
}

/**
 * Check if user is connected to Canva
 */
export async function getCanvaConnectionStatusAction(): Promise<CanvaConnectionStatus | { error: string }> {
  const session = await getServerSession(authOptions)

  if (!session) {
    return { error: 'Authentication required' }
  }

  try {
    const apiClient = await getApiClient(session)
    const response = await apiClient.canva.canvaStatusRetrieve()

    return response as CanvaConnectionStatus
  } catch (error) {
    console.error('Failed to get Canva connection status:', error)
    if (error instanceof ApiError) {
      return { error: error.body?.error || 'Failed to get connection status' }
    }
    return { error: 'Failed to get connection status' }
  }
}

/**
 * Get list of all Canva designs for the user
 */
export async function getCanvaDesignsAction(): Promise<any[] | { error: string }> {
  const session = await getServerSession(authOptions)

  if (!session) {
    return { error: 'Authentication required' }
  }

  try {
    const apiClient = await getApiClient(session)
    const response = await apiClient.canva.canvaDesignsList()

    return response as any[]
  } catch (error) {
    console.error('Failed to get Canva designs:', error)
    if (error instanceof ApiError) {
      return { error: error.body?.error || 'Failed to get designs' }
    }
    return { error: 'Failed to get designs' }
  }
}

/**
 * Get details of a specific Canva design
 */
export async function getCanvaDesignDetailAction(
  designId: string
): Promise<any | { error: string }> {
  const session = await getServerSession(authOptions)

  if (!session) {
    return { error: 'Authentication required' }
  }

  try {
    const apiClient = await getApiClient(session)
    const response = await apiClient.canva.canvaDesignsRetrieve(designId)

    return response
  } catch (error) {
    console.error('Failed to get Canva design:', error)
    if (error instanceof ApiError) {
      return { error: error.body?.error || 'Failed to get design' }
    }
    return { error: 'Failed to get design' }
  }
}

/**
 * Update a Canva design (title, status, thumbnail)
 */
export async function updateCanvaDesignAction(
  designId: string,
  data: UpdateCanvaDesignData
): Promise<any | { error: string }> {
  const session = await getServerSession(authOptions)

  if (!session) {
    return { error: 'Authentication required' }
  }

  try {
    const apiClient = await getApiClient(session)
    // Cast to PatchedCanvaDesign since our UpdateCanvaDesignData is compatible
    const response = await apiClient.canva.canvaDesignsPartialUpdate(designId, data as PatchedCanvaDesign)

    return response
  } catch (error) {
    console.error('Failed to update Canva design:', error)
    if (error instanceof ApiError) {
      return { error: error.body?.error || 'Failed to update design' }
    }
    return { error: 'Failed to update design' }
  }
}

/**
 * Delete a Canva design from the database
 */
export async function deleteCanvaDesignAction(
  designId: string
): Promise<{ success: boolean; message?: string } | { error: string }> {
  const session = await getServerSession(authOptions)

  if (!session) {
    return { error: 'Authentication required' }
  }

  try {
    const apiClient = await getApiClient(session)
    await apiClient.canva.canvaDesignsDestroy(designId)

    return { success: true, message: 'Design deleted successfully' }
  } catch (error) {
    console.error('Failed to delete Canva design:', error)
    if (error instanceof ApiError) {
      return { error: error.body?.error || 'Failed to delete design' }
    }
    return { error: 'Failed to delete design' }
  }
}