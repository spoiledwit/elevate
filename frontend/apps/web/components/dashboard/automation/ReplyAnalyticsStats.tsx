'use client'

import {
  MessageSquare,
  CheckCircle,
  XCircle,
  TrendingUp,
  Clock,
  Zap
} from 'lucide-react'

interface ReplyAnalyticsStatsProps {
  stats: {
    total_replies?: number
    successful_replies?: number
    failed_replies?: number
    success_rate?: number
    total_comments?: number
    replied_comments?: number
    reply_rate?: number
  }
}

export function ReplyAnalyticsStats({ stats }: ReplyAnalyticsStatsProps) {
  const totalReplies = stats.total_replies || 0
  const successfulReplies = stats.successful_replies || 0
  const failedReplies = totalReplies - successfulReplies
  const successRate = stats.success_rate || 0
  const replyRate = stats.reply_rate || 0

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* Total Replies */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600">Total Replies</p>
            <p className="text-2xl font-bold text-gray-900">{totalReplies}</p>
            <p className="text-xs text-gray-500 mt-1">
              All automated replies sent
            </p>
          </div>
          <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
            <MessageSquare className="w-6 h-6 text-blue-600" />
          </div>
        </div>
      </div>

      {/* Successful Replies */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600">Successful</p>
            <p className="text-2xl font-bold text-green-600">{successfulReplies}</p>
            <p className="text-xs text-gray-500 mt-1">
              {successRate.toFixed(1)}% success rate
            </p>
          </div>
          <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
            <CheckCircle className="w-6 h-6 text-green-600" />
          </div>
        </div>
      </div>

      {/* Failed Replies */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600">Failed</p>
            <p className="text-2xl font-bold text-red-500">{failedReplies}</p>
            <p className="text-xs text-gray-500 mt-1">
              {totalReplies > 0 ? ((failedReplies / totalReplies) * 100).toFixed(1) : 0}% failure rate
            </p>
          </div>
          <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
            <XCircle className="w-6 h-6 text-red-500" />
          </div>
        </div>
      </div>

      {/* Reply Rate */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600">Reply Rate</p>
            <p className="text-2xl font-bold text-purple-600">{replyRate.toFixed(1)}%</p>
            <p className="text-xs text-gray-500 mt-1">
              Comments with replies
            </p>
          </div>
          <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
            <TrendingUp className="w-6 h-6 text-purple-600" />
          </div>
        </div>
      </div>
    </div>
  )
}