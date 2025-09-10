'use client'

import { useState, useEffect } from 'react'
import { 
  X, 
  BarChart3, 
  MousePointerClick, 
  TrendingUp, 
  Calendar,
  ExternalLink,
  Users,
  Globe
} from 'lucide-react'
import { getCustomLinkAnalyticsAction } from '@/actions'

interface LinkAnalyticsProps {
  linkId: string
  onClose: () => void
}

export function LinkAnalytics({ linkId, onClose }: LinkAnalyticsProps) {
  const [analytics, setAnalytics] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [timeRange, setTimeRange] = useState('7d')

  useEffect(() => {
    loadAnalytics()
  }, [linkId, timeRange])

  const loadAnalytics = async () => {
    try {
      setIsLoading(true)
      const result = await getCustomLinkAnalyticsAction(linkId)
      
      if (result.success) {
        setAnalytics(result.data)
      } else {
        console.error('Error loading analytics:', result.error)
        setAnalytics(null)
      }
    } catch (error) {
      console.error('Error loading analytics:', error)
      setAnalytics(null)
    } finally {
      setIsLoading(false)
    }
  }

  const timeRangeOptions = [
    { value: '7d', label: 'Last 7 days' },
    { value: '30d', label: 'Last 30 days' },
    { value: '90d', label: 'Last 90 days' },
  ]

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
              <BarChart3 className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Product Analytics</h2>
              <p className="text-sm text-gray-600">Performance metrics for your product</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            {/* Time Range Selector */}
            <select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            >
              {timeRangeOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="p-6">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <div className="w-8 h-8 border-2 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-gray-600">Loading analytics...</p>
              </div>
            </div>
          ) : analytics ? (
            <div className="space-y-6">
              {/* Key Metrics */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-blue-50 rounded-xl p-6">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                      <MousePointerClick className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-blue-600">Total Clicks</p>
                      <p className="text-2xl font-bold text-blue-900">{analytics.total_clicks}</p>
                    </div>
                  </div>
                </div>

                <div className="bg-green-50 rounded-xl p-6">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                      <Users className="w-5 h-5 text-green-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-green-600">Unique Visitors</p>
                      <p className="text-2xl font-bold text-green-900">{analytics.unique_clicks}</p>
                    </div>
                  </div>
                </div>

                <div className="bg-purple-50 rounded-xl p-6">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                      <TrendingUp className="w-5 h-5 text-purple-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-purple-600">Click Rate</p>
                      <p className="text-2xl font-bold text-purple-900">{analytics.click_through_rate}%</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Daily Clicks Chart */}
              <div className="bg-white border border-gray-200 rounded-xl p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Daily Clicks</h3>
                <div className="h-64 flex items-end justify-between gap-2">
                  {analytics.daily_clicks.map((day: any, index: number) => {
                    const maxClicks = Math.max(...analytics.daily_clicks.map((d: any) => d.clicks))
                    const height = (day.clicks / maxClicks) * 200
                    return (
                      <div key={index} className="flex-1 flex flex-col items-center">
                        <div
                          className="w-full bg-purple-200 rounded-t-md hover:bg-purple-300 transition-colors cursor-pointer"
                          style={{ height: `${height}px`, minHeight: '4px' }}
                          title={`${day.clicks} clicks on ${day.date}`}
                        ></div>
                        <div className="mt-2 text-xs text-gray-500 text-center">
                          {new Date(day.date).toLocaleDateString('en-US', { 
                            month: 'short', 
                            day: 'numeric' 
                          })}
                        </div>
                        <div className="text-xs font-medium text-gray-700">
                          {day.clicks}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* Top Referrers */}
              <div className="bg-white border border-gray-200 rounded-xl p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Traffic Sources</h3>
                <div className="space-y-3">
                  {analytics.top_referrers.map((referrer: any, index: number) => {
                    const maxClicks = Math.max(...analytics.top_referrers.map((r: any) => r.clicks))
                    const percentage = (referrer.clicks / maxClicks) * 100
                    return (
                      <div key={index} className="flex items-center gap-4">
                        <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                          <Globe className="w-4 h-4 text-gray-600" />
                        </div>
                        <div className="flex-1">
                          <div className="flex justify-between items-center mb-1">
                            <span className="font-medium text-gray-900">{referrer.source}</span>
                            <span className="text-sm text-gray-600">{referrer.clicks} clicks</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-purple-500 h-2 rounded-full transition-all duration-300"
                              style={{ width: `${percentage}%` }}
                            ></div>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* Additional Insights */}
              <div className="bg-gray-50 border border-gray-200 rounded-xl p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Insights</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center gap-3">
                    <Calendar className="w-5 h-5 text-blue-600" />
                    <div>
                      <p className="font-medium text-gray-900">Peak Day</p>
                      <p className="text-sm text-gray-600">
                        {analytics.daily_clicks.reduce((prev: any, current: any) => 
                          prev.clicks > current.clicks ? prev : current
                        ).date}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <ExternalLink className="w-5 h-5 text-green-600" />
                    <div>
                      <p className="font-medium text-gray-900">Conversion</p>
                      <p className="text-sm text-gray-600">
                        {analytics.total_clicks > 0 ? ((analytics.unique_clicks / analytics.total_clicks) * 100).toFixed(1) : '0.0'}% unique visitors
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <BarChart3 className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Analytics Data</h3>
              <p className="text-gray-600">Analytics data will appear here once your product gets some clicks.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}