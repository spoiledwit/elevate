'use server'

import { getApiClient } from '@/lib/api'
import { authOptions } from '@/lib/auth'
import { ApiError } from '@frontend/types/api'
import { getServerSession } from 'next-auth'

// Type definitions for upload actions
export interface UploadFileData {
  file: File
  resourceType?: 'image' | 'video' | 'raw' | 'auto'
  folder?: string
}

export interface UploadResponse {
  secure_url: string
  public_id: string
  resource_type: string
  format: string
  size: number
  width?: number
  height?: number
  duration?: number
  original_filename: string
}

export interface DeleteFileData {
  public_id: string
  resource_type?: 'image' | 'video' | 'raw'
}

/**
 * Upload a file to Cloudinary
 * @param data - Upload file data containing file and optional parameters
 * @returns Upload response with secure URL and metadata
 */
export async function uploadFileAction(data: UploadFileData): Promise<{ data?: UploadResponse; error?: string }> {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return { error: 'You must be logged in to upload files' }
    }

    const apiClient = await getApiClient(session)
    
    // Create form data object for the API client
    const uploadData: any = {
      file: data.file
    }
    
    if (data.resourceType) {
      uploadData.resource_type = data.resourceType
    }
    
    if (data.folder) {
      uploadData.folder = data.folder
    }

    const result = await apiClient.upload.uploadCreate(uploadData)
    
    return { 
      data: {
        secure_url: result.secure_url || '',
        public_id: result.public_id || '',
        resource_type: result.resource_type || '',
        format: result.format || '',
        size: result.size || 0,
        width: result.width,
        height: result.height,
        original_filename: data.file.name
      }
    }
  } catch (error) {
    console.error('Upload file error:', error)
    
    if (error instanceof ApiError) {
      return { error: error.body?.error || error.message || 'Failed to upload file' }
    }
    
    return { error: 'An unexpected error occurred during upload' }
  }
}

/**
 * Upload multiple files to Cloudinary
 * @param files - Array of upload file data
 * @returns Array of upload responses
 */
export async function uploadMultipleFilesAction(files: UploadFileData[]): Promise<{ data?: UploadResponse[]; error?: string }> {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return { error: 'You must be logged in to upload files' }
    }

    const uploadPromises = files.map(fileData => uploadFileAction(fileData))
    const results = await Promise.all(uploadPromises)
    
    // Check if any uploads failed
    const errors = results.filter(result => result.error).map(result => result.error)
    if (errors.length > 0) {
      return { error: `Some uploads failed: ${errors.join(', ')}` }
    }
    
    const uploadedFiles = results.map(result => result.data).filter(Boolean) as UploadResponse[]
    
    return { data: uploadedFiles }
  } catch (error) {
    console.error('Upload multiple files error:', error)
    return { error: 'An unexpected error occurred during batch upload' }
  }
}

/**
 * Delete a file from Cloudinary
 * @param data - Delete file data containing public_id and resource_type
 * @returns Success or error message
 */
export async function deleteFileAction(data: DeleteFileData): Promise<{ success?: boolean; error?: string }> {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return { error: 'You must be logged in to delete files' }
    }

    const apiClient = await getApiClient()
    
    // Note: The current UploadService doesn't properly handle the DELETE request body
    // This might need to be updated when the backend API is properly implemented
    await apiClient.upload.uploadDeleteDestroy()
    
    return { success: true }
  } catch (error) {
    console.error('Delete file error:', error)
    
    if (error instanceof ApiError) {
      return { error: error.body?.error || error.message || 'Failed to delete file' }
    }
    
    return { error: 'An unexpected error occurred during deletion' }
  }
}


/**
 * Upload an image file (convenience function)
 * @param file - Image file to upload
 * @param folder - Optional folder path
 * @returns Upload response
 */
export async function uploadImageAction(file: File, folder?: string): Promise<{ data?: UploadResponse; error?: string }> {
  return uploadFileAction({
    file,
    resourceType: 'image',
    folder
  })
}

/**
 * Upload a video file (convenience function)
 * @param file - Video file to upload
 * @param folder - Optional folder path
 * @returns Upload response
 */
export async function uploadVideoAction(file: File, folder?: string): Promise<{ data?: UploadResponse; error?: string }> {
  return uploadFileAction({
    file,
    resourceType: 'video',
    folder
  })
}

/**
 * Upload a document/raw file (convenience function)
 * @param file - Document file to upload
 * @param folder - Optional folder path
 * @returns Upload response
 */
export async function uploadDocumentAction(file: File, folder?: string): Promise<{ data?: UploadResponse; error?: string }> {
  return uploadFileAction({
    file,
    resourceType: 'raw',
    folder
  })
}

