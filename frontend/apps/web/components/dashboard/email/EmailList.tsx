'use client'

import { Mail, Star, Paperclip, Clock } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { EmailMessageList } from '@frontend/types/api'

interface EmailListProps {
  messages: EmailMessageList[]
  loading: boolean
  selectedMessageId: number | null
  onSelectMessage: (id: number) => void
  onRefresh: () => void
}

export function EmailList({
  messages,
  loading,
  selectedMessageId,
  onSelectMessage
}: EmailListProps) {
  if (loading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="animate-pulse">
            <div className="p-4 rounded-lg bg-gray-100">
              <div className="h-4 bg-gray-300 rounded w-3/4 mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-1/2"></div>
            </div>
          </div>
        ))}
      </div>
    )
  }

  if (!messages || messages.length === 0) {
    return (
      <div className="text-center py-12">
        <Mail className="w-12 h-12 text-gray-300 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">No emails found</h3>
        <p className="text-gray-600">
          Your inbox is empty or there are no emails matching your filters
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-2 max-h-[600px] overflow-y-auto">
      {messages.map((message) => (
        <button
          key={message.id}
          onClick={() => onSelectMessage(message.id!)}
          className={`w-full text-left p-4 rounded-lg border transition-colors ${selectedMessageId === message.id
            ? 'bg-purple-50 border-brand-300'
            : message.is_read
              ? 'bg-white border-gray-200 hover:bg-gray-50'
              : 'bg-blue-50 border-blue-200 hover:bg-blue-100'
            }`}
        >
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              {/* Sender */}
              <div className="flex items-center gap-2 mb-1">
                <p
                  className={`text-sm truncate ${message.is_read ? 'font-normal text-gray-900' : 'font-semibold text-gray-900'
                    }`}
                >
                  {message.from_name || message.from_email}
                </p>
                {message.is_starred && (
                  <Star className="w-4 h-4 text-yellow-500 fill-yellow-500 flex-shrink-0" />
                )}
                {message.has_attachments && (
                  <Paperclip className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                )}
              </div>

              {/* Subject */}
              <h4
                className={`text-sm mb-1 truncate ${message.is_read ? 'font-normal text-gray-700' : 'font-semibold text-gray-900'
                  }`}
              >
                {message.subject || '(No subject)'}
              </h4>

              {/* Snippet */}
              <p className="text-xs text-gray-600 line-clamp-2">{message.snippet}</p>
            </div>

            {/* Time */}
            <div className="flex items-center gap-1 text-xs text-gray-500 whitespace-nowrap">
              <Clock className="w-3 h-3" />
              {formatDistanceToNow(new Date(message.received_at!), { addSuffix: true })}
            </div>
          </div>

          {/* Unread indicator */}
          {!message.is_read && (
            <div className="absolute left-0 top-1/2 transform -translate-y-1/2 w-1 h-8 bg-brand-600 rounded-r-full"></div>
          )}
        </button>
      ))}
    </div>
  )
}
