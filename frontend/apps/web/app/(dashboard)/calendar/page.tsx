import { getPostsAction } from '@/actions'
import { CalendarManager } from '@/components/dashboard/calendar/CalendarManager'

// Types for calendar posts (matching the expected Post interface from calendar components)
interface CalendarPost {
  id: string
  content: string
  platforms: string[]
  scheduledFor: Date | null
  status: 'draft' | 'scheduled' | 'published' | 'failed'
  mediaCount: number
  author: string
  publishedAt?: Date
  error?: string
  metrics?: {
    likes: number
    comments: number
    shares: number
    reach: number
  }
  platform_name?: string
  platform_username?: string
  media_urls?: string[]
  created_at?: string
  sent_at?: string
}

// Transform backend post to calendar post format
const transformBackendPost = (backendPost: any): CalendarPost => {
  return {
    id: backendPost.id?.toString() || Math.random().toString(),
    content: backendPost.text || '',
    platforms: [backendPost.platform_name || 'unknown'],
    scheduledFor: backendPost.scheduled_at ? new Date(backendPost.scheduled_at) : null,
    status: mapBackendStatus(backendPost.status),
    mediaCount: Array.isArray(backendPost.media_urls) ? backendPost.media_urls.length : 0,
    author: backendPost.platform_username || 'User',
    metrics: undefined, // No metrics from backend yet
    publishedAt: backendPost.sent_at ? new Date(backendPost.sent_at) : undefined,
    error: backendPost.error_message || undefined,
    platform_name: backendPost.platform_name,
    platform_username: backendPost.platform_username,
    media_urls: backendPost.media_urls || [],
    created_at: backendPost.created_at,
    sent_at: backendPost.sent_at
  }
}

// Map backend status to calendar status
const mapBackendStatus = (backendStatus: string): CalendarPost['status'] => {
  switch (backendStatus) {
    case 'draft': return 'draft'
    case 'scheduled': return 'scheduled'
    case 'sending': return 'scheduled'  // Map 'sending' to 'scheduled' (in progress)
    case 'sent': return 'published'     // Map 'sent' to 'published' for calendar
    case 'failed': return 'failed'
    case 'cancelled': return 'failed'  // Map 'cancelled' to 'failed' (stopped/error state)
    default: return 'draft'
  }
}

export default async function CalendarPage() {
  // Load posts from backend on server
  let initialPosts: CalendarPost[] = []
  
  try {
    const result = await getPostsAction()
    
    if (!('error' in result)) {
      // Transform backend posts to calendar format
      // Handle both paginated and non-paginated responses
      const backendPosts = result.results || result || []
      
      initialPosts = Array.isArray(backendPosts) 
        ? backendPosts.map(transformBackendPost) 
        : []
    }
  } catch (err) {
    console.error('Failed to load posts:', err)
    // initialPosts remains empty array
  }

  return <CalendarManager initialPosts={initialPosts} />
}