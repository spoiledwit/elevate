'use server'

import { getApiClient } from '@/lib/api'
import { authOptions } from '@/lib/auth'
import { 
  ApiError,
  type Folder,
  type PatchedMedia,
  type PatchedFolder,
  type BulkDelete
} from '@frontend/types/api'
import { getServerSession } from 'next-auth'

export interface MediaUploadData {
  image: File
  folder_id?: number
  file_name?: string
}

export interface FolderCreateData {
  name: string
  description?: string
}

export interface MediaUpdateData {
  folder?: number
  file_name?: string
}

export interface FolderUpdateData {
  name?: string
  description?: string
}

export interface BulkDeleteData {
  ids: number[]
}

export interface MoveMediaData {
  media_ids: number[]
  folder_id: number
}

/**
 * Get all media for the authenticated user
 */
export async function getMediaAction() {
  const session = await getServerSession(authOptions)

  if (!session) {
    return { error: 'Authentication required' }
  }

  try {
    const apiClient = await getApiClient(session)
    const response = await apiClient.media.mediaList()
    
    return response
  } catch (error) {
    console.error('Failed to get media:', error)
    if (error instanceof ApiError) {
      return { error: error.body?.error || 'Failed to fetch media' }
    }
    return { error: 'Failed to fetch media' }
  }
}

/**
 * Upload new media file
 */
