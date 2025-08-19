'use client'

import { Facebook, Instagram, Linkedin, Youtube, Twitter, Calendar, Clock, Eye, Heart, MessageCircle, Send, Bookmark, ThumbsUp, Share2, MoreHorizontal } from 'lucide-react'
import { cn } from '@/lib/utils'

interface PostPreviewProps {
  content: string
  mediaFiles: File[]
  selectedPlatforms: string[]
  scheduledDate: Date | null
  isScheduled: boolean
}

const platformConfig = {
  facebook: {
    icon: Facebook,
    name: 'Facebook',
    color: 'bg-blue-600',
    maxChars: 63206
  },
  instagram: {
    icon: Instagram,
    name: 'Instagram',
    color: 'bg-gradient-to-br from-purple-600 to-pink-600',
    maxChars: 2200
  },
  linkedin: {
    icon: Linkedin,
    name: 'LinkedIn',
    color: 'bg-blue-700',
    maxChars: 3000
  },
  youtube: {
    icon: Youtube,
    name: 'YouTube',
    color: 'bg-red-600',
    maxChars: 5000
  },
  tiktok: {
    icon: Twitter, // Using Twitter as placeholder
    name: 'TikTok',
    color: 'bg-gray-900',
    maxChars: 2200
  }
}

export function PostPreview({ 
  content, 
  mediaFiles, 
  selectedPlatforms, 
  scheduledDate, 
  isScheduled 
}: PostPreviewProps) {
  
  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    }).format(date)
  }

  const truncateContent = (text: string, limit: number) => {
    if (text.length <= limit) return text
    return text.substring(0, limit - 3) + '...'
  }

  // Generate preview for Instagram style
  const InstagramPreview = () => (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-3 p-3 border-b border-gray-100">
        <div className="w-8 h-8 bg-gradient-to-br from-purple-400 to-purple-600 rounded-full"></div>
        <div className="flex-1">
          <p className="text-sm font-semibold">@elevatesocial</p>
        </div>
        <button className="text-gray-600">
          <MoreHorizontal className="w-5 h-5" />
        </button>
      </div>

      {/* Media */}
      {mediaFiles.length > 0 && (
        <div className="aspect-square bg-gray-100 relative">
          {mediaFiles[0] && mediaFiles[0].type.startsWith('image/') && (
            <img 
              src={URL.createObjectURL(mediaFiles[0])} 
              alt="Preview" 
              className="w-full h-full object-cover"
            />
          )}
          {mediaFiles.length > 1 && (
            <div className="absolute top-2 right-2 bg-black/60 text-white px-2 py-1 rounded text-xs">
              1/{mediaFiles.length}
            </div>
          )}
        </div>
      )}

      {/* Engagement */}
      <div className="p-3">
        <div className="flex items-center gap-4 mb-2">
          <button className="hover:opacity-70 transition-opacity">
            <Heart className="w-6 h-6" />
          </button>
          <button className="hover:opacity-70 transition-opacity">
            <MessageCircle className="w-6 h-6" />
          </button>
          <button className="hover:opacity-70 transition-opacity">
            <Send className="w-6 h-6" />
          </button>
          <div className="flex-1"></div>
          <button className="hover:opacity-70 transition-opacity">
            <Bookmark className="w-6 h-6" />
          </button>
        </div>

        {/* Caption */}
        {content && (
          <div className="text-sm">
            <span className="font-semibold mr-2">elevatesocial</span>
            <span>{truncateContent(content, 125)}</span>
            {content.length > 125 && (
              <button className="text-gray-500 ml-1">more</button>
            )}
          </div>
        )}
      </div>
    </div>
  )

  // Generate preview for Facebook style
  const FacebookPreview = () => (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-3 p-4">
        <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
          <Facebook className="w-6 h-6 text-white" />
        </div>
        <div className="flex-1">
          <p className="text-sm font-semibold">Elevate Social</p>
          <p className="text-xs text-gray-500">Just now · 🌐</p>
        </div>
      </div>

      {/* Content */}
      {content && (
        <div className="px-4 pb-3">
          <p className="text-sm text-gray-800">{truncateContent(content, 500)}</p>
        </div>
      )}

      {/* Media */}
      {mediaFiles.length > 0 && (
        <div className="bg-gray-100">
          {mediaFiles[0] && mediaFiles[0].type.startsWith('image/') && (
            <img 
              src={URL.createObjectURL(mediaFiles[0])} 
              alt="Preview" 
              className="w-full object-cover"
            />
          )}
        </div>
      )}

      {/* Engagement */}
      <div className="px-4 py-3 border-t border-gray-200 flex items-center justify-around text-gray-600">
        <button className="flex items-center gap-2 hover:bg-gray-100 px-3 py-1 rounded">
          <ThumbsUp className="w-5 h-5" />
          <span className="text-sm">Like</span>
        </button>
        <button className="flex items-center gap-2 hover:bg-gray-100 px-3 py-1 rounded">
          <MessageCircle className="w-5 h-5" />
          <span className="text-sm">Comment</span>
        </button>
        <button className="flex items-center gap-2 hover:bg-gray-100 px-3 py-1 rounded">
          <Share2 className="w-5 h-5" />
          <span className="text-sm">Share</span>
        </button>
      </div>
    </div>
  )

  return (
    <div className="space-y-6">
      {/* Preview Header */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-semibold text-gray-900">Preview</h3>
          <Eye className="w-5 h-5 text-gray-400" />
        </div>

        {/* Status Summary */}
        <div className="space-y-2">
          {/* Selected Platforms */}
          {selectedPlatforms.length > 0 && (
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">Platforms:</span>
              <div className="flex items-center gap-1">
                {selectedPlatforms.map(platformId => {
                  const platform = platformConfig[platformId as keyof typeof platformConfig]
                  if (!platform) return null
                  const Icon = platform.icon
                  return (
                    <div
                      key={platformId}
                      className={cn("w-6 h-6 rounded flex items-center justify-center", platform.color)}
                    >
                      <Icon className="w-4 h-4 text-white" />
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Schedule Info */}
          {isScheduled && scheduledDate && (
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Calendar className="w-4 h-4" />
              <span>{formatDate(scheduledDate)}</span>
            </div>
          )}

          {/* Media Count */}
          {mediaFiles.length > 0 && (
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <span>{mediaFiles.length} {mediaFiles.length === 1 ? 'file' : 'files'}</span>
            </div>
          )}
        </div>
      </div>

      {/* Platform Previews */}
      {selectedPlatforms.length > 0 && (content || mediaFiles.length > 0) && (
        <div className="space-y-4">
          {selectedPlatforms.includes('instagram') && (
            <div>
              <p className="text-sm font-medium text-gray-700 mb-2">Instagram Preview</p>
              <InstagramPreview />
            </div>
          )}
          
          {selectedPlatforms.includes('facebook') && (
            <div>
              <p className="text-sm font-medium text-gray-700 mb-2">Facebook Preview</p>
              <FacebookPreview />
            </div>
          )}
        </div>
      )}

      {/* Empty State */}
      {selectedPlatforms.length === 0 && (
        <div className="bg-gray-50 rounded-lg p-8 text-center">
          <Eye className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-sm text-gray-600">
            Select platforms and add content to see preview
          </p>
        </div>
      )}
    </div>
  )
}