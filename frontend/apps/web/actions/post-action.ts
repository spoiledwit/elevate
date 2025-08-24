'use server'

import { getApiClient } from '@/lib/api'
import { authOptions } from '@/lib/auth'
import { 
  ApiError,
  type PatchedSocialMediaPost
} from '@frontend/types/api'
import { getServerSession } from 'next-auth'

export interface CreatePostData {
  connection_ids: number[]
  text: string
  media_files?: File[]
  status?: 'draft' | 'scheduled'
  scheduled_at?: string
}

export interface UpdatePostData {
  text?: string
  media_files?: File[]
  status?: 'draft' | 'scheduled' | 'cancelled'
  scheduled_at?: string
}

export interface BulkCreatePostData {
  connection_ids: number[]
  text: string
  media_files?: File[]
  status?: 'draft' | 'scheduled'
  scheduled_at?: string
}

export interface PostStatusUpdate {
  status: 'draft' | 'scheduled' | 'cancelled'
  scheduled_at?: string
}

/**
 * Helper function to create FormData for post creation
 */
export async function createPostFormData(data: CreatePostData): Promise<FormData> {
  const formData = new FormData()
  
  // Add connection IDs (as individual form fields to handle array properly)
  data.connection_ids.forEach((id) => {
    formData.append(`connection_ids`, id.toString())
  })
  
  // Add text content
  formData.append('text', data.text)
  
  // Add media files if present
  if (data.media_files && data.media_files.length > 0) {
    data.media_files.forEach((file) => {
      formData.append(`media_files_data`, file)
    })
  }
  
  // Add status if provided
  if (data.status) {
    formData.append('status', data.status)
  }
  
  // Add scheduled date if provided
  if (data.scheduled_at) {
    formData.append('scheduled_at', data.scheduled_at)
  }
  
  return formData
}

/**
 * Create a new social media post with media files support
 */
export async function createPostAction(data: CreatePostData) {
  const session = await getServerSession(authOptions)

  if (!session) {
    return { error: 'Authentication required' }
  }

  try {
    const formData = await createPostFormData(data)
    
    const response = await fetch(`${process.env.API_URL}/api/posts/`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${session.accessToken}`,
      },
      body: formData,
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.detail || errorData.error || 'Failed to create post')
    }

    const result = await response.json()
    return result
  } catch (error) {
    console.error('Failed to create post:', error)
    return { error: error instanceof Error ? error.message : 'Failed to create post' }
  }
}

/**
 * Get all posts for the authenticated user
 */
export async function getPostsAction(page?: number) {
  const session = await getServerSession(authOptions)

  if (!session) {
    return { error: 'Authentication required' }
  }

  try {
    const apiClient = await getApiClient(session)
    const response = await apiClient.posts.postsList(page)
    
    return response
  } catch (error) {
    console.error('Failed to get posts:', error)
    if (error instanceof ApiError) {
      return { error: error.body?.error || 'Failed to fetch posts' }
    }
    return { error: 'Failed to fetch posts' }
  }
}

/**
 * Get a specific post by ID
 */
export async function getPostAction(postId: number) {
  const session = await getServerSession(authOptions)

  if (!session) {
    return { error: 'Authentication required' }
  }

  try {
    const apiClient = await getApiClient(session)
    const response = await apiClient.posts.postsRetrieve(postId)
    
    return response
  } catch (error) {
    console.error('Failed to get post:', error)
    if (error instanceof ApiError) {
      return { error: error.body?.error || 'Failed to fetch post' }
    }
    return { error: 'Failed to fetch post' }
  }
}

/**
 * Update an existing post
 */
export async function updatePostAction(postId: number, data: UpdatePostData) {
  const session = await getServerSession(authOptions)

  if (!session) {
    return { error: 'Authentication required' }
  }

  try {
    const formData = new FormData()
    
    // Add text content if provided
    if (data.text !== undefined) {
      formData.append('text', data.text)
    }
    
    // Add media files if present
    if (data.media_files && data.media_files.length > 0) {
      data.media_files.forEach((file) => {
        formData.append('media_files_data', file)
      })
    }
    
    // Add status if provided
    if (data.status) {
      formData.append('status', data.status)
    }
    
    // Add scheduled date if provided
    if (data.scheduled_at !== undefined) {
      formData.append('scheduled_at', data.scheduled_at)
    }
    
    const response = await fetch(`${process.env.API_URL}/api/posts/${postId}/`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${session.accessToken}`,
      },
      body: formData,
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.detail || errorData.error || 'Failed to update post')
    }

    const result = await response.json()
    return result
  } catch (error) {
    console.error('Failed to update post:', error)
    return { error: error instanceof Error ? error.message : 'Failed to update post' }
  }
}

/**
 * Delete a post
 */
