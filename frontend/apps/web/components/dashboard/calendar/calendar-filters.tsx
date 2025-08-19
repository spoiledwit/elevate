'use client'

import { Facebook, Instagram, Linkedin, Youtube, Twitter, Filter, CheckCircle, Clock, AlertCircle, FileText } from 'lucide-react'
import { cn } from '@/lib/utils'

interface CalendarFiltersProps {
  selectedPlatforms: string[]
  selectedStatus: string[]
  onPlatformChange: (platforms: string[]) => void
  onStatusChange: (statuses: string[]) => void
  totalPosts: number
  filteredPosts: number
}

const platforms = [
  { id: 'facebook', name: 'Facebook', icon: Facebook, color: 'text-blue-600' },
  { id: 'instagram', name: 'Instagram', icon: Instagram, color: 'text-pink-600' },
  { id: 'linkedin', name: 'LinkedIn', icon: Linkedin, color: 'text-blue-700' },
  { id: 'youtube', name: 'YouTube', icon: Youtube, color: 'text-red-600' },
  { id: 'tiktok', name: 'TikTok', icon: Twitter, color: 'text-gray-900' },
]

const statuses = [
  { 
    id: 'published', 
    name: 'Published', 
    icon: CheckCircle, 
    color: 'text-green-600',
    bgColor: 'bg-green-50',
    borderColor: 'border-green-200'
  },
  { 
    id: 'scheduled', 
    name: 'Scheduled', 
    icon: Clock, 
    color: 'text-blue-600',
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-200'
  },
  { 
    id: 'draft', 
    name: 'Draft', 
    icon: FileText, 
    color: 'text-gray-600',
    bgColor: 'bg-gray-50',
    borderColor: 'border-gray-200'
  },
  { 
    id: 'failed', 
    name: 'Failed', 
    icon: AlertCircle, 
    color: 'text-red-600',
    bgColor: 'bg-red-50',
    borderColor: 'border-red-200'
  },
]

export function CalendarFilters({
  selectedPlatforms,
  selectedStatus,
  onPlatformChange,
  onStatusChange,
  totalPosts,
  filteredPosts
}: CalendarFiltersProps) {
  
  const togglePlatform = (platformId: string) => {
    if (selectedPlatforms.includes(platformId)) {
      onPlatformChange(selectedPlatforms.filter(id => id !== platformId))
    } else {
      onPlatformChange([...selectedPlatforms, platformId])
    }
  }

  const toggleStatus = (statusId: string) => {
    if (selectedStatus.includes(statusId)) {
      onStatusChange(selectedStatus.filter(id => id !== statusId))
    } else {
      onStatusChange([...selectedStatus, statusId])
    }
  }

  const clearAllFilters = () => {
    onPlatformChange([])
    onStatusChange([])
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4 space-y-6 h-fit max-h-[calc(100vh-200px)] overflow-y-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Filter className="w-5 h-5 text-gray-400" />
          <h3 className="font-semibold text-gray-900">Filters</h3>
        </div>
        {(selectedPlatforms.length > 0 || selectedStatus.length > 0) && (
          <button
            onClick={clearAllFilters}
            className="text-sm text-purple-600 hover:text-purple-700 font-medium"
          >
            Clear all
          </button>
        )}
      </div>

      {/* Results Summary */}
      <div className="bg-gray-50 rounded-lg p-3">
        <p className="text-sm text-gray-600">
          Showing <span className="font-semibold text-gray-900">{filteredPosts}</span> of{' '}
          <span className="font-semibold text-gray-900">{totalPosts}</span> posts
        </p>
      </div>

      {/* Platform Filters */}
      <div>
        <h4 className="text-sm font-medium text-gray-900 mb-3">Platforms</h4>
        <div className="space-y-1 max-h-48 overflow-y-auto">
          {platforms.map((platform) => {
            const Icon = platform.icon
            const isSelected = selectedPlatforms.includes(platform.id)
            
            return (
              <button
                key={platform.id}
                onClick={() => togglePlatform(platform.id)}
                className={cn(
                  "w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 border",
                  isSelected
                    ? "bg-purple-50 text-purple-700 border-purple-200"
                    : "text-gray-600 hover:bg-gray-50 border-transparent hover:border-gray-200"
                )}
              >
                <Icon className={cn("w-4 h-4", isSelected ? "text-purple-600" : platform.color)} />
                <span className="flex-1 text-left">{platform.name}</span>
                {isSelected && (
                  <CheckCircle className="w-4 h-4 text-purple-600" />
                )}
              </button>
            )
          })}
        </div>
      </div>

      {/* Status Filters */}
      <div>
        <h4 className="text-sm font-medium text-gray-900 mb-3">Status</h4>
        <div className="space-y-1 max-h-40 overflow-y-auto">
          {statuses.map((status) => {
            const Icon = status.icon
            const isSelected = selectedStatus.includes(status.id)
            
            return (
              <button
                key={status.id}
                onClick={() => toggleStatus(status.id)}
                className={cn(
                  "w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 border",
                  isSelected
                    ? `${status.bgColor} ${status.color} ${status.borderColor}`
                    : "text-gray-600 hover:bg-gray-50 border-transparent hover:border-gray-200"
                )}
              >
                <Icon className={cn("w-4 h-4", isSelected ? status.color : "text-gray-400")} />
                <span className="flex-1 text-left">{status.name}</span>
                {isSelected && (
                  <CheckCircle className={cn("w-4 h-4", status.color)} />
                )}
              </button>
            )
          })}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="pt-4 border-t border-gray-200">
        <h4 className="text-sm font-medium text-gray-900 mb-3">Quick Actions</h4>
        <div className="space-y-1 max-h-32 overflow-y-auto">
          <button
            onClick={() => onStatusChange(['scheduled'])}
            className="w-full text-left px-3 py-2 text-sm text-gray-600 hover:bg-gray-50 rounded-lg transition-colors"
          >
            View scheduled posts
          </button>
          <button
            onClick={() => onStatusChange(['draft'])}
            className="w-full text-left px-3 py-2 text-sm text-gray-600 hover:bg-gray-50 rounded-lg transition-colors"
          >
            View drafts
          </button>
          <button
            onClick={() => onStatusChange(['failed'])}
            className="w-full text-left px-3 py-2 text-sm text-gray-600 hover:bg-gray-50 rounded-lg transition-colors"
          >
            View failed posts
          </button>
        </div>
      </div>
    </div>
  )
}