export async function uploadMediaAction(formData: FormData) {
  const session = await getServerSession(authOptions)

  if (!session) {
    return { error: 'Authentication required' }
  }

  try {
    const response = await fetch(`${process.env.API_URL}/api/media/`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${session.accessToken}`,
      },
      body: formData,
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.detail || errorData.error || `HTTP ${response.status}: ${response.statusText}`)
    }

    const data = await response.json()
    return data
  } catch (error) {
    console.error('Failed to upload media:', error)
    return { error: error instanceof Error ? error.message : 'Failed to upload media' }
  }
}

/**
 * Get a specific media item by ID
 */
export async function getMediaItemAction(mediaId: number) {
  const session = await getServerSession(authOptions)

  if (!session) {
    return { error: 'Authentication required' }
  }

  try {
    const apiClient = await getApiClient(session)
    const response = await apiClient.media.mediaRetrieve(mediaId)
    
    return response
  } catch (error) {
    console.error('Failed to get media item:', error)
    if (error instanceof ApiError) {
      return { error: error.body?.error || 'Failed to fetch media item' }
    }
    return { error: 'Failed to fetch media item' }
  }
}

/**
 * Update an existing media item
 */
export async function updateMediaAction(mediaId: number, data: MediaUpdateData) {
  const session = await getServerSession(authOptions)

  if (!session) {
    return { error: 'Authentication required' }
  }

  try {
    const apiClient = await getApiClient(session)
    const response = await apiClient.media.mediaPartialUpdate(mediaId, data as PatchedMedia)
    
    return response
  } catch (error) {
    console.error('Failed to update media:', error)
    if (error instanceof ApiError) {
      return { error: error.body?.error || 'Failed to update media' }
    }
    return { error: 'Failed to update media' }
  }
}

/**
 * Delete a media item
 */
export async function deleteMediaAction(mediaId: number) {
  const session = await getServerSession(authOptions)

  if (!session) {
    return { error: 'Authentication required' }
  }

  try {
    const apiClient = await getApiClient(session)
    await apiClient.media.mediaDestroy(mediaId)
    
    return { success: true, message: 'Media deleted successfully' }
  } catch (error) {
    console.error('Failed to delete media:', error)
    if (error instanceof ApiError) {
      return { error: error.body?.error || 'Failed to delete media' }
    }
    return { error: 'Failed to delete media' }
  }
}

/**
 * Bulk delete media items
 */
export async function bulkDeleteMediaAction(data: BulkDeleteData) {
  const session = await getServerSession(authOptions)

  if (!session) {
    return { error: 'Authentication required' }
  }

  try {
    const apiClient = await getApiClient(session)
    const response = await apiClient.media.mediaBulkDeleteCreate(data as BulkDelete)
    
    return response
  } catch (error) {
    console.error('Failed to bulk delete media:', error)
    if (error instanceof ApiError) {
      return { error: error.body?.error || 'Failed to bulk delete media' }
    }
    return { error: 'Failed to bulk delete media' }
  }
}

/**
 * Move media files to a different folder
 */
export async function moveMediaToFolderAction(data: MoveMediaData) {
  const session = await getServerSession(authOptions)

  if (!session) {
    return { error: 'Authentication required' }
  }

  try {
    const apiClient = await getApiClient(session)
    const response = await apiClient.media.mediaMoveCreate(data)
    
    return response
  } catch (error) {
    console.error('Failed to move media:', error)
    if (error instanceof ApiError) {
      return { error: error.body?.error || 'Failed to move media' }
    }
    return { error: 'Failed to move media' }
  }
}

/**
 * Get media statistics
 */
export async function getMediaStatsAction() {
  const session = await getServerSession(authOptions)

  if (!session) {
    return { error: 'Authentication required' }
  }

  try {
    const apiClient = await getApiClient(session)
    const response = await apiClient.media.mediaStatsRetrieve()
    
    return response
  } catch (error) {
    console.error('Failed to get media stats:', error)
    if (error instanceof ApiError) {
      return { error: error.body?.error || 'Failed to fetch media statistics' }
    }
    return { error: 'Failed to fetch media statistics' }
  }
}

/**
 * Get all folders for the authenticated user
 */
export async function getFoldersAction(page?: number) {
  const session = await getServerSession(authOptions)

  if (!session) {
    return { error: 'Authentication required' }
  }

  try {
    const apiClient = await getApiClient(session)
    const response = await apiClient.media.mediaFoldersList(page)
    
    return response
  } catch (error) {
    console.error('Failed to get folders:', error)
    if (error instanceof ApiError) {
      return { error: error.body?.error || 'Failed to fetch folders' }
    }
    return { error: 'Failed to fetch folders' }
  }
}

/**
 * Create a new folder
 */
export async function createFolderAction(data: FolderCreateData) {
  const session = await getServerSession(authOptions)

  if (!session) {
    return { error: 'Authentication required' }
  }

  try {
    const apiClient = await getApiClient(session)
    const response = await apiClient.media.mediaFoldersCreate({
      ...data,
      id: 0, // Required by type but will be set by server
      is_default: false,
      media_count: "0", // API expects string
      created_at: new Date().toISOString(),
      modified_at: new Date().toISOString(),
    } as Folder)
    
    return response
  } catch (error) {
    console.error('Failed to create folder:', error)
    if (error instanceof ApiError) {
      return { error: error.body?.error || 'Failed to create folder' }
    }
    return { error: 'Failed to create folder' }
  }
}

/**
 * Get a specific folder by ID
 */
export async function getFolderAction(folderId: number) {
  const session = await getServerSession(authOptions)

  if (!session) {
    return { error: 'Authentication required' }
  }

  try {
    const apiClient = await getApiClient(session)
    const response = await apiClient.media.mediaFoldersRetrieve(folderId)
    
    return response
  } catch (error) {
    console.error('Failed to get folder:', error)
    if (error instanceof ApiError) {
      return { error: error.body?.error || 'Failed to fetch folder' }
    }
    return { error: 'Failed to fetch folder' }
  }
}

/**
 * Update an existing folder
 */
export async function updateFolderAction(folderId: number, data: FolderUpdateData) {
  const session = await getServerSession(authOptions)

  if (!session) {
    return { error: 'Authentication required' }
  }

  try {
    const apiClient = await getApiClient(session)
    const response = await apiClient.media.mediaFoldersPartialUpdate(folderId, data as PatchedFolder)
    
    return response
  } catch (error) {
    console.error('Failed to update folder:', error)
    if (error instanceof ApiError) {
      return { error: error.body?.error || 'Failed to update folder' }
    }
    return { error: 'Failed to update folder' }
  }
}

/**
 * Delete a folder
 */
export async function deleteFolderAction(folderId: number) {
  const session = await getServerSession(authOptions)

  if (!session) {
    return { error: 'Authentication required' }
  }

  try {
    const apiClient = await getApiClient(session)
    await apiClient.media.mediaFoldersDestroy(folderId)
    
    return { success: true, message: 'Folder deleted successfully' }
  } catch (error) {
    console.error('Failed to delete folder:', error)
    if (error instanceof ApiError) {
      return { error: error.body?.error || 'Failed to delete folder' }
    }
    return { error: 'Failed to delete folder' }
  }
}

/**
 * Helper function to create FormData for media upload
 */
export async function createMediaFormData(file: File, folderId?: number, fileName?: string): Promise<FormData> {
  const formData = new FormData()
  formData.append('image', file)
  
  if (folderId) {
    formData.append('folder_id', folderId.toString())
  }
  
  if (fileName) {
    formData.append('file_name', fileName)
  }
  
  return formData
}