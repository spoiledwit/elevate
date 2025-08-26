'use client'

import { useState, useEffect } from 'react'
import {
  MessageSquare,
  Filter,
  Search,
  RefreshCw,
  ExternalLink,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle
} from 'lucide-react'
import { CommentsList } from './CommentsList'
import { CommentsFilters } from './CommentsFilters'
import { CommentsStats } from './CommentsStats'
import { getCommentsAction } from '@/actions'

interface CommentsManagerProps {
  initialComments: any
  facebookPages: any
}

export function CommentsManager({ initialComments, facebookPages }: CommentsManagerProps) {
  const [comments, setComments] = useState(initialComments)
  const [loading, setLoading] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [connectionFilter, setConnectionFilter] = useState<string>('all')
  const [showFilters, setShowFilters] = useState(false)

  // Refresh comments
  const handleRefresh = async () => {
    setLoading(true)
    try {
      const filters = {
        connection_id: connectionFilter !== 'all' ? parseInt(connectionFilter) : undefined,
        status: statusFilter !== 'all' ? statusFilter as any : undefined
      }
      const result = await getCommentsAction(filters)
      if (!('error' in result)) {
        setComments(result)
      }
    } catch (error) {
      console.error('Error refreshing comments:', error)
    } finally {
      setLoading(false)
    }
  }

  // Apply filters
  const handleFiltersChange = async (filters: any) => {
    setConnectionFilter(filters.connection_id || 'all')
    setStatusFilter(filters.status || 'all')
    setLoading(true)

    try {
      const result = await getCommentsAction({
        connection_id: filters.connection_id || undefined,
        status: filters.status || undefined
      })
      if (!('error' in result)) {
        setComments(result)
      }
    } catch (error) {
      console.error('Error applying filters:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredComments = comments?.results?.filter((comment: any) => {
    if (searchQuery) {
      return comment.message.toLowerCase().includes(searchQuery.toLowerCase()) ||
        comment.from_user_name.toLowerCase().includes(searchQuery.toLowerCase())
    }
    return true
  }) || []

  const getStatusCount = (status: string) => {
    if (!comments?.results) return 0
    if (status === 'all') return comments.results.length
    return comments.results.filter((c: any) => c.status === status).length
  }

  return (
    <div className="flex-1 bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="px-6 py-6">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                  <MessageSquare className="w-7 h-7 text-purple-600" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">Comments</h1>
                  <p className="text-gray-600">
                    Manage Facebook comments and automated replies
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-lg font-medium transition-colors ${showFilters
                    ? 'bg-purple-100 text-purple-700'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                >
                  <Filter className="w-4 h-4" />
                  Filters
                </button>

                <button
                  onClick={handleRefresh}
                  disabled={loading}
                  className="inline-flex items-center gap-2 px-4 py-2.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium disabled:opacity-50"
                >
                  <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                  Refresh
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="p-6">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Stats Overview */}
          <CommentsStats
            totalComments={getStatusCount('all')}
            newComments={getStatusCount('new')}
            repliedComments={getStatusCount('replied')}
            ignoredComments={getStatusCount('ignored')}
          />

          {/* Filters */}
          {showFilters && (
            <CommentsFilters
              facebookPages={facebookPages}
              onFiltersChange={handleFiltersChange}
              currentFilters={{
                connection_id: connectionFilter,
                status: statusFilter
              }}
            />
          )}

          {/* Search */}
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search comments by message or user name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Comments List */}
          <div className="bg-white rounded-lg border border-gray-200">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-semibold text-gray-900">
                  Recent Comments ({filteredComments.length})
                </h2>

                {/* Quick Status Filters */}
                <div className="flex items-center gap-2">
                  {[
                    { key: 'all', label: 'All', icon: MessageSquare, color: 'gray' },
                    { key: 'new', label: 'New', icon: Clock, color: 'blue' },
                    { key: 'replied', label: 'Replied', icon: CheckCircle, color: 'green' },
                    { key: 'ignored', label: 'Ignored', icon: XCircle, color: 'gray' },
                    { key: 'error', label: 'Error', icon: AlertCircle, color: 'red' }
                  ].map((status) => (
                    <button
                      key={status.key}
                      onClick={() => handleFiltersChange({
                        connection_id: connectionFilter !== 'all' ? connectionFilter : undefined,
                        status: status.key !== 'all' ? status.key : undefined
                      })}
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${statusFilter === status.key
                        ? `bg-${status.color}-100 text-${status.color}-700`
                        : 'text-gray-600 hover:bg-gray-100'
                        }`}
                    >
                      <status.icon className="w-3.5 h-3.5" />
                      {status.label}
                      <span className={`text-xs px-1.5 py-0.5 rounded-full ${statusFilter === status.key
                        ? `bg-${status.color}-200 text-${status.color}-800`
                        : 'bg-gray-200 text-gray-600'
                        }`}>
                        {getStatusCount(status.key)}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              <CommentsList
                comments={filteredComments}
                loading={loading}
                onRefresh={handleRefresh}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}