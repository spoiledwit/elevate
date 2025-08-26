'use client'

import {
  Settings2,
  ToggleRight,
  ToggleLeft,
  Clock
} from 'lucide-react'

interface SettingsStatsProps {
  stats: {
    total: number
    enabled: number
    disabled: number
    avgDelay: number
    withDefaultReply: number
  }
}

export function SettingsStats({ stats }: SettingsStatsProps) {
  const enabledPercentage = stats.total > 0 ? Math.round((stats.enabled / stats.total) * 100) : 0

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* Total Settings */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600">Total Pages</p>
            <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
            <p className="text-xs text-gray-500 mt-1">
              Configured for automation
            </p>
          </div>
          <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
            <Settings2 className="w-6 h-6 text-gray-600" />
          </div>
        </div>
      </div>

      {/* Enabled Settings */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600">Enabled</p>
            <p className="text-2xl font-bold text-green-600">{stats.enabled}</p>
            <p className="text-xs text-gray-500 mt-1">
              {enabledPercentage}% of total pages
            </p>
          </div>
          <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
            <ToggleRight className="w-6 h-6 text-green-600" />
          </div>
        </div>
      </div>

      {/* Disabled Settings */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600">Disabled</p>
            <p className="text-2xl font-bold text-gray-500">{stats.disabled}</p>
            <p className="text-xs text-gray-500 mt-1">
              Not currently active
            </p>
          </div>
          <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
            <ToggleLeft className="w-6 h-6 text-gray-500" />
          </div>
        </div>
      </div>

      {/* Average Delay */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600">Avg Delay</p>
            <p className="text-2xl font-bold text-purple-600">{stats.avgDelay}s</p>
            <p className="text-xs text-gray-500 mt-1">
              Average reply delay time
            </p>
          </div>
          <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
            <Clock className="w-6 h-6 text-purple-600" />
          </div>
        </div>
      </div>
    </div>
  )
}