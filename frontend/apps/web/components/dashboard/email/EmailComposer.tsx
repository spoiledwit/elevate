'use client'

import { useState } from 'react'
import { X, Send, Paperclip, Loader2 } from 'lucide-react'
import { sendEmailAction, type EmailAccount } from '@/actions/email-action'

interface EmailComposerProps {
  accounts: EmailAccount[]
  onClose: () => void
  onSent: () => void
  replyTo?: {
    to: string[]
    subject: string
  }
}

export function EmailComposer({ accounts, onClose, onSent, replyTo }: EmailComposerProps) {
  const [selectedAccount, setSelectedAccount] = useState<number>(accounts[0]?.id || 0)
  const [to, setTo] = useState<string>(replyTo?.to.join(', ') || '')
  const [cc, setCc] = useState<string>('')
  const [bcc, setBcc] = useState<string>('')
  const [subject, setSubject] = useState<string>(replyTo?.subject || '')
  const [body, setBody] = useState<string>('')
  const [sending, setSending] = useState(false)
  const [showCc, setShowCc] = useState(false)
  const [showBcc, setShowBcc] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSend = async () => {
    // Validation
    if (!to.trim()) {
      setError('Please enter at least one recipient')
      return
    }
    if (!subject.trim()) {
      setError('Please enter a subject')
      return
    }
    if (!body.trim()) {
      setError('Please enter a message')
      return
    }

    setSending(true)
    setError(null)

    try {
      // Parse email addresses
      const toEmails = to
        .split(',')
        .map((e) => e.trim())
        .filter((e) => e)
      const ccEmails = cc
        .split(',')
        .map((e) => e.trim())
        .filter((e) => e)
      const bccEmails = bcc
        .split(',')
        .map((e) => e.trim())
        .filter((e) => e)

      const result = await sendEmailAction({
        account_id: selectedAccount,
        to_emails: toEmails,
        cc_emails: ccEmails.length > 0 ? ccEmails : undefined,
        bcc_emails: bccEmails.length > 0 ? bccEmails : undefined,
        subject,
        body_html: `<div style="font-family: system-ui, -apple-system, sans-serif;">${body.replace(
          /\n/g,
          '<br>'
        )}</div>`
      })

      if ('error' in result) {
        setError(result.error)
      } else {
        onSent()
      }
    } catch (err) {
      setError('Failed to send email. Please try again.')
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">New Message</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        {/* Form */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {/* Account Selection */}
          {accounts.length > 1 && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">From</label>
              <select
                value={selectedAccount}
                onChange={(e) => setSelectedAccount(Number(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-transparent"
              >
                {accounts.map((account) => (
                  <option key={account.id} value={account.id}>
                    {account.email_address}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* To */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-gray-700">To</label>
              <div className="flex items-center gap-2">
                {!showCc && (
                  <button
                    onClick={() => setShowCc(true)}
                    className="text-sm text-brand-600 hover:text-brand-700"
                  >
                    Cc
                  </button>
                )}
                {!showBcc && (
                  <button
                    onClick={() => setShowBcc(true)}
                    className="text-sm text-brand-600 hover:text-brand-700"
                  >
                    Bcc
                  </button>
                )}
              </div>
            </div>
            <input
              type="text"
              value={to}
              onChange={(e) => setTo(e.target.value)}
              placeholder="recipient@example.com, another@example.com"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-transparent"
            />
          </div>

          {/* Cc */}
          {showCc && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Cc</label>
              <input
                type="text"
                value={cc}
                onChange={(e) => setCc(e.target.value)}
                placeholder="cc@example.com"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-transparent"
              />
            </div>
          )}

          {/* Bcc */}
          {showBcc && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Bcc</label>
              <input
                type="text"
                value={bcc}
                onChange={(e) => setBcc(e.target.value)}
                placeholder="bcc@example.com"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-transparent"
              />
            </div>
          )}

          {/* Subject */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Subject</label>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Enter subject"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-transparent"
            />
          </div>

          {/* Body */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Message</label>
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Write your message..."
              rows={12}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-transparent resize-none"
            />
          </div>

          {/* Error Message */}
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-4 border-t border-gray-200">
          <button
            disabled
            className="inline-flex items-center gap-2 px-4 py-2 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <Paperclip className="w-4 h-4" />
            Attach files
          </button>

          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors font-medium"
            >
              Cancel
            </button>
            <button
              onClick={handleSend}
              disabled={sending}
              className="inline-flex items-center gap-2 px-6 py-2 bg-brand-600 text-white rounded-lg hover:bg-brand-700 transition-colors font-medium disabled:opacity-50"
            >
              {sending ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  Send
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
