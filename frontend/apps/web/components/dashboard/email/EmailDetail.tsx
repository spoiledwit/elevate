'use client'

import { useState, useEffect } from 'react'
import {
  X,
  Star,
  Trash2,
  Reply,
  Forward,
  Archive,
  Mail,
  Paperclip,
  Download,
  ExternalLink,
  Loader2,
  ArrowLeft
} from 'lucide-react'
import { format } from 'date-fns'
import {
  getEmailMessageDetailAction,
  markEmailAsReadAction,
  deleteEmailAction,
  type EmailMessage
} from '@/actions/email-action'

interface EmailDetailProps {
  messageId: number
  onClose: () => void
  onRefresh: () => void
}

export function EmailDetail({ messageId, onClose, onRefresh }: EmailDetailProps) {
  const [message, setMessage] = useState<EmailMessage | null>(null)
  const [loading, setLoading] = useState(true)
  const [deleting, setDeleting] = useState(false)

  // Fetch email details
  useEffect(() => {
    const fetchMessage = async () => {
      setLoading(true)
      try {
        const result = await getEmailMessageDetailAction(messageId)
        if (!('error' in result)) {
          setMessage(result)

          // Mark as read if unread
          if (!result.is_read) {
            await markEmailAsReadAction(messageId, true)
            onRefresh()
          }
        }
      } catch (error) {
        console.error('Error fetching email:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchMessage()
  }, [messageId])

  // Toggle star
  const handleToggleStar = async () => {
    // This would need a backend endpoint for starring
    // For now, just refresh
    onRefresh()
  }

  // Delete email
  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this email?')) return

    setDeleting(true)
    try {
      const result = await deleteEmailAction(messageId)
      if (!('error' in result)) {
        onClose()
        onRefresh()
      }
    } catch (error) {
      console.error('Error deleting email:', error)
    } finally {
      setDeleting(false)
    }
  }

  if (loading) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-12">
        <div className="flex items-center justify-center">
          <Loader2 className="w-8 h-8 text-brand-600 animate-spin" />
        </div>
      </div>
    )
  }

  if (!message) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-12">
        <div className="text-center">
          <Mail className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Email not found</h3>
          <p className="text-gray-600">Unable to load this email</p>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 flex flex-col max-h-[800px]">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        <div className="flex items-center gap-3">
          <button
            onClick={handleToggleStar}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <Star
              className={`w-5 h-5 ${
                message.is_starred
                  ? 'text-yellow-500 fill-yellow-500'
                  : 'text-gray-400 hover:text-yellow-500'
              }`}
            />
          </button>

          <button
            onClick={handleDelete}
            disabled={deleting}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
          >
            <Trash2 className="w-5 h-5 text-gray-400 hover:text-red-500" />
          </button>

          <div className="w-px h-6 bg-gray-200"></div>

          <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <Reply className="w-5 h-5 text-gray-400" />
          </button>

          <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <Forward className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        <button
          onClick={onClose}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <X className="w-5 h-5 text-gray-400" />
        </button>
      </div>

      {/* Email Content */}
      <div className="flex-1 overflow-y-auto p-6">
        {/* Subject */}
        <h2 className="text-2xl font-bold text-gray-900 mb-4">
          {message.subject || '(No subject)'}
        </h2>

        {/* From/To Info */}
        <div className="space-y-3 mb-6 pb-6 border-b border-gray-200">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 bg-brand-100 rounded-full flex items-center justify-center flex-shrink-0">
              <span className="text-brand-700 font-semibold text-sm">
                {message.from_name?.charAt(0) || message.from_email?.charAt(0) || '?'}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <p className="font-semibold text-gray-900">
                  {message.from_name || message.from_email}
                </p>
                <span className="text-sm text-gray-500">
                  {'<'}
                  {message.from_email}
                  {'>'}
                </span>
              </div>
              <div className="text-sm text-gray-600">
                <span className="font-medium">To:</span>{' '}
                {Array.isArray(message.to_emails)
                  ? message.to_emails.join(', ')
                  : message.to_emails}
              </div>
              {message.cc_emails && Array.isArray(message.cc_emails) && message.cc_emails.length > 0 && (
                <div className="text-sm text-gray-600">
                  <span className="font-medium">CC:</span> {message.cc_emails.join(', ')}
                </div>
              )}
              <div className="text-xs text-gray-500 mt-1">
                {format(new Date(message.received_at!), 'PPpp')}
              </div>
            </div>
          </div>
        </div>

        {/* Attachments */}
        {message.has_attachments && message.attachments && message.attachments.length > 0 && (
          <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
            <div className="flex items-center gap-2 mb-3">
              <Paperclip className="w-4 h-4 text-gray-600" />
              <h3 className="font-semibold text-gray-900">
                Attachments ({message.attachments.length})
              </h3>
            </div>
            <div className="space-y-2">
              {message.attachments.map((attachment: any) => (
                <div
                  key={attachment.id}
                  className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-200"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-gray-100 rounded flex items-center justify-center">
                      <Paperclip className="w-4 h-4 text-gray-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">{attachment.filename}</p>
                      <p className="text-xs text-gray-500">
                        {attachment.content_type} • {(attachment.size / 1024).toFixed(1)} KB
                      </p>
                    </div>
                  </div>
                  {attachment.file_url && (
                    <a
                      href={attachment.file_url}
                      download
                      className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                      <Download className="w-4 h-4 text-gray-600" />
                    </a>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Email Body */}
        <div className="prose prose-sm max-w-none">
          {message.body_html ? (
            <div
              dangerouslySetInnerHTML={{ __html: message.body_html }}
              className="text-gray-800"
            />
          ) : (
            <div className="whitespace-pre-wrap text-gray-800">{message.body_text}</div>
          )}
        </div>

        {/* Labels */}
        {message.labels && Array.isArray(message.labels) && message.labels.length > 0 && (
          <div className="mt-6 pt-6 border-t border-gray-200">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm font-medium text-gray-600">Labels:</span>
              {message.labels.map((label: string) => (
                <span
                  key={label}
                  className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800"
                >
                  {label}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
