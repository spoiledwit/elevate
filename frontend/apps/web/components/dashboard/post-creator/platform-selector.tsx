'use client'

import { Facebook, Instagram, Linkedin, Pin, Check, Plus, Users } from 'lucide-react'
import { cn } from '@/lib/utils'
import Link from 'next/link'
import { useState } from 'react'

interface PlatformConnection {
  id: number
  platform_username?: string
  platform_display_name?: string
  facebook_page_name?: string
  facebook_page_id?: string
  instagram_username?: string
  instagram_business_id?: string
  pinterest_user_id?: string
  is_verified?: boolean
}

interface Platform {
  name: string
  display_name: string
  connected: boolean
  connection_count: number
  connections: PlatformConnection[]
}

interface PlatformSelectorProps {
  platforms: Platform[]
  selectedConnections: number[]
  onConnectionToggle: (connections: number[]) => void
}

const platformConfig: Record<string, { 
  icon: React.ComponentType<any>
  color: string
}> = {
  facebook: { 
    icon: Facebook,
    color: 'text-blue-600'
  },
  instagram: { 
    icon: Instagram,
    color: 'text-pink-600'
  },
  linkedin: { 
    icon: Linkedin,
    color: 'text-blue-700'
  },
  pinterest: { 
    icon: Pin,
    color: 'text-red-600'
  },
}

