'use client'

import { useState, useEffect } from 'react'
import {
  Mail,
  Filter,
  Search,
  RefreshCw,
  Inbox,
  Send,
  Star,
  Archive,
  Trash2,
  Plus,
  Link as LinkIcon
} from 'lucide-react'
import { EmailList } from './EmailList'
import { EmailDetail } from './EmailDetail'
import { EmailComposer } from './EmailComposer'
import { EmailFilters } from './EmailFilters'
import { EmailStats } from './EmailStats'
import { EmailAccountConnect } from './EmailAccountConnect'
import {
  getEmailMessagesAction,
  syncEmailsAction,
  type EmailAccount,
} from '@/actions/email-action'

interface EmailManagerProps {
  initialAccounts: EmailAccount[] | null
  initialMessages: any | null
}

export function EmailManager({ initialAccounts, initialMessages }: EmailManagerProps) {
  const [accounts, setAccounts] = useState<EmailAccount[] | null>(initialAccounts)
  const [messages, setMessages] = useState<any | null>(initialMessages)
  const [selectedMessage, setSelectedMessage] = useState<number | null>(null)
  const [showComposer, setShowComposer] = useState(false)
  const [loading, setLoading] = useState(false)
  const [syncing, setSyncing] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [showConnectAccount, setShowConnectAccount] = useState(false)
  const [selectedFolder, setSelectedFolder] = useState<'inbox' | 'sent'>('inbox')

  console.log(initialMessages)

  // Check if user has connected accounts
  const hasConnectedAccounts = accounts && accounts.length > 0

  // Check for OAuth callback redirect
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const connected = params.get('connected')

    if (connected === 'success') {
      // OAuth successful, reload accounts
      window.location.href = '/inbox'
    } else if (connected === 'error') {
      const message = params.get('message') || 'Failed to connect Gmail account'
      console.error('Gmail connection error:', message)
      // Optionally show toast notification
    }
  }, [])

  // Refresh messages
  const handleRefresh = async () => {
    if (!hasConnectedAccounts) return

    setLoading(true)
    try {
      const result = await getEmailMessagesAction()
      if (!('error' in result)) {
        setMessages(result)
      }
    } catch (error) {
      console.error('Error refreshing messages:', error)
    } finally {
      setLoading(false)
    }
  }

  // Sync emails from Gmail
  const handleSync = async () => {
    if (!hasConnectedAccounts || !accounts?.[0]?.id) return

    setSyncing(true)
    try {
      const result = await syncEmailsAction({
        account_id: accounts[0].id,
        max_results: 50
      })
      if (!('error' in result)) {
        // Refresh after sync
        await handleRefresh()
      }
    } catch (error) {
      console.error('Error syncing emails:', error)
    } finally {
      setSyncing(false)
    }
  }

  // Filter messages by folder and search query
  const filteredMessages = messages?.results?.filter((message: any) => {
    // Filter by folder based on labels
    const labels = Array.isArray(message.labels) ? message.labels : []
    const isInbox = labels.includes('INBOX')
    const isSent = labels.includes('SENT')

    if (selectedFolder === 'inbox' && !isInbox) return false
    if (selectedFolder === 'sent' && !isSent) return false

    // Filter by search query
    if (searchQuery) {
      return (
        message.subject?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        message.from_email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        message.from_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        message.snippet?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    }
    return true
  }) || []

  // Show connect account modal if no accounts
  useEffect(() => {
    if (!hasConnectedAccounts) {
      setShowConnectAccount(true)
    }
  }, [hasConnectedAccounts])

  return (
    <div className="flex-1 w-full">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="px-6 py-6">
          <div className="w-full">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                  <Mail className="w-7 h-7 text-brand-600" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">Inbox</h1>
                  <p className="text-gray-600">
                    {hasConnectedAccounts
                      ? 'Manage your emails and communications'
                      : 'Connect your Gmail account to get started'
                    }
                  </p>
                </div>
              </div>

              {hasConnectedAccounts && (
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setShowComposer(true)}
                    className="inline-flex items-center gap-2 px-4 py-2.5 bg-brand-600 text-white rounded-lg hover:bg-brand-700 transition-colors font-medium"
                  >
                    <Plus className="w-4 h-4" />
                    Compose
                  </button>
                  <button
                    onClick={handleSync}
                    disabled={syncing}
                    className="inline-flex items-center gap-2 px-4 py-2.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium disabled:opacity-50"
                  >
                    <RefreshCw className={`w-4 h-4 ${syncing ? 'animate-spin' : ''}`} />
                    Sync
                  </button>

                  <button
                    onClick={() => setShowConnectAccount(true)}
                    className="inline-flex items-center gap-2 px-4 py-2.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium"
                  >
                    <LinkIcon className="w-4 h-4" />
                    Accounts
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {!hasConnectedAccounts ? (
        // No accounts connected - show connect screen
        <div className="p-6">
          <div className="max-w-2xl mx-auto">
            <EmailAccountConnect
              accounts={accounts}
              onAccountConnected={(updatedAccounts: any) => {
                setAccounts(updatedAccounts)
                setShowConnectAccount(false)
              }}
            />
          </div>
        </div>
      ) : (
        // Has accounts - show inbox
        <div className="p-6">
          <div className="max-w-7xl mx-auto space-y-6">
            {/* Search */}
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search emails by subject, sender, or content..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Sidebar and Email List/Detail View */}
            <div className="grid grid-cols-12 gap-6">
              {/* Sidebar - Folders */}
              <div className="col-span-3 bg-white rounded-lg border border-gray-200 p-4">
                <h3 className="text-sm font-semibold text-gray-900 mb-3">Folders</h3>
                <div className="space-y-1">
                  <button
                    onClick={() => {
                      setSelectedFolder('inbox')
                      setSelectedMessage(null)
                    }}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors text-left ${selectedFolder === 'inbox'
                      ? 'bg-brand-50 text-brand-700'
                      : 'text-gray-700 hover:bg-gray-50'
                      }`}
                  >
                    <Inbox className="w-4 h-4" />
                    <span className="text-sm font-medium">Inbox</span>
                    <span className={`ml-auto text-xs px-2 py-0.5 rounded-full ${selectedFolder === 'inbox'
                      ? 'bg-brand-100 text-brand-700'
                      : 'bg-gray-100 text-gray-600'
                      }`}>
                      {messages?.results?.filter((m: any) => Array.isArray(m.labels) && m.labels.includes('INBOX')).length || 0}
                    </span>
                  </button>
                  <button
                    onClick={() => {
                      setSelectedFolder('sent')
                      setSelectedMessage(null)
                    }}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors text-left ${selectedFolder === 'sent'
                      ? 'bg-brand-50 text-brand-700'
                      : 'text-gray-700 hover:bg-gray-50'
                      }`}
                  >
                    <Send className="w-4 h-4" />
                    <span className="text-sm font-medium">Sent</span>
                    <span className={`ml-auto text-xs px-2 py-0.5 rounded-full ${selectedFolder === 'sent'
                      ? 'bg-brand-100 text-brand-700'
                      : 'bg-gray-100 text-gray-600'
                      }`}>
                      {messages?.results?.filter((m: any) => Array.isArray(m.labels) && m.labels.includes('SENT')).length || 0}
                    </span>
                  </button>
                </div>
              </div>

              {/* Email List - Hidden when email is selected */}
              {!selectedMessage && (
                <div className="col-span-9 bg-white rounded-lg border border-gray-200">
                  <div className="p-6">
                    <div className="flex items-center justify-between mb-6">
                      <h2 className="text-lg font-semibold text-gray-900">
                        {selectedFolder === 'inbox' ? 'Inbox' : 'Sent'} ({filteredMessages.length})
                      </h2>


                    </div>

                    <EmailList
                      messages={filteredMessages}
                      loading={loading}
                      selectedMessageId={selectedMessage}
                      onSelectMessage={setSelectedMessage}
                      onRefresh={handleRefresh}
                    />
                  </div>
                </div>
              )}

              {/* Email Detail - Full width when selected */}
              {selectedMessage && (
                <div className="col-span-9">
                  <EmailDetail
                    messageId={selectedMessage}
                    onClose={() => setSelectedMessage(null)}
                    onRefresh={handleRefresh}
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Email Composer Modal */}
      {showComposer && (
        <EmailComposer
          accounts={accounts || []}
          onClose={() => setShowComposer(false)}
          onSent={() => {
            setShowComposer(false)
            handleRefresh()
          }}
        />
      )}

      {/* Account Connect Modal */}
      {showConnectAccount && hasConnectedAccounts && (
        <EmailAccountConnect
          accounts={accounts}
          onAccountConnected={(updatedAccounts: any) => {
            setAccounts(updatedAccounts)
            setShowConnectAccount(false)
          }}
          onClose={() => setShowConnectAccount(false)}
        />
      )}
    </div>
  )
}