export async function deletePostAction(postId: number) {
  const session = await getServerSession(authOptions)

  if (!session) {
    return { error: 'Authentication required' }
  }

  try {
    const apiClient = await getApiClient(session)
    await apiClient.posts.postsDestroy(postId)
    
    return { success: true, message: 'Post deleted successfully' }
  } catch (error) {
    console.error('Failed to delete post:', error)
    if (error instanceof ApiError) {
      return { error: error.body?.error || 'Failed to delete post' }
    }
    return { error: 'Failed to delete post' }
  }
}

/**
 * Create posts for multiple connections at once
 */
export async function bulkCreatePostsAction(data: BulkCreatePostData) {
  const session = await getServerSession(authOptions)

  if (!session) {
    return { error: 'Authentication required' }
  }

  try {
    const formData = new FormData()
    
    // Add connection IDs
    data.connection_ids.forEach((id) => {
      formData.append('connection_ids', id.toString())
    })
    
    // Add text content
    formData.append('text', data.text)
    
    // Add media files if present  
    if (data.media_files && data.media_files.length > 0) {
      data.media_files.forEach((file) => {
        formData.append('media_files_data', file)
      })
    }
    
    // Add status if provided
    if (data.status) {
      formData.append('status', data.status)
    }
    
    // Add scheduled date if provided
    if (data.scheduled_at) {
      formData.append('scheduled_at', data.scheduled_at)
    }
    
    const response = await fetch(`${process.env.API_URL}/api/posts/bulk-create/`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${session.accessToken}`,
      },
      body: formData,
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.detail || errorData.error || 'Failed to create posts')
    }

    const result = await response.json()
    return result
  } catch (error) {
    console.error('Failed to bulk create posts:', error)
    return { error: error instanceof Error ? error.message : 'Failed to create posts' }
  }
}

/**
 * Update the status of a post
 */
export async function updatePostStatusAction(postId: number, _data: PostStatusUpdate) {
  const session = await getServerSession(authOptions)

  if (!session) {
    return { error: 'Authentication required' }
  }

  try {
    const apiClient = await getApiClient(session)
    const response = await apiClient.posts.postsStatusCreate(postId)
    
    return response
  } catch (error) {
    console.error('Failed to update post status:', error)
    if (error instanceof ApiError) {
      return { error: error.body?.error || 'Failed to update post status' }
    }
    return { error: 'Failed to update post status' }
  }
}

/**
 * Duplicate an existing post
 */
export async function duplicatePostAction(postId: number) {
  const session = await getServerSession(authOptions)

  if (!session) {
    return { error: 'Authentication required' }
  }

  try {
    const apiClient = await getApiClient(session)
    const response = await apiClient.posts.postsDuplicateCreate(postId)
    
    return response
  } catch (error) {
    console.error('Failed to duplicate post:', error)
    if (error instanceof ApiError) {
      return { error: error.body?.error || 'Failed to duplicate post' }
    }
    return { error: 'Failed to duplicate post' }
  }
}

/**
 * Publish a post immediately
 */
export async function publishPostNowAction(postId: number) {
  const session = await getServerSession(authOptions)

  if (!session) {
    return { error: 'Authentication required' }
  }

  try {
    const apiClient = await getApiClient(session)
    const response = await apiClient.posts.postsPublishCreate(postId)
    
    return response
  } catch (error) {
    console.error('Failed to publish post:', error)
    if (error instanceof ApiError) {
      return { error: error.body?.error || 'Failed to publish post' }
    }
    return { error: 'Failed to publish post' }
  }
}

/**
 * Get post statistics
 */
export async function getPostStatsAction() {
  const session = await getServerSession(authOptions)

  if (!session) {
    return { error: 'Authentication required' }
  }

  try {
    const apiClient = await getApiClient(session)
    const response = await apiClient.posts.postsStatsRetrieve()
    
    return response
  } catch (error) {
    console.error('Failed to get post stats:', error)
    if (error instanceof ApiError) {
      return { error: error.body?.error || 'Failed to fetch post statistics' }
    }
    return { error: 'Failed to fetch post statistics' }
  }
}

/**
 * Get scheduled posts for the next 30 days
 */
export async function getScheduledPostsAction() {
  const session = await getServerSession(authOptions)

  if (!session) {
    return { error: 'Authentication required' }
  }

  try {
    const apiClient = await getApiClient(session)
    const response = await apiClient.posts.postsScheduledRetrieve()
    
    return response
  } catch (error) {
    console.error('Failed to get scheduled posts:', error)
    if (error instanceof ApiError) {
      return { error: error.body?.error || 'Failed to fetch scheduled posts' }
    }
    return { error: 'Failed to fetch scheduled posts' }
  }
}

/**
 * Helper function to save post as draft
 */
export async function saveAsDraftAction(data: CreatePostData) {
  return createPostAction({
    ...data,
    status: 'draft'
  })
}

/**
 * Helper function to schedule post
 */
export async function schedulePostAction(data: CreatePostData & { scheduled_at: string }) {
  return createPostAction({
    ...data,
    status: 'scheduled'
  })
}