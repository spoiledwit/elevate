'use client'

import { Facebook, Instagram, Linkedin, Youtube, Twitter, MoreHorizontal, AlertTriangle, CheckCircle, XCircle, RefreshCw, Trash2, Settings, BarChart3 } from 'lucide-react'
import { cn, formatDate, formatCompactNumber } from '@/lib/utils'
import { useState } from 'react'

interface SocialAccount {
  id: string
  platform: string
  username: string
  displayName: string
  followers: number
  avatar: string
  isConnected: boolean
  lastSync: Date | null
  postCount: number
  engagementRate: number
  status: 'active' | 'warning' | 'disconnected'
  warningMessage?: string
  errorMessage?: string
}

interface SocialAccountCardProps {
  account: SocialAccount
  onDisconnect: (accountId: string) => void
  onReconnect: (accountId: string) => void
}

const platformConfig = {
  facebook: { 
    icon: Facebook, 
    name: 'Facebook'
  },
  instagram: { 
    icon: Instagram, 
    name: 'Instagram'
  },
  linkedin: { 
    icon: Linkedin, 
    name: 'LinkedIn'
  },
  youtube: { 
    icon: Youtube, 
    name: 'YouTube'
  },
  tiktok: { 
    icon: Twitter, 
    name: 'TikTok'
  },
  pinterest: { 
    icon: Twitter, 
    name: 'Pinterest'
  },
  twitter: { 
    icon: Twitter, 
    name: 'Twitter/X'
  }
}

const statusConfig = {
  active: {
    icon: CheckCircle,
    color: 'text-green-600',
    label: 'Connected'
  },
  warning: {
    icon: AlertTriangle,
    color: 'text-yellow-600',
    label: 'Warning'
  },
  disconnected: {
    icon: XCircle,
    color: 'text-red-600',
    label: 'Disconnected'
  }
}

export function SocialAccountCard({ account, onDisconnect, onReconnect }: SocialAccountCardProps) {
  const [showMenu, setShowMenu] = useState(false)
  
  const platform = platformConfig[account.platform as keyof typeof platformConfig]
  const status = statusConfig[account.status]
  const PlatformIcon = platform?.icon || Twitter
  const StatusIcon = status.icon

  return (
    <div className="bg-white rounded-3xl border border-gray-400 p-8 h-full flex flex-col hover:shadow-lg transition-all">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center">
            <PlatformIcon className="w-8 h-8 text-gray-600" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-black">{account.displayName}</h3>
            <p className="text-black">@{account.username}</p>
          </div>
        </div>
          
        <div className="relative">
          <button
            onClick={() => setShowMenu(!showMenu)}
            className="p-1 hover:bg-gray-100 rounded transition-colors"
          >
            <MoreHorizontal className="w-5 h-5 text-gray-600" />
          </button>
          
          {showMenu && (
            <div className="absolute right-0 top-8 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-10">
              <button
                onClick={() => {
                  // Handle view analytics
                  setShowMenu(false)
                }}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
              >
                <BarChart3 className="w-4 h-4" />
                View Analytics
              </button>
              <button
                onClick={() => {
                  // Handle account settings
                  setShowMenu(false)
                }}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
              >
                <Settings className="w-4 h-4" />
                Account Settings
              </button>
              {account.isConnected ? (
                <button
                  onClick={() => {
                    onDisconnect(account.id)
                    setShowMenu(false)
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50"
                >
                  <Trash2 className="w-4 h-4" />
                  Disconnect
                </button>
              ) : (
                <button
                  onClick={() => {
                    onReconnect(account.id)
                    setShowMenu(false)
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-green-600 hover:bg-green-50"
                >
                  <RefreshCw className="w-4 h-4" />
                  Reconnect
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Status */}
      <div className="mb-6">
        <div className="flex items-center gap-2">
          <StatusIcon className={cn("w-5 h-5", status.color)} />
          <span className={cn("text-lg font-semibold", status.color)}>{status.label}</span>
        </div>
        
        {account.warningMessage && (
          <p className="text-black mt-2">{account.warningMessage}</p>
        )}
        
        {account.errorMessage && (
          <p className="text-red-600 mt-2">{account.errorMessage}</p>
        )}
      </div>

      {/* Stats */}
      {account.isConnected && (
        <div className="mb-6 flex-1">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-2xl font-bold text-black">
                {formatCompactNumber(account.followers)}
              </p>
              <p className="text-black">Followers</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-black">{account.postCount}</p>
              <p className="text-black">Posts</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-black">{account.engagementRate}%</p>
              <p className="text-black">Engagement</p>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="pt-4 border-t border-gray-400 mt-auto">
        <div className="text-black text-center">
          {account.lastSync ? `Last synced ${formatDate(account.lastSync)}` : 'Never synced'}
        </div>
      </div>
    </div>
  )
}