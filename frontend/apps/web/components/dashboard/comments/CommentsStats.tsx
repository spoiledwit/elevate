'use client'

import { 
  MessageSquare, 
  Clock, 
  CheckCircle, 
  XCircle,
  TrendingUp
} from 'lucide-react'

interface CommentsStatsProps {
  totalComments: number
  newComments: number
  repliedComments: number
  ignoredComments: number
}

export function CommentsStats({ 
  totalComments, 
  newComments, 
  repliedComments, 
  ignoredComments 
}: CommentsStatsProps) {
  const replyRate = totalComments > 0 ? (repliedComments / totalComments * 100) : 0

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center">
            <MessageSquare className="w-4 h-4 text-gray-600" />
          </div>
          <h3 className="text-sm font-medium text-gray-700">Total Comments</h3>
        </div>
        <div className="text-2xl font-bold text-gray-900">{totalComments}</div>
        <div className="text-xs text-gray-500 mt-1">All time</div>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
            <Clock className="w-4 h-4 text-blue-600" />
          </div>
          <h3 className="text-sm font-medium text-gray-700">New Comments</h3>
        </div>
        <div className="text-2xl font-bold text-gray-900">{newComments}</div>
        <div className="text-xs text-gray-500 mt-1">Pending automation</div>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
            <CheckCircle className="w-4 h-4 text-green-600" />
          </div>
          <h3 className="text-sm font-medium text-gray-700">Replied</h3>
        </div>
        <div className="text-2xl font-bold text-gray-900">{repliedComments}</div>
        <div className="text-xs text-gray-500 mt-1">Automated replies</div>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center">
            <XCircle className="w-4 h-4 text-gray-600" />
          </div>
          <h3 className="text-sm font-medium text-gray-700">Ignored</h3>
        </div>
        <div className="text-2xl font-bold text-gray-900">{ignoredComments}</div>
        <div className="text-xs text-gray-500 mt-1">No matching rules</div>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
            <TrendingUp className="w-4 h-4 text-purple-600" />
          </div>
          <h3 className="text-sm font-medium text-gray-700">Reply Rate</h3>
        </div>
        <div className="text-2xl font-bold text-gray-900">{replyRate.toFixed(1)}%</div>
        <div className="text-xs text-gray-500 mt-1">Automation success</div>
      </div>
    </div>
  )
}