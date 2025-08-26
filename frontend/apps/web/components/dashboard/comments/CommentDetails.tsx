'use client'

import { useState } from 'react'
import {
  X,
  User,
  Calendar,
  MessageSquare,
  Reply,
  ExternalLink,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Send
} from 'lucide-react'
import { getCommentRepliesAction, replyToCommentAction } from '@/actions'

interface CommentDetailsProps {
  comment: any
  onClose: () => void
  onRefresh: () => void
}

export function CommentDetails({ comment, onClose, onRefresh }: CommentDetailsProps) {
  const [replies, setReplies] = useState<any[]>([])
  const [loadingReplies, setLoadingReplies] = useState(false)
  const [replyText, setReplyText] = useState('')
  const [sendingReply, setSendingReply] = useState(false)

  // Load replies when component mounts
  useState(() => {
    loadReplies()
  })

  const loadReplies = async () => {
    setLoadingReplies(true)
    try {
      const result = await getCommentRepliesAction(comment.id)
      if (!('error' in result)) {
        setReplies(result.replies || [])
      }
    } catch (error) {
      console.error('Error loading replies:', error)
    } finally {
      setLoadingReplies(false)
    }
  }

  const handleSendReply = async () => {
    if (!replyText.trim()) return
    
    setSendingReply(true)
    try {
      const result = await replyToCommentAction(comment.comment_id, replyText, comment.page_id)
      if (!('error' in result)) {
        setReplyText('')
        loadReplies()
        onRefresh()
      }
    } catch (error) {
      console.error('Error sending reply:', error)
    } finally {
      setSendingReply(false)
    }
  }

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
        return <MessageSquare className="w-4 h-4 text-gray-400" />
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

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <MessageSquare className="w-6 h-6 text-purple-600" />
            <h2 className="text-xl font-semibold text-gray-900">Comment Details</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 max-h-[calc(90vh-200px)] overflow-y-auto">
          {/* Original Comment */}
          <div className="mb-6">
            <div className="flex items-start gap-4 p-4 bg-gray-50 rounded-lg">
              <div className="w-10 h-10 bg-gradient-to-br from-purple-400 to-purple-600 rounded-full flex items-center justify-center flex-shrink-0">
                <User className="w-5 h-5 text-white" />
              </div>
              
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <h4 className="font-medium text-gray-900">{comment.from_user_name}</h4>
                  <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(comment.status)}`}>
                    {getStatusIcon(comment.status)}
                    {comment.status.charAt(0).toUpperCase() + comment.status.slice(1)}
                  </span>
                </div>
                
                <p className="text-gray-700 mb-3">{comment.message}</p>
                
                <div className="flex items-center gap-4 text-sm text-gray-500">
                  <div className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {formatDate(comment.created_time)}
                  </div>
                  <div className="flex items-center gap-1">
                    <MessageSquare className="w-3 h-3" />
                    {comment.connection_name}
                  </div>
                </div>
              </div>

              <button
                onClick={() => {
                  // Handle view on Facebook
                }}
                className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
                title="View on Facebook"
              >
                <ExternalLink className="w-4 h-4 text-gray-400" />
              </button>
            </div>
          </div>

          {/* Replies Section */}
          <div className="mb-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center gap-2">
              <Reply className="w-5 h-5" />
              Automated Replies ({replies.length})
            </h3>

            {loadingReplies ? (
              <div className="space-y-3">
                {[1, 2].map((i) => (
                  <div key={i} className="animate-pulse flex gap-3">
                    <div className="w-8 h-8 bg-gray-200 rounded-full"></div>
                    <div className="flex-1">
                      <div className="h-4 bg-gray-200 rounded w-1/4 mb-2"></div>
                      <div className="h-3 bg-gray-200 rounded w-3/4"></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : replies.length > 0 ? (
              <div className="space-y-4">
                {replies.map((reply: any, index: number) => (
                  <div key={index} className="flex gap-3 p-3 bg-green-50 rounded-lg border border-green-200">
                    <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0">
                      <CheckCircle className="w-4 h-4 text-white" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-medium text-gray-900">Automated Reply</span>
                        {reply.rule_name && (
                          <span className="text-xs text-green-600 bg-green-100 px-2 py-0.5 rounded-full">
                            Rule: {reply.rule_name}
                          </span>
                        )}
                      </div>
                      <p className="text-gray-700 text-sm mb-2">{reply.reply_text}</p>
                      <div className="flex items-center gap-2 text-xs text-gray-500">
                        <Calendar className="w-3 h-3" />
                        {formatDate(reply.sent_at)}
                        <span className={`px-2 py-0.5 rounded-full text-xs ${
                          reply.status === 'sent' 
                            ? 'bg-green-100 text-green-800'
                            : reply.status === 'failed'
                            ? 'bg-red-100 text-red-800' 
                            : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {reply.status}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6 text-gray-500">
                <Reply className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                <p>No automated replies sent yet</p>
              </div>
            )}
          </div>

          {/* Manual Reply */}
          <div className="border-t border-gray-200 pt-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Send Manual Reply</h3>
            <div className="flex gap-3">
              <textarea
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                placeholder="Write a reply to this comment..."
                rows={3}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
              />
              <button
                onClick={handleSendReply}
                disabled={!replyText.trim() || sendingReply}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 h-fit"
              >
                <Send className="w-4 h-4" />
                {sendingReply ? 'Sending...' : 'Send'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}