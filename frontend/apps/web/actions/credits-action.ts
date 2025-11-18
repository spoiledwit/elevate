'use server'

import { getApiClient } from '@/lib/api'
import { authOptions } from '@/lib/auth'
import { ApiError } from '@frontend/types/api'
import { getServerSession } from 'next-auth'

/**
 * Request type for purchasing credits
 */
export type CreditPurchaseRequest = {
  amount: number
  success_url?: string
  cancel_url?: string
}

/**
 * Response type for credit balance
 */
export type CreditBalanceResponse = {
  milo_credits: string
  total_credits_purchased: string
  total_credits_used: string
}

/**
 * Response type for credit purchase
 */
export type CreditPurchaseResponse = {
  checkout_url: string
}

/**
 * Get current user's credit balance and statistics
 */
export async function getCreditBalanceAction(): Promise<CreditBalanceResponse | { error: string }> {
  const session = await getServerSession(authOptions)

  if (!session) {
    return { error: 'Authentication required' }
  }

  try {
    const apiClient = await getApiClient(session)

    const response = await apiClient.credits.creditsBalanceRetrieve()

    return response
  } catch (error) {
    console.error('Failed to get credit balance:', error)
    if (error instanceof ApiError) {
      console.error('API Error:', error.body)
      return { error: error.body?.error || 'Failed to get credit balance' }
    }
    return { error: 'Failed to get credit balance' }
  }
}

/**
 * Get user's credit transaction history
 */
export async function getCreditTransactionsAction(): Promise<any[] | { error: string }> {
  const session = await getServerSession(authOptions)

  if (!session) {
    return { error: 'Authentication required' }
  }

  try {
    const apiClient = await getApiClient(session)

    const response = await apiClient.credits.creditsTransactionsList()

    return response
  } catch (error) {
    console.error('Failed to get credit transactions:', error)
    if (error instanceof ApiError) {
      console.error('API Error:', error.body)
      return { error: error.body?.error || 'Failed to get credit transactions' }
    }
    return { error: 'Failed to get credit transactions' }
  }
}

/**
 * Get user's Milo call logs
 */
export async function getMiloCallLogsAction(): Promise<any[] | { error: string }> {
  const session = await getServerSession(authOptions)

  if (!session) {
    return { error: 'Authentication required' }
  }

  try {
    const apiClient = await getApiClient(session)

    const response = await apiClient.credits.creditsCallLogsList()

    return response
  } catch (error) {
    console.error('Failed to get Milo call logs:', error)
    if (error instanceof ApiError) {
      console.error('API Error:', error.body)
      return { error: error.body?.error || 'Failed to get Milo call logs' }
    }
    return { error: 'Failed to get Milo call logs' }
  }
}

/**
 * Purchase Milo credits via Stripe checkout
 */
export async function purchaseCreditsAction(
  data: CreditPurchaseRequest
): Promise<CreditPurchaseResponse | { error: string }> {
  const session = await getServerSession(authOptions)

  if (!session) {
    return { error: 'Authentication required' }
  }

  // Validate amount
  if (data.amount <= 0) {
    return { error: 'Amount must be greater than 0' }
  }

  if (data.amount > 10000) {
    return { error: 'Maximum purchase amount is 10,000 credits' }
  }

  try {
    const apiClient = await getApiClient(session)

    const response = await apiClient.credits.creditsPurchaseCreate({
      amount: data.amount.toString(),
      success_url: data.success_url,
      cancel_url: data.cancel_url
    })

    return response
  } catch (error) {
    console.error('Failed to purchase credits:', error)
    if (error instanceof ApiError) {
      console.error('API Error:', error.body)
      return { error: error.body?.error || 'Failed to create checkout session' }
    }
    return { error: 'Failed to create checkout session' }
  }
}

/**
 * Deduct credits for Milo AI voice call usage
 */
