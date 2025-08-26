'use client'

import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  Calendar
} from 'lucide-react'

interface ReplyAnalyticsChartProps {
  data: any[]
  dateRange: string
}

export function ReplyAnalyticsChart({ data, dateRange }: ReplyAnalyticsChartProps) {
  // Mock chart data - in a real app, you'd process the actual data
  const chartData = [
    { date: '2025-08-20', sent: 12, failed: 1 },
    { date: '2025-08-21', sent: 15, failed: 0 },
    { date: '2025-08-22', sent: 8, failed: 2 },
    { date: '2025-08-23', sent: 18, failed: 1 },
    { date: '2025-08-24', sent: 22, failed: 0 },
    { date: '2025-08-25', sent: 14, failed: 1 },
    { date: '2025-08-26', sent: 9, failed: 0 }
  ]

  const maxValue = Math.max(...chartData.map(d => d.sent + d.failed))
  const totalSent = chartData.reduce((sum, d) => sum + d.sent, 0)
  const totalFailed = chartData.reduce((sum, d) => sum + d.failed, 0)
  const successRate = totalSent / (totalSent + totalFailed) * 100

  const getDayLabel = (dateStr: string) => {
    const date = new Date(dateStr)
    return date.toLocaleDateString('en-US', { weekday: 'short' })
  }

  return (
    <div className="space-y-6">
      {/* Chart Summary */}
      <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
        <div className="grid grid-cols-3 gap-8">
          <div className="text-center">
            <p className="text-2xl font-bold text-green-600">{totalSent}</p>
            <p className="text-sm text-gray-600">Sent</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-red-500">{totalFailed}</p>
            <p className="text-sm text-gray-600">Failed</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-blue-600">{successRate.toFixed(1)}%</p>
            <p className="text-sm text-gray-600">Success Rate</p>
          </div>
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <Calendar className="w-4 h-4" />
          <span>Last {dateRange} days</span>
        </div>
      </div>

      {/* Bar Chart */}
      <div className="relative">
        <div className="flex items-end gap-3 h-64 px-4">
          {chartData.map((item, index) => {
            const totalHeight = ((item.sent + item.failed) / maxValue) * 200
            const sentHeight = (item.sent / maxValue) * 200
            const failedHeight = (item.failed / maxValue) * 200

            return (
              <div key={index} className="flex-1 flex flex-col items-center gap-2">
                {/* Bar */}
                <div className="w-full max-w-[40px] flex flex-col-reverse items-center">
                  <div 
                    className="w-full bg-green-500 rounded-t-md transition-all duration-300 hover:bg-green-600"
                    style={{ height: `${sentHeight}px` }}
                    title={`${item.sent} successful replies`}
                  />
                  {failedHeight > 0 && (
                    <div 
                      className="w-full bg-red-500 rounded-t-md transition-all duration-300 hover:bg-red-600"
                      style={{ height: `${failedHeight}px` }}
                      title={`${item.failed} failed replies`}
                    />
                  )}
                </div>
                
                {/* Date Label */}
                <span className="text-xs text-gray-500 font-medium">
                  {getDayLabel(item.date)}
                </span>
              </div>
            )
          })}
        </div>

        {/* Legend */}
        <div className="flex items-center justify-center gap-6 mt-4 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-green-500 rounded"></div>
            <span className="text-gray-600">Successful Replies</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-red-500 rounded"></div>
            <span className="text-gray-600">Failed Replies</span>
          </div>
        </div>
      </div>

      {/* Trend Indicators */}
      <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-200">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
            <TrendingUp className="w-4 h-4 text-green-600" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-900">Reply Volume</p>
            <p className="text-xs text-green-600">+23% vs last week</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
            <TrendingUp className="w-4 h-4 text-blue-600" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-900">Success Rate</p>
            <p className="text-xs text-blue-600">+5.2% vs last week</p>
          </div>
        </div>
      </div>
    </div>
  )
}