export function PlatformSelector({ 
  platforms, 
  selectedConnections, 
  onConnectionToggle 
}: PlatformSelectorProps) {
  const [expandedPlatform, setExpandedPlatform] = useState<string | null>(null)
  
  const handleConnectionToggle = (connectionId: number) => {
    if (selectedConnections.includes(connectionId)) {
      onConnectionToggle(selectedConnections.filter(id => id !== connectionId))
    } else {
      onConnectionToggle([...selectedConnections, connectionId])
    }
  }

  const handleSelectAll = () => {
    const allConnectionIds = platforms.flatMap(p => p.connections.map(c => c.id))
    onConnectionToggle(allConnectionIds)
  }

  const handleDeselectAll = () => {
    onConnectionToggle([])
  }

  const connectedPlatforms = platforms.filter(p => p.connected && p.connections.length > 0)
  const hasConnections = connectedPlatforms.length > 0
  const totalConnections = connectedPlatforms.reduce((sum, p) => sum + p.connections.length, 0)
  const allSelected = selectedConnections.length === totalConnections && totalConnections > 0

  if (!hasConnections) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="text-center">
          <Users className="w-12 h-12 text-gray-400 mx-auto mb-3" />
          <h3 className="text-base font-semibold text-gray-900 mb-1">No Accounts Connected</h3>
          <p className="text-sm text-gray-500 mb-4">
            Connect your social media accounts to start publishing
          </p>
          <Link
            href="/social-accounts"
            className="inline-flex items-center gap-2 px-4 py-2 bg-purple-600 text-white text-sm rounded-lg hover:bg-purple-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Connect Accounts
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200">
      {/* Header */}
      <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h2 className="text-sm font-semibold text-gray-900">Publish To</h2>
          <span className="text-xs px-2 py-0.5 bg-purple-100 text-purple-700 rounded-full font-medium">
            {selectedConnections.length} of {totalConnections} selected
          </span>
        </div>
        <div className="flex items-center gap-2">
          {selectedConnections.length > 0 ? (
            <button
              onClick={handleDeselectAll}
              className="text-xs text-gray-500 hover:text-gray-700"
            >
              Clear all
            </button>
          ) : (
            <button
              onClick={handleSelectAll}
              className="text-xs text-purple-600 hover:text-purple-700 font-medium"
            >
              Select all
            </button>
          )}
        </div>
      </div>

      {/* Accounts List */}
      <div className="divide-y divide-gray-100">
        {connectedPlatforms.map((platform) => {
          const config = platformConfig[platform.name] || { icon: Users, color: 'text-gray-600' }
          const Icon = config.icon
          const isExpanded = expandedPlatform === platform.name
          const platformConnectionIds = platform.connections.map(c => c.id)
          const selectedCount = platformConnectionIds.filter(id => selectedConnections.includes(id)).length
          
          // For single account platforms, show inline
          if (platform.connections.length === 1) {
            const connection = platform.connections[0]
            const isSelected = selectedConnections.includes(connection.id)
            const displayName = connection.facebook_page_name || 
                              connection.instagram_username || 
                              connection.platform_display_name || 
                              connection.platform_username || 
                              'Account'

            return (
              <button
                key={platform.name}
                onClick={() => handleConnectionToggle(connection.id)}
                className={cn(
                  "w-full px-4 py-3 flex items-center justify-between hover:bg-gray-50 transition-colors text-left",
                  isSelected && "bg-purple-50 hover:bg-purple-100"
                )}
              >
                <div className="flex items-center gap-3">
                  <Icon className={cn("w-5 h-5", config.color)} />
                  <div>
                    <div className="text-sm font-medium text-gray-900">
                      {platform.display_name}
                    </div>
                    <div className="text-xs text-gray-500">
                      @{displayName}
                    </div>
                  </div>
                </div>
                <div className={cn(
                  "w-5 h-5 rounded border-2 flex items-center justify-center transition-colors",
                  isSelected 
                    ? "bg-purple-600 border-purple-600" 
                    : "border-gray-300"
                )}>
                  {isSelected && <Check className="w-3 h-3 text-white" />}
                </div>
              </button>
            )
          }

          // For multiple accounts, show expandable section
          return (
            <div key={platform.name}>
              <button
                onClick={() => setExpandedPlatform(isExpanded ? null : platform.name)}
                className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <Icon className={cn("w-5 h-5", config.color)} />
                  <div className="text-left">
                    <div className="text-sm font-medium text-gray-900">
                      {platform.display_name}
                    </div>
                    <div className="text-xs text-gray-500">
                      {platform.connections.length} accounts • {selectedCount} selected
                    </div>
                  </div>
                </div>
                <svg 
                  className={cn(
                    "w-4 h-4 text-gray-400 transition-transform",
                    isExpanded && "rotate-180"
                  )} 
                  fill="none" 
                  viewBox="0 0 24 24" 
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {/* Expanded Account List */}
              {isExpanded && (
                <div className="bg-gray-50 border-t border-gray-100">
                  {platform.connections.map((connection) => {
                    const isSelected = selectedConnections.includes(connection.id)
                    const displayName = connection.facebook_page_name || 
                                      connection.instagram_username || 
                                      connection.platform_display_name || 
                                      connection.platform_username || 
                                      'Unnamed Account'

                    return (
                      <button
                        key={connection.id}
                        onClick={() => handleConnectionToggle(connection.id)}
                        className={cn(
                          "w-full px-4 py-2.5 pl-12 flex items-center justify-between hover:bg-gray-100 transition-colors text-left border-b border-gray-100 last:border-0",
                          isSelected && "bg-purple-50 hover:bg-purple-100"
                        )}
                      >
                        <div>
                          <div className="text-sm text-gray-900">
                            {displayName}
                          </div>
                          {connection.is_verified && (
                            <span className="text-xs text-blue-600">Verified</span>
                          )}
                        </div>
                        <div className={cn(
                          "w-5 h-5 rounded border-2 flex items-center justify-center transition-colors",
                          isSelected 
                            ? "bg-purple-600 border-purple-600" 
                            : "border-gray-300"
                        )}>
                          {isSelected && <Check className="w-3 h-3 text-white" />}
                        </div>
                      </button>
                    )
                  })}
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Footer */}
      <div className="px-4 py-3 border-t border-gray-100">
        <Link
          href="/social-accounts"
          className="text-sm text-purple-600 hover:text-purple-700 font-medium"
        >
          Manage Accounts →
        </Link>
      </div>
    </div>
  )
}