export async function deductMiloCreditsAction(
  conversation_id: string,
  minutes_elapsed: number
): Promise<{
  success: boolean
  credits_deducted: number
  remaining_balance: number
  message: string
} | { error: string; required?: number; available?: number }> {
  const session = await getServerSession(authOptions)

  if (!session) {
    return { error: 'Authentication required' }
  }

  if (!conversation_id || conversation_id.trim() === '') {
    return { error: 'Conversation ID is required' }
  }

  if (minutes_elapsed < 1) {
    return { error: 'Minutes elapsed must be at least 1' }
  }

  try {
    const apiClient = await getApiClient(session)

    const response = await apiClient.credits.creditsDeductCreate({
      conversation_id,
      minutes_elapsed
    })

    // Convert string numbers to actual numbers
    return {
      success: response.success,
      credits_deducted: parseFloat(response.credits_deducted as unknown as string),
      remaining_balance: parseFloat(response.remaining_balance as unknown as string),
      message: response.message
    }
  } catch (error) {
    console.error('Failed to deduct credits:', error)
    if (error instanceof ApiError) {
      console.error('API Error:', error.body)
      // Return the error body which may contain required/available fields for insufficient credits
      return error.body || { error: 'Failed to deduct credits' }
    }
    return { error: 'Failed to deduct credits' }
  }
}

/**
 * End a Milo AI voice call session
 */
export async function endMiloCallAction(
  conversation_id: string
): Promise<{
  success: boolean
  total_duration_seconds: number
  total_credits_used: number
} | { error: string }> {
  const session = await getServerSession(authOptions)

  if (!session) {
    return { error: 'Authentication required' }
  }

  if (!conversation_id || conversation_id.trim() === '') {
    return { error: 'Conversation ID is required' }
  }

  try {
    const apiClient = await getApiClient(session)

    const response = await apiClient.credits.creditsEndCallCreate({
      conversation_id
    })

    // Convert string numbers to actual numbers
    return {
      success: response.success,
      total_duration_seconds: response.total_duration_seconds,
      total_credits_used: parseFloat(response.total_credits_used as unknown as string)
    }
  } catch (error) {
    console.error('Failed to end Milo call:', error)
    if (error instanceof ApiError) {
      console.error('API Error:', error.body)
      return { error: error.body?.error || 'Failed to end call' }
    }
    return { error: 'Failed to end call' }
  }
}

/**
 * Get credit statistics (total calls, minutes, etc.)
 */
export async function getCreditStatsAction(): Promise<{
  total_calls: number
  total_minutes: number
  total_credits_spent: number
  average_call_duration_minutes: number
  recent_calls_7_days: number
} | { error: string }> {
  const session = await getServerSession(authOptions)

  if (!session) {
    return { error: 'Authentication required' }
  }

  try {
    const apiClient = await getApiClient(session)

    // Calculate stats from call logs
    const callLogs = await apiClient.credits.creditsCallLogsList()

    if (!Array.isArray(callLogs)) {
      return {
        total_calls: 0,
        total_minutes: 0,
        total_credits_spent: 0,
        average_call_duration_minutes: 0,
        recent_calls_7_days: 0
      }
    }

    const total_calls = callLogs.length
    const total_seconds = callLogs.reduce((sum: number, log: any) => sum + (log.call_duration_seconds || 0), 0)
    const total_minutes = Math.round((total_seconds / 60) * 100) / 100
    const total_credits_spent = callLogs.reduce((sum: number, log: any) => sum + parseFloat(log.credits_used || 0), 0)
    const average_call_duration_minutes = total_calls > 0 ? Math.round((total_seconds / total_calls / 60) * 100) / 100 : 0

    // Recent calls (last 7 days)
    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
    const recent_calls_7_days = callLogs.filter((log: any) => {
      const createdAt = new Date(log.created_at)
      return createdAt >= sevenDaysAgo
    }).length

    return {
      total_calls,
      total_minutes,
      total_credits_spent,
      average_call_duration_minutes,
      recent_calls_7_days
    }
  } catch (error) {
    console.error('Failed to get credit stats:', error)
    if (error instanceof ApiError) {
      console.error('API Error:', error.body)
      return { error: error.body?.error || 'Failed to get credit statistics' }
    }
    return { error: 'Failed to get credit statistics' }
  }
}