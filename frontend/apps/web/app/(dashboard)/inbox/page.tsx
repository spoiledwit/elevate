import { EmailManager } from '@/components/dashboard/email/EmailManager'
import { getEmailAccountsAction, getEmailMessagesAction } from '@/actions/email-action'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Inbox - Elevate Social',
  description: 'Manage your emails and communications'
}

export default async function InboxPage() {
  // Fetch data server-side
  const [accountsResult, messagesResult] = await Promise.all([
    getEmailAccountsAction(),
    getEmailMessagesAction({ page: 1, pageSize: 50 })
  ])

  // Filter out inactive accounts
  const accounts = 'error' in accountsResult
    ? null
    : accountsResult.filter(account => account.is_active)
  const messages = 'error' in messagesResult ? null : messagesResult

  return (
    <EmailManager
      initialAccounts={accounts}
      initialMessages={messages}
    />
  )
}
