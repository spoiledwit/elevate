'use client'

import { useState, useEffect } from 'react'
import { CalendarView } from '@/components/dashboard/calendar/calendar-view'
import { PostList } from '@/components/dashboard/calendar/post-list'
import { CalendarFilters } from '@/components/dashboard/calendar/calendar-filters'
import { Calendar, Grid, List, Plus, Filter, Loader2, RefreshCw } from 'lucide-react'
import Link from 'next/link'
import { getPostsAction } from '@/actions'
import { toast } from 'sonner'

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

export default function CalendarPage() {
  const [viewMode, setViewMode] = useState<'calendar' | 'list'>('calendar')
  const [selectedDate, setSelectedDate] = useState<Date>(new Date())
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([])
  const [selectedStatus, setSelectedStatus] = useState<string[]>([])
  const [showFilters, setShowFilters] = useState(false)
  
  // Data state
  const [posts, setPosts] = useState<CalendarPost[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Load posts from backend
  const loadPosts = async () => {
      setLoading(true)
      setError(null)
      
      try {
        const result = await getPostsAction()
        
        if ('error' in result) {
          setError(result.error)
          toast.error('Failed to load posts')
          return
        }
        
        // Transform backend posts to calendar format
        // Handle both paginated and non-paginated responses
        const backendPosts = result.results || result || []
        
        const transformedPosts = Array.isArray(backendPosts) 
          ? backendPosts.map(transformBackendPost) 
          : []
        
        setPosts(transformedPosts)
        
      } catch (err) {
        console.error('Failed to load posts:', err)
        setError('Failed to load posts')
        toast.error('Failed to load posts')
      } finally {
        setLoading(false)
      }
    }

  // Load posts on component mount
  useEffect(() => {
    loadPosts()
  }, [])

  // Filter posts based on selected filters
  const filteredPosts = posts.filter(post => {
    const platformMatch = selectedPlatforms.length === 0 ||
      post.platforms.some(platform => selectedPlatforms.includes(platform))

    const statusMatch = selectedStatus.length === 0 ||
      selectedStatus.includes(post.status)

    return platformMatch && statusMatch
  })

  return (
    <div className="flex-1 bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Content Calendar</h1>
              <p className="text-sm text-gray-600 mt-1">
                Manage and schedule your social media content
              </p>
            </div>
            <div className="flex items-center gap-3">
              {/* View Toggle */}
              <div className="flex bg-gray-100 rounded-lg p-1">
                <button
                  onClick={() => setViewMode('calendar')}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded text-sm font-medium transition-colors ${viewMode === 'calendar'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                    }`}
                >
                  <Calendar className="w-4 h-4" />
                  Calendar
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded text-sm font-medium transition-colors ${viewMode === 'list'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                    }`}
                >
                  <List className="w-4 h-4" />
                  List
                </button>
              </div>

              <button
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center gap-2 px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <Filter className="w-4 h-4" />
                {showFilters ? 'Hide Filters' : 'Show Filters'}
              </button>

              <button
                onClick={() => loadPosts()}
                disabled={loading}
                className="flex items-center gap-2 px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </button>

              <Link
                href={"post-creator"}
                className="flex items-center gap-2 px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors">
                <Plus className="w-4 h-4" />
                Create Post
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex gap-6 overflow-hidden">
            {/* Sidebar - Filters */}
            <div className={`transition-all duration-500 ease-in-out overflow-hidden ${showFilters
              ? 'w-80 opacity-100'
              : 'w-0 opacity-0'
              }`}>
              <div className="w-80">
                <CalendarFilters
                  selectedPlatforms={selectedPlatforms}
                  selectedStatus={selectedStatus}
                  onPlatformChange={setSelectedPlatforms}
                  onStatusChange={setSelectedStatus}
                  totalPosts={posts.length}
                  filteredPosts={filteredPosts.length}
                />
              </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 transition-all duration-500 ease-in-out">
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="text-center">
                    <Loader2 className="w-8 h-8 text-purple-600 animate-spin mx-auto mb-4" />
                    <p className="text-gray-600">Loading posts...</p>
                  </div>
                </div>
              ) : error ? (
                <div className="flex items-center justify-center py-12">
                  <div className="text-center">
                    <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <svg className="w-8 h-8 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Failed to Load Posts</h3>
                    <p className="text-sm text-gray-500 mb-4">{error}</p>
                    <button
                      onClick={() => loadPosts()}
                      className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                    >
                      Try Again
                    </button>
                  </div>
                </div>
              ) : posts.length === 0 ? (
                <div className="flex items-center justify-center py-12">
                  <div className="text-center">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Calendar className="w-8 h-8 text-gray-400" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">No Posts Yet</h3>
                    <p className="text-sm text-gray-500 mb-6">
                      Create your first post to get started with your content calendar.
                    </p>
                    <Link
                      href="/post-creator"
                      className="inline-flex items-center gap-2 px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                    >
                      <Plus className="w-4 h-4" />
                      Create Your First Post
                    </Link>
                  </div>
                </div>
              ) : (
                <>
                  {viewMode === 'calendar' ? (
                    <CalendarView
                      posts={filteredPosts}
                      selectedDate={selectedDate}
                      onDateSelect={setSelectedDate}
                    />
                  ) : (
                    <PostList
                      posts={filteredPosts}
                    />
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}