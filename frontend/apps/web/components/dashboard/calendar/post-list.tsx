'use client'

import { useState } from 'react'
import { MoreHorizontal, Clock, CheckCircle, AlertCircle, FileText, Heart, MessageCircle, Share, Eye, Facebook, Instagram, Linkedin, Youtube, Twitter, Image, Video, Calendar, User } from 'lucide-react'
import { cn, formatDate, formatDateTime } from '@/lib/utils'

interface Post {
  id: string
  content: string
  platforms: string[]
  scheduledFor: Date | null
  status: 'published' | 'scheduled' | 'draft' | 'failed'
  mediaCount: number
  author: string
  publishedAt?: Date
  metrics?: {
    likes: number
    comments: number
    shares: number
    reach: number
  }
  error?: string
}

interface PostListProps {
  posts: Post[]
}

const statusConfig = {
  published: { 
    icon: CheckCircle, 
    color: 'text-green-600', 
    bg: 'bg-green-50', 
    border: 'border-green-200',
    label: 'Published'
  },
  scheduled: { 
    icon: Clock, 
    color: 'text-blue-600', 
    bg: 'bg-blue-50', 
    border: 'border-blue-200',
    label: 'Scheduled'
  },
  draft: { 
    icon: FileText, 
    color: 'text-gray-600', 
    bg: 'bg-gray-50', 
    border: 'border-gray-200',
    label: 'Draft'
  },
  failed: { 
    icon: AlertCircle, 
    color: 'text-red-600', 
    bg: 'bg-red-50', 
    border: 'border-red-200',
    label: 'Failed'
  }
}

const platformConfig = {
  facebook: { icon: Facebook, name: 'Facebook', color: 'text-blue-600' },
  instagram: { icon: Instagram, name: 'Instagram', color: 'text-pink-600' },
  linkedin: { icon: Linkedin, name: 'LinkedIn', color: 'text-blue-700' },
  youtube: { icon: Youtube, name: 'YouTube', color: 'text-red-600' },
  tiktok: { icon: Twitter, name: 'TikTok', color: 'text-gray-900' },
}

export function PostList({ posts }: PostListProps) {
  const [sortBy, setSortBy] = useState<'date' | 'status' | 'author'>('date')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')

  // Sort posts
  const sortedPosts = [...posts].sort((a, b) => {
    let comparison = 0
    
    switch (sortBy) {
      case 'date':
        const dateA = a.scheduledFor || a.publishedAt || new Date(0)
        const dateB = b.scheduledFor || b.publishedAt || new Date(0)
        comparison = dateA.getTime() - dateB.getTime()
        break
      case 'status':
        comparison = a.status.localeCompare(b.status)
        break
      case 'author':
        comparison = a.author.localeCompare(b.author)
        break
    }
    
    return sortOrder === 'desc' ? -comparison : comparison
  })

  const handleSort = (field: 'date' | 'status' | 'author') => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
    } else {
      setSortBy(field)
      setSortOrder('desc')
    }
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200">
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">All Posts</h2>
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500">Sort by:</span>
            <div className="flex items-center gap-1">
              <button
                onClick={() => handleSort('date')}
                className={cn(
                  "px-2 py-1 text-sm rounded transition-colors",
                  sortBy === 'date' 
                    ? "bg-purple-100 text-purple-700" 
                    : "text-gray-600 hover:bg-gray-100"
                )}
              >
                Date {sortBy === 'date' && (sortOrder === 'desc' ? '↓' : '↑')}
              </button>
              <button
                onClick={() => handleSort('status')}
                className={cn(
                  "px-2 py-1 text-sm rounded transition-colors",
                  sortBy === 'status' 
                    ? "bg-purple-100 text-purple-700" 
                    : "text-gray-600 hover:bg-gray-100"
                )}
              >
                Status {sortBy === 'status' && (sortOrder === 'desc' ? '↓' : '↑')}
              </button>
              <button
                onClick={() => handleSort('author')}
                className={cn(
                  "px-2 py-1 text-sm rounded transition-colors",
                  sortBy === 'author' 
                    ? "bg-purple-100 text-purple-700" 
                    : "text-gray-600 hover:bg-gray-100"
                )}
              >
                Author {sortBy === 'author' && (sortOrder === 'desc' ? '↓' : '↑')}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Posts List */}
      <div className="divide-y divide-gray-200">
        {sortedPosts.map((post) => {
          const config = statusConfig[post.status]
          const StatusIcon = config.icon

          return (
            <div key={post.id} className="p-4 hover:bg-gray-50 transition-colors">
              <div className="flex items-start gap-4">
                {/* Status Icon */}
                <div className={cn("p-2 rounded-lg", config.bg, config.border, "border")}>
                  <StatusIcon className={cn("w-4 h-4", config.color)} />
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  {/* Header */}
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className={cn("px-2 py-1 text-xs font-medium rounded", config.bg, config.color)}>
                        {config.label}
                      </span>
                      <span className="text-sm text-gray-500">by {post.author}</span>
                    </div>
                    <button className="text-gray-400 hover:text-gray-600">
                      <MoreHorizontal className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Post Content */}
                  <p className="text-gray-900 mb-3 line-clamp-3">
                    {post.content}
                  </p>

                  {/* Meta Information */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4 text-sm text-gray-500">
                      {/* Platforms */}
                      <div className="flex items-center gap-1">
                        {post.platforms.map(platformId => {
                          const platform = platformConfig[platformId as keyof typeof platformConfig]
                          if (!platform) return null
                          const PlatformIcon = platform.icon
                          return (
                            <span key={platformId} title={platform.name}>
                              <PlatformIcon 
                                className={cn("w-4 h-4", platform.color)} 
                              />
                            </span>
                          )
                        })}
                      </div>

                      {/* Media Count */}
                      {post.mediaCount > 0 && (
                        <div className="flex items-center gap-1">
                          <Image className="w-4 h-4" />
                          <span>{post.mediaCount}</span>
                        </div>
                      )}

                      {/* Date */}
                      <div className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        {post.status === 'published' && post.publishedAt ? (
                          <span>Published {formatDateTime(post.publishedAt)}</span>
                        ) : post.scheduledFor ? (
                          <span>Scheduled for {formatDateTime(post.scheduledFor)}</span>
                        ) : (
                          <span>No date set</span>
                        )}
                      </div>
                    </div>

                    {/* Metrics or Error */}
                    {post.status === 'published' && post.metrics && (
                      <div className="flex items-center gap-4 text-sm text-gray-500">
                        <div className="flex items-center gap-1">
                          <Heart className="w-4 h-4" />
                          <span>{post.metrics.likes}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <MessageCircle className="w-4 h-4" />
                          <span>{post.metrics.comments}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Share className="w-4 h-4" />
                          <span>{post.metrics.shares}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Eye className="w-4 h-4" />
                          <span>{post.metrics.reach}</span>
                        </div>
                      </div>
                    )}

                    {post.status === 'failed' && post.error && (
                      <div className="text-sm text-red-600 bg-red-50 px-2 py-1 rounded">
                        {post.error}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Empty State */}
      {posts.length === 0 && (
        <div className="p-8 text-center">
          <FileText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-600 mb-2">No posts found</p>
          <p className="text-sm text-gray-500">Try adjusting your filters or create a new post</p>
        </div>
      )}
    </div>
  )
}