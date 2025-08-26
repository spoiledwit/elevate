'use server'

import { getApiClient } from '@/lib/api'
import { authOptions } from '@/lib/auth'
import { 
  ApiError, 
  type MetaAuthUrl,
  type MetaConnectionsList,
  type MetaPublishPost,
  type MetaPublishResponse,
  type MetaDisconnectResponse,
  type PinterestAuthUrl,
  type PinterestConnectionsList,
  type PinterestPublishPost,
  type PinterestPublishResponse,
  type PinterestDisconnectResponse,
  type LinkedInAuthUrl,
  type LinkedInConnectionsList,
  type LinkedInPublishPost,
  type LinkedInPublishResponse,
  type LinkedInDisconnectResponse
} from '@frontend/types/api'
import { getServerSession } from 'next-auth'

/**
 * Get Meta OAuth authorization URL for Facebook/Instagram
 */
export async function getMetaAuthUrlAction(): Promise<MetaAuthUrl | { error: string }> {
  const session = await getServerSession(authOptions)

  if (!session) {
    return { error: 'Authentication required' }
  }

  try {
    const apiClient = await getApiClient(session)
    const response = await apiClient.integrations.integrationsMetaAuthRetrieve()
    
    return response
  } catch (error) {
    console.error('Failed to get Meta auth URL:', error)
    if (error instanceof ApiError) {
      return { error: error.body?.error || 'Failed to get authorization URL' }
    }
    return { error: 'Failed to get authorization URL' }
  }
}

/**
 * Get all connected Meta accounts (Facebook/Instagram)
 */
export async function getMetaConnectionsAction(): Promise<MetaConnectionsList | { error: string }> {
  const session = await getServerSession(authOptions)

  if (!session) {
    return { error: 'Authentication required' }
  }

  try {
    const apiClient = await getApiClient(session)
    const response = await apiClient.integrations.integrationsMetaConnectionsRetrieve()
    
    return response
  } catch (error) {
    console.error('Failed to get Meta connections:', error)
    if (error instanceof ApiError) {
      return { error: error.body?.error || 'Failed to get connections' }
    }
    return { error: 'Failed to get connections' }
  }
}

/**
 * Publish content to Facebook or Instagram
 */
export async function publishMetaPostAction(
  data: MetaPublishPost
): Promise<MetaPublishResponse | { error: string }> {
  const session = await getServerSession(authOptions)

  if (!session) {
    return { error: 'Authentication required' }
  }

  try {
    const apiClient = await getApiClient(session)
    const response = await apiClient.integrations.integrationsMetaPublishCreate(data)
    
    return response
  } catch (error) {
    console.error('Failed to publish Meta post:', error)
    if (error instanceof ApiError) {
      return { error: error.body?.error || 'Failed to publish post' }
    }
    return { error: 'Failed to publish post' }
  }
}

/**
 * Disconnect a Meta account (Facebook/Instagram)
 */
export async function disconnectMetaAccountAction(
  connectionId: number
): Promise<MetaDisconnectResponse | { error: string }> {
  const session = await getServerSession(authOptions)

  if (!session) {
    return { error: 'Authentication required' }
  }

  try {
    const apiClient = await getApiClient(session)
    const response = await apiClient.integrations.integrationsMetaDisconnectDestroy(connectionId)
    
    return response
  } catch (error) {
    console.error('Failed to disconnect Meta account:', error)
    if (error instanceof ApiError) {
      return { error: error.body?.error || 'Failed to disconnect account' }
    }
    return { error: 'Failed to disconnect account' }
  }
}

/**
 * Get Pinterest OAuth authorization URL
 */
export async function getPinterestAuthUrlAction(): Promise<PinterestAuthUrl | { error: string }> {
  const session = await getServerSession(authOptions)

  if (!session) {
    return { error: 'Authentication required' }
  }

  try {
    const apiClient = await getApiClient(session)
    const response = await apiClient.integrations.integrationsPinterestAuthRetrieve()
    
    return response
  } catch (error) {
    console.error('Failed to get Pinterest auth URL:', error)
    if (error instanceof ApiError) {
      return { error: error.body?.error || 'Failed to get authorization URL' }
    }
    return { error: 'Failed to get authorization URL' }
  }
}

/**
 * Get all connected Pinterest accounts
 */
export async function getPinterestConnectionsAction(): Promise<PinterestConnectionsList | { error: string }> {
  const session = await getServerSession(authOptions)

  if (!session) {
    return { error: 'Authentication required' }
  }

  try {
    const apiClient = await getApiClient(session)
    const response = await apiClient.integrations.integrationsPinterestConnectionsRetrieve()
    
    return response
  } catch (error) {
    console.error('Failed to get Pinterest connections:', error)
    if (error instanceof ApiError) {
      return { error: error.body?.error || 'Failed to get connections' }
    }
    return { error: 'Failed to get connections' }
  }
}

/**
 * Create a pin on Pinterest
 */
