'use server'

import { getApiClient } from '@/lib/api'
import { authOptions } from '@/lib/auth'
import { 
  ApiError, 
  type CheckoutSession, 
  type CheckoutSessionResponse,
  type PortalSessionResponse,
  type Subscription
} from '@frontend/types/api'
import { getServerSession } from 'next-auth'

/**
 * Create a Stripe checkout session for a subscription
 */
export async function createCheckoutSessionAction(
  data: CheckoutSession
): Promise<CheckoutSessionResponse | { error: string }> {
  const session = await getServerSession(authOptions)

  if (!session) {
    return { error: 'Authentication required' }
  }

  try {
    const apiClient = await getApiClient(session)

    const response = await apiClient.subscriptions.subscriptionsCreateCheckoutCreate(data)

    return response
  } catch (error) {
    console.error('Failed to create checkout session:', error)
    if (error instanceof ApiError) {
      console.error('API Error:', error.body)
      return { error: error.body?.error || 'Failed to create checkout session' }
    }
    return { error: 'Failed to create checkout session' }
  }
}

/**
 * Create a Stripe customer portal session for billing management
 */
export async function createPortalSessionAction(): Promise<PortalSessionResponse | { error: string }> {
  const session = await getServerSession(authOptions)

  if (!session) {
    return { error: 'Authentication required' }
  }

  try {
    const apiClient = await getApiClient(session)

    const response = await apiClient.subscriptions.subscriptionsCreatePortalCreate()

    return response
  } catch (error) {
    console.error('Failed to create portal session:', error)
    if (error instanceof ApiError) {
      console.error('API Error:', error.body)
      return { error: error.body?.error || 'Failed to create portal session' }
    }
    return { error: 'Failed to create portal session' }
  }
}

/**
 * Get current user's subscription
 */
export async function getCurrentSubscriptionAction(): Promise<Subscription | { error: string } | null> {
  const session = await getServerSession(authOptions)

  if (!session) {
    return { error: 'Authentication required' }
  }

  try {
    const apiClient = await getApiClient(session)

    const response = await apiClient.subscriptions.subscriptionsCurrentRetrieve()

    return response
  } catch (error) {
    console.error('Failed to get current subscription:', error)
    if (error instanceof ApiError) {
      // If subscription not found, return null instead of error
      if (error.status === 404) {
        return null
      }
      console.error('API Error:', error.body)
      return { error: error.body?.error || 'Failed to get subscription' }
    }
    return { error: 'Failed to get subscription' }
  }
}

/**
 * Cancel current subscription at period end
 */
export async function cancelSubscriptionAction(): Promise<{ success: boolean; message?: string; error?: string }> {
  const session = await getServerSession(authOptions)

  if (!session) {
    return { success: false, error: 'Authentication required' }
  }

  try {
    const apiClient = await getApiClient(session)

    const response = await apiClient.subscriptions.subscriptionsCancelCreate()

    return { 
      success: true, 
      message: response.message || 'Subscription scheduled for cancellation' 
    }
  } catch (error) {
    console.error('Failed to cancel subscription:', error)
    if (error instanceof ApiError) {
      console.error('API Error:', error.body)
      return { 
        success: false, 
        error: error.body?.error || 'Failed to cancel subscription' 
      }
    }
    return { success: false, error: 'Failed to cancel subscription' }
  }
}