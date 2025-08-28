'use client'

import {
  Settings2,
  ToggleRight,
  ToggleLeft,
  Clock,
  MessageCircle
} from 'lucide-react'

interface SettingsStatsProps {
  stats: {
    total: number
    enabled: number
    disabled: number
    avgDelay: number
    withDefaultReply: number
    dmEnabled?: number
    avgDmDelay?: number
  }
}

export function SettingsStats({ stats }: SettingsStatsProps) {
  const enabledPercentage = stats.total > 0 ? Math.round((stats.enabled / stats.total) * 100) : 0
  const dmEnabledPercentage = stats.total > 0 && stats.dmEnabled !== undefined ? Math.round((stats.dmEnabled / stats.total) * 100) : 0

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

      {/* Comment Automation Enabled */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600">Comments</p>
            <p className="text-2xl font-bold text-green-600">{stats.enabled}</p>
            <p className="text-xs text-gray-500 mt-1">
              {enabledPercentage}% enabled
            </p>
          </div>
          <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
            <ToggleRight className="w-6 h-6 text-green-600" />
          </div>
        </div>
      </div>

      {/* DM Automation Enabled */}
      {stats.dmEnabled !== undefined && (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">DMs</p>
              <p className="text-2xl font-bold text-blue-600">{stats.dmEnabled}</p>
              <p className="text-xs text-gray-500 mt-1">
                {dmEnabledPercentage}% enabled
              </p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <MessageCircle className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>
      )}

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

    </div>
  )
}