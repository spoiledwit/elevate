'use server'

import { getApiClient } from '@/lib/api'
import { authOptions } from '@/lib/auth'
import {
  ApiError,
  type EmailAccount,
  type EmailMessage,
  type EmailDraft,
  type GmailAuthUrl,
  type EmailSend,
  type EmailSendResponse,
  type EmailSync,
  type EmailSyncResponse,
  type PaginatedEmailMessageListList,
} from '@frontend/types/api'
import { getServerSession } from 'next-auth'

/**
 * Get Gmail OAuth authorization URL
 */
export async function getGmailAuthUrlAction(): Promise<GmailAuthUrl | { error: string }> {
  const session = await getServerSession(authOptions)

  if (!session) {
    return { error: 'Authentication required' }
  }

  try {
    const apiClient = await getApiClient(session)
    const response = await apiClient.email.emailAuthGoogleRetrieve()

    return response
  } catch (error) {
    console.error('Failed to get Gmail auth URL:', error)
    if (error instanceof ApiError) {
      return { error: error.body?.error || 'Failed to get authorization URL' }
    }
    return { error: 'Failed to get authorization URL' }
  }
}

/**
 * Get all connected email accounts
 */
export async function getEmailAccountsAction(): Promise<EmailAccount[] | { error: string }> {
  const session = await getServerSession(authOptions)

  if (!session) {
    return { error: 'Authentication required' }
  }

  try {
    const apiClient = await getApiClient(session)
    const response = await apiClient.email.emailAccountsList()

    return response
  } catch (error) {
    console.error('Failed to get email accounts:', error)
    if (error instanceof ApiError) {
      return { error: error.body?.error || 'Failed to get email accounts' }
    }
    return { error: 'Failed to get email accounts' }
  }
}

/**
 * Disconnect an email account
 */
export async function disconnectEmailAccountAction(
  accountId: number
): Promise<{ message?: string } | { error: string }> {
  const session = await getServerSession(authOptions)

  if (!session) {
    return { error: 'Authentication required' }
  }

  try {
    const apiClient = await getApiClient(session)
    const response = await apiClient.email.emailAccountsDisconnectDestroy(accountId)

    return response
  } catch (error) {
    console.error('Failed to disconnect email account:', error)
    if (error instanceof ApiError) {
      return { error: error.body?.error || 'Failed to disconnect account' }
    }
    return { error: 'Failed to disconnect account' }
  }
}

/**
 * Get list of email messages
 */
export async function getEmailMessagesAction(params?: {
  accountId?: number
  isRead?: boolean
  isStarred?: boolean
  page?: number
  pageSize?: number
}): Promise<PaginatedEmailMessageListList | { error: string }> {
  const session = await getServerSession(authOptions)

  if (!session) {
    return { error: 'Authentication required' }
  }

  try {
    const apiClient = await getApiClient(session)
    const response = await apiClient.email.emailMessagesList(
      params?.accountId,
      params?.isRead,
      params?.isStarred,
      params?.page,
      params?.pageSize
    )

    return response
  } catch (error) {
    console.error('Failed to get email messages:', error)
    if (error instanceof ApiError) {
      return { error: error.body?.error || 'Failed to get email messages' }
    }
    return { error: 'Failed to get email messages' }
  }
}

/**
 * Get email message detail
 */
export async function getEmailMessageDetailAction(
  messageId: number
): Promise<EmailMessage | { error: string }> {
  const session = await getServerSession(authOptions)

  if (!session) {
    return { error: 'Authentication required' }
  }

  try {
    const apiClient = await getApiClient(session)
    const response = await apiClient.email.emailMessagesRetrieve(messageId)

    return response
  } catch (error) {
    console.error('Failed to get email message detail:', error)
    if (error instanceof ApiError) {
      return { error: error.body?.error || 'Failed to get email message' }
    }
    return { error: 'Failed to get email message' }
  }
}

/**
 * Send an email
 */
export async function sendEmailAction(
  data: EmailSend
): Promise<EmailSendResponse | { error: string }> {
  const session = await getServerSession(authOptions)

  if (!session) {
    return { error: 'Authentication required' }
  }

  try {
    const apiClient = await getApiClient(session)
    const response = await apiClient.email.emailSendCreate(data)

    return response
  } catch (error) {
    console.error('Failed to send email:', error)
    if (error instanceof ApiError) {
      return { error: error.body?.error || 'Failed to send email' }
    }
    return { error: 'Failed to send email' }
  }
}

/**
 * Sync emails from Gmail
 */
