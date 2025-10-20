'use client'

import { Mail, Inbox, Star, Link as LinkIcon } from 'lucide-react'

interface EmailStatsProps {
  totalEmails: number
  unreadEmails: number
  starredEmails: number
  connectedAccounts: number
}

export function EmailStats({
  totalEmails,
  unreadEmails,
  starredEmails,
  connectedAccounts
}: EmailStatsProps) {
  const stats = [
    {
      label: 'Total Emails',
      value: totalEmails,
      icon: Inbox,
      color: 'blue',
      bgColor: 'bg-blue-100',
      iconColor: 'text-blue-600'
    },
    {
      label: 'Unread',
      value: unreadEmails,
      icon: Mail,
      color: 'purple',
      bgColor: 'bg-purple-100',
      iconColor: 'text-brand-600'
    },
    {
      label: 'Starred',
      value: starredEmails,
      icon: Star,
      color: 'yellow',
      bgColor: 'bg-yellow-100',
      iconColor: 'text-yellow-600'
    },
    {
      label: 'Connected Accounts',
      value: connectedAccounts,
      icon: LinkIcon,
      color: 'green',
      bgColor: 'bg-green-100',
      iconColor: 'text-green-600'
    }
  ]

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((stat) => (
        <div
          key={stat.label}
          className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 mb-1">{stat.label}</p>
              <p className="text-3xl font-bold text-gray-900">{stat.value}</p>
            </div>
            <div className={`w-12 h-12 ${stat.bgColor} rounded-xl flex items-center justify-center`}>
              <stat.icon className={`w-6 h-6 ${stat.iconColor}`} />
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
