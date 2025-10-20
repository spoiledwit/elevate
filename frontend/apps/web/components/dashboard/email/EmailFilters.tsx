'use client'

import { useState } from 'react'
import { Filter } from 'lucide-react'
import type { EmailAccount } from '@/actions/email-action'

interface EmailFiltersProps {
  accounts: EmailAccount[]
  onFiltersChange: (filters: {
    accountId?: number
    isRead?: boolean
    isStarred?: boolean
  }) => void
  currentFilters: {
    accountId?: number
    isRead?: boolean
    isStarred?: boolean
  }
}

export function EmailFilters({ accounts, onFiltersChange, currentFilters }: EmailFiltersProps) {
  const [accountId, setAccountId] = useState<string>(
    currentFilters.accountId?.toString() || 'all'
  )
  const [readStatus, setReadStatus] = useState<string>(
    currentFilters.isRead === undefined ? 'all' : currentFilters.isRead ? 'read' : 'unread'
  )
  const [starredStatus, setStarredStatus] = useState<string>(
    currentFilters.isStarred === undefined ? 'all' : 'starred'
  )

  const handleApply = () => {
    onFiltersChange({
      accountId: accountId !== 'all' ? Number(accountId) : undefined,
      isRead: readStatus === 'all' ? undefined : readStatus === 'read',
      isStarred: starredStatus === 'starred' ? true : undefined
    })
  }

  const handleReset = () => {
    setAccountId('all')
    setReadStatus('all')
    setStarredStatus('all')
    onFiltersChange({
      accountId: undefined,
      isRead: undefined,
      isStarred: undefined
    })
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Filter className="w-5 h-5 text-brand-600" />
          <h3 className="font-semibold text-gray-900">Filters</h3>
        </div>
        <button
          onClick={handleReset}
          className="text-sm text-gray-600 hover:text-gray-900 transition-colors"
        >
          Reset all
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Account Filter */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Account</label>
          <select
            value={accountId}
            onChange={(e) => setAccountId(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-transparent"
          >
            <option value="all">All Accounts</option>
            {accounts.map((account) => (
              <option key={account.id} value={account.id}>
                {account.email_address}
              </option>
            ))}
          </select>
        </div>

        {/* Read Status Filter */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
          <select
            value={readStatus}
            onChange={(e) => setReadStatus(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-transparent"
          >
            <option value="all">All Messages</option>
            <option value="unread">Unread Only</option>
            <option value="read">Read Only</option>
          </select>
        </div>

        {/* Starred Filter */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Starred</label>
          <select
            value={starredStatus}
            onChange={(e) => setStarredStatus(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-transparent"
          >
            <option value="all">All Messages</option>
            <option value="starred">Starred Only</option>
          </select>
        </div>
      </div>

      <div className="mt-4 flex justify-end">
        <button
          onClick={handleApply}
          className="px-4 py-2 bg-brand-600 text-white rounded-lg hover:bg-brand-700 transition-colors font-medium"
        >
          Apply Filters
        </button>
      </div>
    </div>
  )
}
