'use client'

import { useState, useEffect } from 'react'
import { PostComposer } from '@/components/dashboard/post-creator/post-composer'
import { MediaUploader } from '@/components/dashboard/post-creator/media-uploader'
import { PlatformSelector } from '@/components/dashboard/post-creator/platform-selector'
import { PostScheduler } from '@/components/dashboard/post-creator/post-scheduler'
import { PostPreview } from '@/components/dashboard/post-creator/post-preview'
import { 
  getPlatformStatusAction,
  saveAsDraftAction,
  schedulePostAction,
  publishPostNowAction,
  type CreatePostData 
} from '@/actions'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'

interface PlatformConnection {
  id: number
  platform_username?: string
  platform_display_name?: string
  facebook_page_name?: string
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

export default function PostCreatorPage() {
  const router = useRouter()
  const [content, setContent] = useState('')
  const [selectedConnections, setSelectedConnections] = useState<number[]>([])
  const [mediaFiles, setMediaFiles] = useState<File[]>([])
  const [scheduledDate, setScheduledDate] = useState<Date | null>(null)
  const [isScheduled, setIsScheduled] = useState(false)
  const [platforms, setPlatforms] = useState<Platform[]>([])
  const [loading, setLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Load platform status on mount
  useEffect(() => {
    const loadPlatforms = async () => {
      try {
        const result = await getPlatformStatusAction()

        if (!('error' in result)) {
          setPlatforms(result.platforms)
        }
      } catch (error) {
        console.error('Failed to load platforms:', error)
      } finally {
        setLoading(false)
      }
    }

    loadPlatforms()
  }, [])

  // Helper function to prepare post data
  const preparePostData = (): CreatePostData => {
    // Convert File objects to URLs (in real app, you'd upload to storage first)
    const mediaUrls = mediaFiles.map(file => URL.createObjectURL(file))
    
    return {
      connection_ids: selectedConnections,
      text: content,
      media_urls: mediaUrls,
    }
  }

  // Handle save as draft
  const handleSaveAsDraft = async () => {
    if (!content || selectedConnections.length === 0) return

    setIsSubmitting(true)
    try {
      const postData = preparePostData()
      const result = await saveAsDraftAction(postData)
      
      if ('error' in result) {
        toast.error(`Failed to save draft: ${result.error}`)
        return
      }
      
      // Show success message and redirect
      toast.success('Post saved as draft successfully!')
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
      // Step 1: Create post as draft first
      const postData = preparePostData()
      const createResult = await saveAsDraftAction(postData)
      
      if ('error' in createResult) {
        toast.error(`Failed to create post: ${createResult.error}`)
        return
      }
      
      // Step 2: Immediately publish the created post
      const publishResult = await publishPostNowAction(createResult.id)
      
      if ('error' in publishResult) {
        toast.error(`Failed to publish post: ${publishResult.error}`)
        return
      }
      
      toast.success('Post published successfully!')
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
      const postData = preparePostData()
      const result = await schedulePostAction({
        ...postData,
        scheduled_at: scheduledDate.toISOString()
      })
      
      if ('error' in result) {
        toast.error(`Failed to schedule post: ${result.error}`)
        return
      }
      
      toast.success('Post scheduled successfully!')
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

  if (loading) {
    return (
      <div className="flex-1 bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-500">Loading platforms...</p>
        </div>
      </div>
    )
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