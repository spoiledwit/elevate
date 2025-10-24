'use client'

import { CheckCircle, AlertTriangle, XCircle, Filter, Facebook, Instagram, Linkedin, Youtube, Twitter } from 'lucide-react'
import { cn } from '@/lib/utils'

interface AccountFiltersProps {
  filterStatus: string
  filterPlatform: string
  onStatusChange: (status: string) => void
  onPlatformChange: (platform: string) => void
  totalAccounts: number
  filteredAccounts: number
}

const statusOptions = [
  { id: 'all', name: 'All Accounts', icon: Filter, color: 'text-gray-600' },
  { id: 'connected', name: 'Connected', icon: CheckCircle, color: 'text-green-600' },
  { id: 'warning', name: 'Warning', icon: AlertTriangle, color: 'text-yellow-600' },
  { id: 'disconnected', name: 'Disconnected', icon: XCircle, color: 'text-red-600' }
]

const platformOptions = [
  { id: 'all', name: 'All Platforms', icon: Filter, color: 'text-gray-600' },
  { id: 'facebook', name: 'Facebook', icon: Facebook, color: 'text-blue-600' },
  { id: 'instagram', name: 'Instagram', icon: Instagram, color: 'text-pink-600' },
  { id: 'linkedin', name: 'LinkedIn', icon: Linkedin, color: 'text-blue-700' },
  { id: 'youtube', name: 'YouTube', icon: Youtube, color: 'text-red-600' },
  { id: 'tiktok', name: 'TikTok', icon: Twitter, color: 'text-gray-900' },
  { id: 'pinterest', name: 'Pinterest', icon: Twitter, color: 'text-red-500' },
  { id: 'twitter', name: 'Twitter/X', icon: Twitter, color: 'text-gray-900' }
]

export function AccountFilters({
  filterStatus,
  filterPlatform,
  onStatusChange,
  onPlatformChange,
  totalAccounts,
  filteredAccounts
}: AccountFiltersProps) {

  const clearAllFilters = () => {
    onStatusChange('all')
    onPlatformChange('all')
  }

  const hasActiveFilters = filterStatus !== 'all' || filterPlatform !== 'all'

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4 space-y-6 h-fit max-h-[calc(100vh-200px)] overflow-y-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Filter className="w-5 h-5 text-gray-400" />
          <h3 className="font-semibold text-gray-900">Filters</h3>
        </div>
        {hasActiveFilters && (
          <button
            onClick={clearAllFilters}
            className="text-sm font-medium" style={{ color: '#bea456' }}
          >
            Clear all
          </button>
        )}
      </div>

      {/* Results Summary */}
      <div className="bg-gray-50 rounded-lg p-3">
        <p className="text-sm text-gray-600">
          Showing <span className="font-semibold text-gray-900">{filteredAccounts}</span> of{' '}
          <span className="font-semibold text-gray-900">{totalAccounts}</span> accounts
        </p>
      </div>

      {/* Status Filters */}
      <div>
        <h4 className="text-sm font-medium text-gray-900 mb-3">Status</h4>
        <div className="space-y-1 max-h-40 overflow-y-auto">
          {statusOptions.map((status) => {
            const Icon = status.icon
            const isSelected = filterStatus === status.id

            return (
              <button
                key={status.id}
                onClick={() => onStatusChange(status.id)}
                className={cn(
                  "w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors border",
                  !isSelected && "text-gray-600 hover:bg-gray-50 border-transparent hover:border-gray-200"
                )}
                style={isSelected ? { backgroundColor: '#bea4561a', color: '#bea456', borderColor: '#bea45633' } : {}}
              >
                <Icon className={cn("w-4 h-4", !isSelected && status.color)} style={isSelected ? { color: '#bea456' } : {}} />
                <span className="flex-1 text-left">{status.name}</span>
                {isSelected && (
                  <CheckCircle className="w-4 h-4" style={{ color: '#bea456' }} />
                )}
              </button>
            )
          })}
        </div>
      </div>

      {/* Platform Filters */}
      <div>
        <h4 className="text-sm font-medium text-gray-900 mb-3">Platforms</h4>
        <div className="space-y-1 max-h-48 overflow-y-auto">
          {platformOptions.map((platform) => {
            const Icon = platform.icon
            const isSelected = filterPlatform === platform.id

            return (
              <button
                key={platform.id}
                onClick={() => onPlatformChange(platform.id)}
                className={cn(
                  "w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors border",
                  !isSelected && "text-gray-600 hover:bg-gray-50 border-transparent hover:border-gray-200"
                )}
                style={isSelected ? { backgroundColor: '#bea4561a', color: '#bea456', borderColor: '#bea45633' } : {}}
              >
                <Icon className={cn("w-4 h-4", !isSelected && platform.color)} style={isSelected ? { color: '#bea456' } : {}} />
                <span className="flex-1 text-left">{platform.name}</span>
                {isSelected && (
                  <CheckCircle className="w-4 h-4" style={{ color: '#bea456' }} />
                )}
              </button>
            )
          })}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="pt-4 border-t border-gray-200">
        <h4 className="text-sm font-medium text-gray-900 mb-3">Quick Filters</h4>
        <div className="space-y-1 max-h-32 overflow-y-auto">
          <button
            onClick={() => onStatusChange('connected')}
            className="w-full text-left px-3 py-2 text-sm text-gray-600 hover:bg-gray-50 rounded-lg transition-colors"
          >
            View connected accounts
          </button>
          <button
            onClick={() => onStatusChange('warning')}
            className="w-full text-left px-3 py-2 text-sm text-gray-600 hover:bg-gray-50 rounded-lg transition-colors"
          >
            View accounts with warnings
          </button>
          <button
            onClick={() => onStatusChange('disconnected')}
            className="w-full text-left px-3 py-2 text-sm text-gray-600 hover:bg-gray-50 rounded-lg transition-colors"
          >
            View disconnected accounts
          </button>
        </div>
      </div>

      {/* Connection Health */}
      <div className="pt-4 border-t border-gray-200">
        <h4 className="text-sm font-medium text-gray-900 mb-3">Connection Health</h4>
        <div className="space-y-2">
          <div className="flex justify-between items-center text-sm">
            <span className="text-gray-600">Active</span>
            <span className="font-medium text-green-600">2</span>
          </div>
          <div className="flex justify-between items-center text-sm">
            <span className="text-gray-600">Warning</span>
            <span className="font-medium text-yellow-600">1</span>
          </div>
          <div className="flex justify-between items-center text-sm">
            <span className="text-gray-600">Disconnected</span>
            <span className="font-medium text-red-600">1</span>
          </div>
        </div>
      </div>
    </div>
  )
}