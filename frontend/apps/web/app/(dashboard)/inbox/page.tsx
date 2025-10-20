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


  const accounts = 'error' in accountsResult ? null : accountsResult
  const messages = 'error' in messagesResult ? null : messagesResult

  return (
    <EmailManager
      initialAccounts={accounts}
      initialMessages={messages}
    />
  )
}
