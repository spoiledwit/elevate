'use client'

import { useState, useEffect } from 'react'
import { PostComposer } from '@/components/dashboard/post-creator/post-composer'
import { MediaUploader } from '@/components/dashboard/post-creator/media-uploader'
import { PlatformSelector } from '@/components/dashboard/post-creator/platform-selector'
import { PostScheduler } from '@/components/dashboard/post-creator/post-scheduler'
import { PostPreview } from '@/components/dashboard/post-creator/post-preview'
import {
  saveAsDraftAction,
  schedulePostAction,
  publishPostNowAction,
  bulkCreatePostsAction,
  type CreatePostData
} from '@/actions'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'

interface PlatformConnection {
  id: number
  platform_username?: string
  platform_display_name?: string
  facebook_page_name?: string
  platform_profile_url?: string
  instagram_username?: string
  pinterest_user_id?: string
  is_verified?: boolean
}

interface Platform {
  name: string
  display_name: string
  connected: boolean
  connection_count: number
  connections: PlatformConnection[]
}

interface PostCreatorManagerProps {
  initialPlatforms: Platform[]
}

export function PostCreatorManager({ initialPlatforms }: PostCreatorManagerProps) {
  const router = useRouter()
  const [content, setContent] = useState('')
  const [selectedConnections, setSelectedConnections] = useState<number[]>([])
  const [mediaFiles, setMediaFiles] = useState<File[]>([])
  const [scheduledDate, setScheduledDate] = useState<Date | null>(null)
  const [isScheduled, setIsScheduled] = useState(false)
  const [platforms, setPlatforms] = useState<Platform[]>(initialPlatforms)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isLoadingMedia, setIsLoadingMedia] = useState(false)

  // Check for preloaded media from content library
  useEffect(() => {
    const mediaUrl = sessionStorage.getItem('preloadedMediaUrl')
    const mediaName = sessionStorage.getItem('preloadedMediaName')
    
    if (mediaUrl && mediaName) {
      // Clear the sessionStorage to prevent reloading on refresh
      sessionStorage.removeItem('preloadedMediaUrl')
      sessionStorage.removeItem('preloadedMediaName')
      
      // Show loading state
      setIsLoadingMedia(true)
      
      // Fetch the image and convert it to a File object
      fetch(mediaUrl)
        .then(response => response.blob())
        .then(blob => {
          // Create a File object from the blob
          const file = new File([blob], mediaName, { type: blob.type })
          // Add the file to the media files
          setMediaFiles([file])
          setIsLoadingMedia(false)
          toast.success('Media loaded from content library')
        })
        .catch(error => {
          console.error('Failed to load media from content library:', error)
          toast.error('Failed to load media from content library')
          setIsLoadingMedia(false)
        })
    }
  }, [])

  // Helper function to prepare post data
  const preparePostData = (): CreatePostData => {
    return {
      connection_ids: selectedConnections,
      text: content,
      media_files: mediaFiles,
    }
  }

  // Helper function to create posts (single or bulk based on connection count)
  const createPosts = async (postData: CreatePostData, status: 'draft' | 'scheduled') => {
    const dataWithStatus = { ...postData, status }

    // Use bulk creation if multiple connections, otherwise use single creation
    if (selectedConnections.length > 1) {
      return await bulkCreatePostsAction(dataWithStatus)
    } else {
      return status === 'draft'
        ? await saveAsDraftAction(dataWithStatus)
        : await schedulePostAction(dataWithStatus as CreatePostData & { scheduled_at: string })
    }
  }

  // Handle save as draft
  const handleSaveAsDraft = async () => {
    if (!content || selectedConnections.length === 0) return

    setIsSubmitting(true)
    try {
      const postData = preparePostData()
      const result = await createPosts(postData, 'draft')

      if ('error' in result) {
        toast.error(`Failed to save draft: ${result.error}`)
        return
      }

      // Show success message and redirect
      const message = selectedConnections.length > 1
        ? `${result.posts?.length || selectedConnections.length} posts saved as draft successfully!`
        : 'Post saved as draft successfully!'
      toast.success(message)
      router.push('/calendar')
    } catch (error) {
      console.error('Failed to save draft:', error)
      toast.error('Failed to save post as draft')
    } finally {
      setIsSubmitting(false)
    }
  }

  // Handle publish now
  const handlePublishNow = async () => {
    if (!content || selectedConnections.length === 0) return

    setIsSubmitting(true)
    try {
      const postData = preparePostData()

      if (selectedConnections.length > 1) {
        // For multiple connections, create drafts first then publish each one
        const createResult = await createPosts(postData, 'draft')

        if ('error' in createResult) {
          toast.error(`Failed to create posts: ${createResult.error}`)
          return
        }

        // Publish each created post (fire-and-forget)
        if (createResult.posts && Array.isArray(createResult.posts)) {
          // Queue all posts for background publishing without waiting
          createResult.posts.forEach((post: any) => {
            publishPostNowAction(post.id).catch(error =>
              console.error(`Background publish failed for post ${post.id}:`, error)
            )
          })

          toast.success(`${createResult.posts.length} posts queued for publishing!`)
        } else {
          toast.error('Unexpected response format from post creation')
          return
        }
      } else {
        // Single connection - use existing flow
        const createResult = await saveAsDraftAction(postData)

        if ('error' in createResult) {
          toast.error(`Failed to create post: ${createResult.error}`)
          return
        }

        const publishResult = await publishPostNowAction(createResult.id)

        if ('error' in publishResult) {
          toast.error(`Failed to publish post: ${publishResult.error}`)
          return
        }

        toast.success('Post published successfully!')
      }

      router.push('/calendar')
    } catch (error) {
      console.error('Failed to publish post:', error)
      toast.error('Failed to publish post')
    } finally {
      setIsSubmitting(false)
    }
  }

  // Handle schedule post
  const handleSchedulePost = async () => {
    if (!content || selectedConnections.length === 0 || !scheduledDate) return

    setIsSubmitting(true)
    try {
      const postData = {
        ...preparePostData(),
        scheduled_at: scheduledDate.toISOString()
      }

      const result = selectedConnections.length > 1
        ? await bulkCreatePostsAction({ ...postData, status: 'scheduled' } as any)
        : await schedulePostAction(postData)

      if ('error' in result) {
        toast.error(`Failed to schedule post: ${result.error}`)
        return
      }

      const message = selectedConnections.length > 1
        ? `${result.posts?.length || selectedConnections.length} posts scheduled successfully!`
        : 'Post scheduled successfully!'
      toast.success(message)
      router.push('/calendar')
    } catch (error) {
      console.error('Failed to schedule post:', error)
      toast.error('Failed to schedule post')
    } finally {
      setIsSubmitting(false)
    }
  }

  // Main action handler
  const handleMainAction = () => {
    if (isScheduled) {
      handleSchedulePost()
    } else {
      handlePublishNow()
    }
  }

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      {/* Fixed Header */}
      <div className="sticky top-0 z-10 bg-white border-b border-gray-200 shadow-sm">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Create Post</h1>
              <p className="text-sm text-gray-600 mt-1">
                Compose and publish content across multiple social media platforms
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={handleSaveAsDraft}
                disabled={!content || selectedConnections.length === 0 || isSubmitting}
                className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? 'Saving...' : 'Save as Draft'}
              </button>
              <button
                onClick={handleMainAction}
                disabled={!content || selectedConnections.length === 0 || isSubmitting || (isScheduled && !scheduledDate)}
                className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <div className="flex items-center gap-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    {isScheduled ? 'Scheduling...' : 'Publishing...'}
                  </div>
                ) : (
                  isScheduled ? 'Schedule Post' : 'Publish Now'
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-7xl mx-auto p-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Content Area */}
            <div className="lg:col-span-2 space-y-6">
              {/* Platform Selection */}
              <PlatformSelector
                platforms={platforms}
                selectedConnections={selectedConnections}
                onConnectionToggle={setSelectedConnections}
              />

              {/* Post Composer */}
              <PostComposer
                content={content}
                onContentChange={setContent}
                selectedPlatforms={platforms.filter(p =>
                  p.connections.some(c => selectedConnections.includes(c.id))
                ).map(p => p.name)}
              />

              {/* Media Uploader */}
              <MediaUploader
                mediaFiles={mediaFiles}
                onMediaChange={setMediaFiles}
                selectedPlatforms={platforms.filter(p =>
                  p.connections.some(c => selectedConnections.includes(c.id))
                ).map(p => p.name)}
                isLoadingMedia={isLoadingMedia}
              />

              {/* Scheduling */}
              <PostScheduler
                isScheduled={isScheduled}
                scheduledDate={scheduledDate}
                onScheduleToggle={setIsScheduled}
                onDateChange={setScheduledDate}
              />
            </div>

            {/* Sidebar - Sticky Preview */}
            <div className="lg:relative">
              <div className="lg:sticky lg:top-[25px] space-y-6">
                <PostPreview
                  content={content}
                  mediaFiles={mediaFiles}
                  selectedPlatforms={platforms.filter(p =>
                    p.connections.some(c => selectedConnections.includes(c.id))
                  ).map(p => p.name)}
                  selectedConnections={platforms.flatMap(p =>
                    p.connections.filter(c => selectedConnections.includes(c.id))
                  )}
                  scheduledDate={scheduledDate}
                  isScheduled={isScheduled}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}