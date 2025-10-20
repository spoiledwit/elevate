'use client'

import { useState } from 'react'
import { Mail, Link as LinkIcon, Check, X, Loader2, ExternalLink, Trash2 } from 'lucide-react'
import {
  getGmailAuthUrlAction,
  getEmailAccountsAction,
  disconnectEmailAccountAction,
  type EmailAccount
} from '@/actions/email-action'

interface EmailAccountConnectProps {
  accounts: EmailAccount[] | null
  onAccountConnected: (accounts: EmailAccount[]) => void
  onClose?: () => void
}

export function EmailAccountConnect({
  accounts,
  onAccountConnected,
  onClose
}: EmailAccountConnectProps) {
  const [loading, setLoading] = useState(false)
  const [disconnecting, setDisconnecting] = useState<number | null>(null)
  const [error, setError] = useState<string | null>(null)

  const hasAccounts = accounts && accounts.length > 0

  const handleConnectGmail = async () => {
    setLoading(true)
    setError(null)

    try {
      const result = await getGmailAuthUrlAction()
      if ('error' in result) {
        setError(result.error)
      } else if (result.auth_url) {
        // Open OAuth URL in a new window
        const width = 600
        const height = 700
        const left = window.screen.width / 2 - width / 2
        const top = window.screen.height / 2 - height / 2

        const popup = window.open(
          result.auth_url,
          'Gmail OAuth',
          `width=${width},height=${height},left=${left},top=${top}`
        )

        // Poll for completion
        const pollTimer = setInterval(async () => {
          if (popup?.closed) {
            clearInterval(pollTimer)
            // Refresh accounts list
            const accountsResult = await getEmailAccountsAction()
            if (!('error' in accountsResult)) {
              onAccountConnected(accountsResult)
            }
            setLoading(false)
          }
        }, 1000)
      }
    } catch (err) {
      setError('Failed to initiate Gmail connection')
      setLoading(false)
    }
  }

  const handleDisconnect = async (accountId: number) => {
    if (!confirm('Are you sure you want to disconnect this email account?')) return

    setDisconnecting(accountId)
    try {
      const result = await disconnectEmailAccountAction(accountId)
      if (!('error' in result)) {
        // Refresh accounts list
        const accountsResult = await getEmailAccountsAction()
        if (!('error' in accountsResult)) {
          onAccountConnected(accountsResult)
        }
      }
    } catch (error) {
      console.error('Failed to disconnect account:', error)
    } finally {
      setDisconnecting(null)
    }
  }

  return (
    <div className={hasAccounts && onClose ? 'fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4' : ''}>
      <div className={hasAccounts && onClose ? 'bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto' : 'bg-white rounded-lg border border-gray-200 p-8'}>
        {/* Header */}
        {hasAccounts && onClose ? (
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Email Accounts</h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-gray-400" />
            </button>
          </div>
        ) : null}

        <div className={hasAccounts && onClose ? 'p-6' : ''}>
          {/* Connected Accounts */}
          {hasAccounts && (
            <div className="mb-6">
              <h3 className="text-sm font-semibold text-gray-900 mb-3">Connected Accounts</h3>
              <div className="space-y-3">
                {accounts.map((account) => (
                  <div
                    key={account.id}
                    className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-brand-100 rounded-full flex items-center justify-center">
                        <Mail className="w-5 h-5 text-brand-600" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{account.email_address}</p>
                        <div className="flex items-center gap-2 mt-1">
                          {account.is_active ? (
                            <span className="inline-flex items-center gap-1 text-xs text-green-600">
                              <Check className="w-3 h-3" />
                              Active
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-xs text-gray-500">
                              <X className="w-3 h-3" />
                              Inactive
                            </span>
                          )}
                          {account.last_synced && (
                            <span className="text-xs text-gray-500">
                              • Last synced:{' '}
                              {new Date(account.last_synced).toLocaleDateString()}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => handleDisconnect(account.id!)}
                      disabled={disconnecting === account.id}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                    >
                      {disconnecting === account.id ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Trash2 className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Connect New Account */}
          <div>
            {hasAccounts && <h3 className="text-sm font-semibold text-gray-900 mb-3">Connect New Account</h3>}

            {!hasAccounts && (
              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-brand-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Mail className="w-8 h-8 text-brand-600" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">Connect Your Email</h3>
                <p className="text-gray-600 mb-6">
                  Connect your Gmail account to start managing your emails in Elevate Social
                </p>
              </div>
            )}

            <button
              onClick={handleConnectGmail}
              disabled={loading}
              className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-white border-2 border-gray-200 rounded-lg hover:border-brand-500 hover:bg-brand-50 transition-colors disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin text-brand-600" />
                  <span className="font-medium text-gray-900">Connecting...</span>
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none">
                    <path
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      fill="#4285F4"
                    />
                    <path
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      fill="#34A853"
                    />
                    <path
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                      fill="#FBBC05"
                    />
                    <path
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                      fill="#EA4335"
                    />
                  </svg>
                  <span className="font-medium text-gray-900">Connect Gmail Account</span>
                  <ExternalLink className="w-4 h-4 text-gray-400" />
                </>
              )}
            </button>

            {error && (
              <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}

            {!hasAccounts && (
              <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex gap-3">
                  <LinkIcon className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-blue-900">
                    <p className="font-medium mb-1">What you can do with email integration:</p>
                    <ul className="space-y-1 text-blue-800">
                      <li>• Read and manage your Gmail inbox</li>
                      <li>• Send emails directly from Elevate Social</li>
                      <li>• Automatic email syncing</li>
                      <li>• Search and filter your messages</li>
                    </ul>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
