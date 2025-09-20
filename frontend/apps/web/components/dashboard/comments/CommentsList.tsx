'use client'

import { useState } from 'react'
import {
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  MessageCircle,
  User,
  Calendar,
  MoreHorizontal,
  Reply,
  ExternalLink
} from 'lucide-react'
import { CommentDetails } from './CommentDetails'

interface CommentsListProps {
  comments: any[]
  loading: boolean
  onRefresh: () => void
}

export function CommentsList({ comments, loading, onRefresh }: CommentsListProps) {
  const [selectedComment, setSelectedComment] = useState<any>(null)
  const [showDetails, setShowDetails] = useState(false)

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'new':
        return <Clock className="w-4 h-4 text-blue-500" />
      case 'replied':
        return <CheckCircle className="w-4 h-4 text-green-500" />
      case 'ignored':
        return <XCircle className="w-4 h-4 text-gray-500" />
      case 'error':
        return <AlertCircle className="w-4 h-4 text-red-500" />
      default:
        return <MessageCircle className="w-4 h-4 text-gray-400" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'new':
        return 'bg-blue-100 text-blue-800'
      case 'replied':
        return 'bg-green-100 text-green-800'
      case 'ignored':
        return 'bg-gray-100 text-gray-800'
      case 'error':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const handleCommentClick = (comment: any) => {
    setSelectedComment(comment)
    setShowDetails(true)
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="animate-pulse">
            <div className="flex items-start gap-4 p-4 border border-gray-200 rounded-lg">
              <div className="w-10 h-10 bg-gray-200 rounded-full"></div>
              <div className="flex-1">
                <div className="h-4 bg-gray-200 rounded w-1/4 mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              </div>
              <div className="w-16 h-6 bg-gray-200 rounded"></div>
            </div>
          </div>
        ))}
      </div>
    )
  }

  if (!comments || comments.length === 0) {
    return (
      <div className="text-center py-12">
        <MessageCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">No comments found</h3>
        <p className="text-gray-600 mb-4">
          Comments will appear here when people interact with your Facebook posts.
        </p>
        <button
          onClick={onRefresh}
          className="inline-flex items-center gap-2 px-4 py-2 text-white rounded-lg transition-colors" style={{ backgroundColor: '#714efe' }}
        >
          <MessageCircle className="w-4 h-4" />
          Check for new comments
        </button>
      </div>
    )
  }

  return (
    <>
      <div className="space-y-4">
        {comments.map((comment) => (
          <div
            key={comment.id}
            className="flex items-start gap-4 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
            onClick={() => handleCommentClick(comment)}
          >
            {/* User Avatar */}
            <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: 'linear-gradient(135deg, #714efe 0%, #5f3fd6 100%)' }}>
              <User className="w-5 h-5 text-white" />
            </div>

            {/* Comment Content */}
            <div className="flex-1 min-w-0">
              {/* Header */}
              <div className="flex items-center gap-2 mb-2">
                <h4 className="font-medium text-gray-900 truncate">
                  {comment.from_user_name}
                </h4>
                <span className="text-gray-400">•</span>
                <span className="text-sm text-gray-600">{comment.connection_name}</span>
                <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(comment.status)}`}>
                  {getStatusIcon(comment.status)}
                  {comment.status.charAt(0).toUpperCase() + comment.status.slice(1)}
                </span>
              </div>

              {/* Message */}
              <p className="text-gray-700 mb-2 line-clamp-2">
                {comment.message}
              </p>

              {/* Footer */}
              <div className="flex items-center gap-4 text-sm text-gray-500">
                <div className="flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  {formatDate(comment.created_time)}
                </div>
                {comment.replies_count > 0 && (
                  <div className="flex items-center gap-1">
                    <Reply className="w-3 h-3" />
                    {comment.replies_count} replies
                  </div>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2 flex-shrink-0">
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  // Handle view on Facebook
                }}
                className="p-1 hover:bg-gray-200 rounded transition-colors"
                title="View on Facebook"
              >
                <ExternalLink className="w-4 h-4 text-gray-400" />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  // Handle more actions
                }}
                className="p-1 hover:bg-gray-200 rounded transition-colors"
              >
                <MoreHorizontal className="w-4 h-4 text-gray-400" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Comment Details Modal */}
      {showDetails && selectedComment && (
        <CommentDetails
          comment={selectedComment}
          onClose={() => setShowDetails(false)}
          onRefresh={onRefresh}
        />
      )}
    </>
  )
}