export async function syncEmailsAction(
  data: EmailSync
): Promise<EmailSyncResponse | { error: string }> {
  const session = await getServerSession(authOptions)

  if (!session) {
    return { error: 'Authentication required' }
  }

  try {
    const apiClient = await getApiClient(session)
    const response = await apiClient.email.emailSyncCreate(data)

    return response
  } catch (error) {
    console.error('Failed to sync emails:', error)
    if (error instanceof ApiError) {
      return { error: error.body?.error || 'Failed to sync emails' }
    }
    return { error: 'Failed to sync emails' }
  }
}

/**
 * Mark email as read/unread
 */
export async function markEmailAsReadAction(
  messageId: number,
  isRead: boolean
): Promise<{ message?: string } | { error: string }> {
  const session = await getServerSession(authOptions)

  if (!session) {
    return { error: 'Authentication required' }
  }

  try {
    const apiClient = await getApiClient(session)
    const response = await apiClient.email.emailMessagesReadPartialUpdate(
      messageId,
      { message_id: messageId.toString(), is_read: isRead }
    )

    return response
  } catch (error) {
    console.error('Failed to mark email as read:', error)
    if (error instanceof ApiError) {
      return { error: error.body?.error || 'Failed to update email status' }
    }
    return { error: 'Failed to update email status' }
  }
}

/**
 * Delete an email
 */
export async function deleteEmailAction(
  messageId: number
): Promise<{ message?: string } | { error: string }> {
  const session = await getServerSession(authOptions)

  if (!session) {
    return { error: 'Authentication required' }
  }

  try {
    const apiClient = await getApiClient(session)
    const response = await apiClient.email.emailMessagesDeleteDestroy(messageId)

    return response
  } catch (error) {
    console.error('Failed to delete email:', error)
    if (error instanceof ApiError) {
      return { error: error.body?.error || 'Failed to delete email' }
    }
    return { error: 'Failed to delete email' }
  }
}

/**
 * Get list of email drafts
 */
export async function getEmailDraftsAction(): Promise<EmailDraft[] | { error: string }> {
  const session = await getServerSession(authOptions)

  if (!session) {
    return { error: 'Authentication required' }
  }

  try {
    const apiClient = await getApiClient(session)
    const response = await apiClient.email.emailDraftsList()

    return response
  } catch (error) {
    console.error('Failed to get email drafts:', error)
    if (error instanceof ApiError) {
      return { error: error.body?.error || 'Failed to get email drafts' }
    }
    return { error: 'Failed to get email drafts' }
  }
}

/**
 * Create an email draft
 */
export async function createEmailDraftAction(
  data: EmailDraft
): Promise<EmailDraft | { error: string }> {
  const session = await getServerSession(authOptions)

  if (!session) {
    return { error: 'Authentication required' }
  }

  try {
    const apiClient = await getApiClient(session)
    const response = await apiClient.email.emailDraftsCreate(data)

    return response
  } catch (error) {
    console.error('Failed to create email draft:', error)
    if (error instanceof ApiError) {
      return { error: error.body?.error || 'Failed to create email draft' }
    }
    return { error: 'Failed to create email draft' }
  }
}

/**
 * Update an email draft
 */
export async function updateEmailDraftAction(
  draftId: number,
  data: Partial<EmailDraft>
): Promise<EmailDraft | { error: string }> {
  const session = await getServerSession(authOptions)

  if (!session) {
    return { error: 'Authentication required' }
  }

  try {
    const apiClient = await getApiClient(session)
    const response = await apiClient.email.emailDraftsPartialUpdate(draftId, data)

    return response
  } catch (error) {
    console.error('Failed to update email draft:', error)
    if (error instanceof ApiError) {
      return { error: error.body?.error || 'Failed to update email draft' }
    }
    return { error: 'Failed to update email draft' }
  }
}

/**
 * Delete an email draft
 */
export async function deleteEmailDraftAction(
  draftId: number
): Promise<{ message?: string } | { error: string }> {
  const session = await getServerSession(authOptions)

  if (!session) {
    return { error: 'Authentication required' }
  }

  try {
    const apiClient = await getApiClient(session)
    const response = await apiClient.email.emailDraftsDestroy(draftId)

    return response
  } catch (error) {
    console.error('Failed to delete email draft:', error)
    if (error instanceof ApiError) {
      return { error: error.body?.error || 'Failed to delete email draft' }
    }
    return { error: 'Failed to delete email draft' }
  }
}

// Type exports for convenience
export type {
  EmailAccount,
  EmailMessage,
  EmailDraft,
  EmailSend,
  EmailSendResponse,
  EmailSync,
  EmailSyncResponse,
} from '@frontend/types/api'