export async function publishPinterestPostAction(
  data: PinterestPublishPost
): Promise<PinterestPublishResponse | { error: string }> {
  const session = await getServerSession(authOptions)

  if (!session) {
    return { error: 'Authentication required' }
  }

  try {
    const apiClient = await getApiClient(session)
    const response = await apiClient.integrations.integrationsPinterestPublishCreate(data)
    
    return response
  } catch (error) {
    console.error('Failed to publish Pinterest pin:', error)
    if (error instanceof ApiError) {
      return { error: error.body?.error || 'Failed to create pin' }
    }
    return { error: 'Failed to create pin' }
  }
}

/**
 * Disconnect a Pinterest account
 */
export async function disconnectPinterestAccountAction(
  connectionId: number
): Promise<PinterestDisconnectResponse | { error: string }> {
  const session = await getServerSession(authOptions)

  if (!session) {
    return { error: 'Authentication required' }
  }

  try {
    const apiClient = await getApiClient(session)
    const response = await apiClient.integrations.integrationsPinterestDisconnectDestroy(connectionId)
    
    return response
  } catch (error) {
    console.error('Failed to disconnect Pinterest account:', error)
    if (error instanceof ApiError) {
      return { error: error.body?.error || 'Failed to disconnect account' }
    }
    return { error: 'Failed to disconnect account' }
  }
}

/**
 * Get LinkedIn OAuth authorization URL
 */
export async function getLinkedInAuthUrlAction(): Promise<LinkedInAuthUrl | { error: string }> {
  const session = await getServerSession(authOptions)

  if (!session) {
    return { error: 'Authentication required' }
  }

  try {
    const apiClient = await getApiClient(session)
    const response = await apiClient.integrations.integrationsLinkedinAuthRetrieve()
    
    return response
  } catch (error) {
    console.error('Failed to get LinkedIn auth URL:', error)
    if (error instanceof ApiError) {
      return { error: error.body?.error || 'Failed to get authorization URL' }
    }
    return { error: 'Failed to get authorization URL' }
  }
}

/**
 * Get all connected LinkedIn accounts
 */
export async function getLinkedInConnectionsAction(): Promise<LinkedInConnectionsList | { error: string }> {
  const session = await getServerSession(authOptions)

  if (!session) {
    return { error: 'Authentication required' }
  }

  try {
    const apiClient = await getApiClient(session)
    const response = await apiClient.integrations.integrationsLinkedinConnectionsRetrieve()
    
    return response
  } catch (error) {
    console.error('Failed to get LinkedIn connections:', error)
    if (error instanceof ApiError) {
      return { error: error.body?.error || 'Failed to get connections' }
    }
    return { error: 'Failed to get connections' }
  }
}

/**
 * Create a post on LinkedIn personal profile
 */
export async function publishLinkedInPostAction(
  data: LinkedInPublishPost
): Promise<LinkedInPublishResponse | { error: string }> {
  const session = await getServerSession(authOptions)

  if (!session) {
    return { error: 'Authentication required' }
  }

  try {
    const apiClient = await getApiClient(session)
    const response = await apiClient.integrations.integrationsLinkedinPublishCreate(data)
    
    return response
  } catch (error) {
    console.error('Failed to publish LinkedIn post:', error)
    if (error instanceof ApiError) {
      return { error: error.body?.error || 'Failed to create post' }
    }
    return { error: 'Failed to create post' }
  }
}

/**
 * Disconnect a LinkedIn account
 */
export async function disconnectLinkedInAccountAction(
  connectionId: number
): Promise<LinkedInDisconnectResponse | { error: string }> {
  const session = await getServerSession(authOptions)

  if (!session) {
    return { error: 'Authentication required' }
  }

  try {
    const apiClient = await getApiClient(session)
    const response = await apiClient.integrations.integrationsLinkedinDisconnectDestroy(connectionId)
    
    return response
  } catch (error) {
    console.error('Failed to disconnect LinkedIn account:', error)
    if (error instanceof ApiError) {
      return { error: error.body?.error || 'Failed to disconnect account' }
    }
    return { error: 'Failed to disconnect account' }
  }
}

/**
 * Get platform connection status for all social media platforms
 */
export async function getPlatformStatusAction(): Promise<{
  platforms: Array<{
    name: string;
    display_name: string;
    connected: boolean;
    connection_count: number;
    connections: Array<any>;
  }>
} | { error: string }> {
  const session = await getServerSession(authOptions)

  if (!session) {
    return { error: 'Authentication required' }
  }

  try {
    const apiClient = await getApiClient(session)
    const response = await apiClient.integrations.integrationsPlatformsStatusRetrieve()
    return {
      platforms: response.platforms?.map(platform => ({
        name: platform.name || '',
        display_name: platform.display_name || '',
        connected: platform.connected || false,
        connection_count: platform.connection_count || 0,
        connections: platform.connections || []
      })) || []
    }
  } catch (error) {
    console.error('Failed to get platform status:', error)
    if (error instanceof ApiError) {
      return { error: error.body?.error || 'Failed to get platform status' }
    }
    return { error: 'Failed to get platform status' }
  }
}

// Type exports for convenience
export type { 
  MetaPublishPost, 
  MetaPublishResponse,
  PinterestPublishPost,
  PinterestPublishResponse,
  LinkedInPublishPost,
  LinkedInPublishResponse
} from '@frontend/types/api'