'use client'

import { useRouter } from 'next/navigation'
import {
  Link,
  Megaphone,
  Plus,
  Settings,
  BarChart3,
  ExternalLink,
  Palette,
  Share2
} from 'lucide-react'

interface QuickActionsProps {
  customLinksCount: number
  hasCtaBanner: boolean
  onUpdate: () => void
}

export function QuickActions({ customLinksCount, hasCtaBanner, onUpdate }: QuickActionsProps) {
  const router = useRouter()

  const actions = [
    {
      title: 'Manage Links',
      description: `${customLinksCount} active links`,
      icon: Link,
      color: 'blue',
      onClick: () => router.push('/custom-links'),
      showBadge: customLinksCount === 0
    },
    {
      title: 'CTA Banner',
      description: hasCtaBanner ? 'Banner active' : 'No banner set',
      icon: Megaphone,
      color: 'purple',
      onClick: () => router.push('/cta-banners'),
      showBadge: !hasCtaBanner
    },
    {
      title: 'Share Profile',
      description: 'Share your link',
      icon: Share2,
      color: 'orange',
      onClick: () => {
        if (navigator.share) {
          navigator.share({
            title: 'Check out my profile',
            url: window.location.origin + '/username'
          })
        } else {
          navigator.clipboard.writeText(window.location.origin + '/username')
          alert('Link copied to clipboard!')
        }
      },
      showBadge: false
    }
  ]

  const getColorClasses = (color: string) => {
    const colors = {
      blue: 'bg-blue-100 text-blue-600',
      purple: 'bg-purple-100 text-purple-600',
      green: 'bg-green-100 text-green-600',
      orange: 'bg-orange-100 text-orange-600'
    }
    return colors[color as keyof typeof colors] || colors.blue
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>

      <div className="space-y-3">
        {actions.map((action, index) => {
          const IconComponent = action.icon
          return (
            <button
              key={index}
              onClick={action.onClick}
              className="w-full flex items-center gap-4 p-3 rounded-lg hover:bg-gray-50 transition-colors text-left group"
            >
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${getColorClasses(action.color)}`}>
                <IconComponent className="w-5 h-5" />
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="font-medium text-gray-900">{action.title}</p>
                  {action.showBadge && (
                    <span className="w-2 h-2 bg-red-500 rounded-full"></span>
                  )}
                </div>
                <p className="text-sm text-gray-600">{action.description}</p>
              </div>

              <ExternalLink className="w-4 h-4 text-gray-400 group-hover:text-gray-600 transition-colors" />
            </button>
          )
        })}
      </div>
    </div>
  )
}