'use client'

import { useState } from 'react'
import {
  BarChart3,
  RefreshCw,
  Filter,
  ChevronDown,
  TrendingUp,
  MessageSquare,
  Clock,
  CheckCircle
} from 'lucide-react'
import { ReplyAnalyticsStats } from './ReplyAnalyticsStats'
import { ReplyAnalyticsChart } from './ReplyAnalyticsChart'
import { ReplyAnalyticsFilters } from './ReplyAnalyticsFilters'
import { RecentRepliesList } from './RecentRepliesList'
import { getCommentRepliesListAction, getAutomationStatsAction } from '@/actions/comment-automation-action'

interface ReplyAnalyticsManagerProps {
  initialReplies: any
  initialStats: any
  facebookPages: any
}

export function ReplyAnalyticsManager({ initialReplies, initialStats, facebookPages }: ReplyAnalyticsManagerProps) {
  const [replies, setReplies] = useState(initialReplies)
  const [stats, setStats] = useState(initialStats)
  const [loading, setLoading] = useState(false)
  const [showFilters, setShowFilters] = useState(false)
  const [filters, setFilters] = useState({
    connection_id: undefined as number | undefined,
    status: undefined as 'pending' | 'sent' | 'failed' | undefined,
    date_range: '30' as string
  })

  // Refresh data
  const handleRefresh = async () => {
    setLoading(true)
    try {
      const [repliesResult, statsResult] = await Promise.all([
        getCommentRepliesListAction(filters),
        getAutomationStatsAction()
      ])

      if (!('error' in repliesResult)) {
        setReplies(repliesResult)
      }
      if (!('error' in statsResult)) {
        setStats(statsResult)
      }
    } catch (error) {
      console.error('Error refreshing analytics:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleFiltersChange = (newFilters: any) => {
    setFilters(newFilters)
    // Auto-refresh when filters change
    handleRefresh()
  }

  const repliesList = replies?.results || []
  const analyticsStats = stats?.stats || {}

  return (
    <div className="flex-1 bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="px-6 py-6">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                  <BarChart3 className="w-7 h-7 text-blue-600" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">Reply Analytics</h1>
                  <p className="text-gray-600">
                    Track and analyze your automated comment replies
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-lg transition-colors font-medium ${showFilters
                    ? 'bg-blue-100 text-blue-700 border border-blue-200'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                >
                  <Filter className="w-4 h-4" />
                  Filters
                  <ChevronDown className={`w-4 h-4 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
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
          {/* Filters */}
          {showFilters && (
            <ReplyAnalyticsFilters
              facebookPages={facebookPages}
              onFiltersChange={handleFiltersChange}
              currentFilters={filters}
            />
          )}

          {/* Stats Overview */}
          <ReplyAnalyticsStats stats={analyticsStats} />



          {/* Recent Replies */}
          <div className="bg-white rounded-lg border border-gray-200">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">
                    Recent Replies ({repliesList.length})
                  </h2>
                  <p className="text-sm text-gray-600 mt-1">
                    Latest automated replies sent to comments
                  </p>
                </div>
                <div className="flex items-center gap-4 text-sm">
                  <div className="flex items-center gap-2 text-green-600">
                    <CheckCircle className="w-4 h-4" />
                    <span>{repliesList.filter((r: any) => r.status === 'sent').length} Successful</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-500">
                    <Clock className="w-4 h-4" />
                    <span>{repliesList.filter((r: any) => r.status === 'pending').length} Pending</span>
                  </div>
                </div>
              </div>

              <RecentRepliesList
                replies={repliesList}
                loading={loading}
              />
            </div>
          </div>


        </div>
      </div>
    </div>
  )
}