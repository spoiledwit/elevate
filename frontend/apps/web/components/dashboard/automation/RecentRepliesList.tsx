'use client'

import {
  MessageSquare,
  CheckCircle,
  XCircle,
  Clock,
  ExternalLink,
  User,
  Calendar
} from 'lucide-react'

interface RecentRepliesListProps {
  replies: any[]
  loading: boolean
}

export function RecentRepliesList({ replies, loading }: RecentRepliesListProps) {
  if (loading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="animate-pulse">
            <div className="bg-gray-100 rounded-lg p-4">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 bg-gray-200 rounded-lg"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/4"></div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    )
  }

  if (!replies || replies.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <MessageSquare className="w-8 h-8 text-gray-400" />
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">No Replies Yet</h3>
        <p className="text-gray-600 max-w-sm mx-auto">
          Once your automation rules start replying to comments, they'll appear here.
        </p>
      </div>
    )
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'sent':
        return <CheckCircle className="w-5 h-5 text-green-600" />
      case 'failed':
        return <XCircle className="w-5 h-5 text-red-500" />
      case 'pending':
        return <Clock className="w-5 h-5 text-yellow-500" />
      default:
        return <Clock className="w-5 h-5 text-gray-400" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'sent':
        return 'bg-green-100 text-green-700'
      case 'failed':
        return 'bg-red-100 text-red-700'
      case 'pending':
        return 'bg-yellow-100 text-yellow-700'
      default:
        return 'bg-gray-100 text-gray-700'
    }
  }

  const formatDate = (dateStr: string) => {
    if (!dateStr) return 'Unknown date'
    
    try {
      const date = new Date(dateStr)
      if (isNaN(date.getTime())) return 'Invalid date'
      
      const now = new Date()
      const diff = now.getTime() - date.getTime()
      const minutes = Math.floor(diff / (1000 * 60))
      const hours = Math.floor(diff / (1000 * 60 * 60))
      const days = Math.floor(diff / (1000 * 60 * 60 * 24))

      if (minutes < 60) {
        return `${minutes}m ago`
      } else if (hours < 24) {
        return `${hours}h ago`
      } else if (days < 7) {
        return `${days}d ago`
      } else {
        return date.toLocaleDateString()
      }
    } catch (error) {
      return 'Invalid date'
    }
  }

  return (
    <div className="space-y-3">
      {replies.map((reply, index) => (
        <div key={reply.id || index} className="bg-gray-50 rounded-lg p-4 hover:bg-gray-100 transition-colors">
          <div className="flex items-start gap-4">
            {/* Status Icon */}
            <div className="flex-shrink-0 mt-1">
              {getStatusIcon(reply.status)}
            </div>

            {/* Reply Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-2">
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(reply.status)}`}>
                  {reply.status?.charAt(0).toUpperCase() + reply.status?.slice(1)}
                </span>
                <span className="text-sm text-gray-500">
                  {formatDate(reply.sent_at)}
                </span>
              </div>

              {/* Reply Message */}
              <div className="mb-3">
                <p className="text-sm text-gray-900 line-clamp-2">
                  {reply.reply_text || 'Reply message not available'}
                </p>
              </div>

              {/* Original Comment */}
              <div className="bg-white rounded-md p-3 mb-3">
                <div className="flex items-start gap-2">
                  <User className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm text-gray-600 line-clamp-2">
                      <strong>{reply.comment_from_user}:</strong> {reply.comment_message || 'Original comment not available'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Meta Information */}
              <div className="flex items-center gap-4 text-xs text-gray-500">
                <div className="flex items-center gap-1">
                  <MessageSquare className="w-3 h-3" />
                  <span>Page: {reply.page_name || 'Unknown'}</span>
                </div>
                {reply.rule_name && (
                  <div className="flex items-center gap-1">
                    <span>Rule: {reply.rule_name}</span>
                  </div>
                )}
              </div>

              {/* Error Message for Failed Replies */}
              {reply.status === 'failed' && reply.error_message && (
                <div className="mt-2 p-2 bg-red-50 rounded-md">
                  <p className="text-xs text-red-600">
                    Error: {reply.error_message}
                  </p>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex-shrink-0">
              {reply.comment?.facebook_comment_id && (
                <button
                  onClick={() => window.open(`https://facebook.com/${reply.comment.facebook_comment_id}`, '_blank')}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                  title="View on Facebook"
                >
                  <ExternalLink className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        </div>
      ))}

      {/* Load More - could be implemented later */}
      {replies.length >= 50 && (
        <div className="text-center pt-4">
          <button className="text-sm text-blue-600 hover:text-blue-700 font-medium">
            Load more replies
          </button>
        </div>
      )}
    </div>
  )
}