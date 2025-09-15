'use server'

import { getApiClient } from '@/lib/api'
import { authOptions } from '@/lib/auth'
import { 
  ApiError, 
  type AccountLink,
  type AccountLinkResponse,
  type Balance,
  type CheckoutSessionResponse,
  type ConnectAccountStatus,
  type ConnectEarnings,
  type ConnectWebhookEvent,
  type CreateCheckoutSession,
  type CreateConnectAccount,
  type LoginLinkResponse,
  type PaymentTransaction,
  type RefundRequest,
  type RefundResponse,
  type StripeConnectAccount
} from '@frontend/types/api'
import { getServerSession } from 'next-auth'

/**
 * Get user's Stripe Connect account information
 */
export async function getStripeConnectAccountAction(): Promise<StripeConnectAccount | { error: string } | null> {
  const session = await getServerSession(authOptions)

  if (!session) {
    return { error: 'Authentication required' }
  }

  try {
    const apiClient = await getApiClient(session)
    const response = await apiClient.stripeConnect.stripeConnectAccountRetrieve()
    
    return response
  } catch (error) {
    console.error('Failed to get Connect account:', error)
    if (error instanceof ApiError) {
      // If account not found, return null instead of error
      if (error.status === 404) {
        return null
      }
      console.error('API Error:', error.body)
      return { error: error.body?.error || 'Failed to get Connect account' }
    }
    return { error: 'Failed to get Connect account' }
  }
}

/**
 * Create a new Stripe Connect account for the user
 */
export async function createStripeConnectAccountAction(
  data?: CreateConnectAccount
): Promise<StripeConnectAccount | { error: string }> {
  const session = await getServerSession(authOptions)

  if (!session) {
    return { error: 'Authentication required' }
  }

  try {
    const apiClient = await getApiClient(session)
    const response = await apiClient.stripeConnect.stripeConnectAccountCreate(data)
    
    return response
  } catch (error) {
    console.error('Failed to create Connect account:', error)
    if (error instanceof ApiError) {
      console.error('API Error:', error.body)
      return { error: error.body?.error || 'Failed to create Connect account' }
    }
    return { error: 'Failed to create Connect account' }
  }
}

/**
 * Create an account link for onboarding or account refresh
 */
export async function createAccountLinkAction(
  data: AccountLink
): Promise<AccountLinkResponse | { error: string }> {
  const session = await getServerSession(authOptions)

  if (!session) {
    return { error: 'Authentication required' }
  }

  try {
    const apiClient = await getApiClient(session)
    const response = await apiClient.stripeConnect.stripeConnectAccountLinkCreate(data)
    
    return response
  } catch (error) {
    console.error('Failed to create account link:', error)
    if (error instanceof ApiError) {
      console.error('API Error:', error.body)
      return { error: error.body?.error || 'Failed to create account link' }
    }
    return { error: 'Failed to create account link' }
  }
}

/**
 * Refresh and get the latest account status from Stripe
 */
export async function refreshStripeConnectStatusAction(): Promise<ConnectAccountStatus | { error: string }> {
  const session = await getServerSession(authOptions)

  if (!session) {
    return { error: 'Authentication required' }
  }

  try {
    const apiClient = await getApiClient(session)
    const response = await apiClient.stripeConnect.stripeConnectStatusRetrieve()
    
    return response
  } catch (error) {
    console.error('Failed to refresh Connect status:', error)
    if (error instanceof ApiError) {
      console.error('API Error:', error.body)
      return { error: error.body?.error || 'Failed to refresh status' }
    }
    return { error: 'Failed to refresh status' }
  }
}

/**
 * Check if user needs to complete onboarding
 */
export async function getOnboardingStatusAction(): Promise<{ needs_onboarding: boolean } | { error: string }> {
  const session = await getServerSession(authOptions)

  if (!session) {
    return { error: 'Authentication required' }
  }

  try {
    const apiClient = await getApiClient(session)
    const response = await apiClient.stripeConnect.stripeConnectOnboardingStatusRetrieve()
    
    return response
  } catch (error) {
    console.error('Failed to get onboarding status:', error)
    if (error instanceof ApiError) {
      console.error('API Error:', error.body)
      return { error: error.body?.error || 'Failed to get onboarding status' }
    }
    return { error: 'Failed to get onboarding status' }
  }
}

/**
 * Create Express Dashboard login link
 */
export async function createDashboardLoginLinkAction(): Promise<LoginLinkResponse | { error: string }> {
  const session = await getServerSession(authOptions)

  if (!session) {
    return { error: 'Authentication required' }
  }

  try {
    const apiClient = await getApiClient(session)
    const response = await apiClient.stripeConnect.stripeConnectLoginLinkCreate()
    
    return response
  } catch (error) {
    console.error('Failed to create dashboard login link:', error)
    if (error instanceof ApiError) {
      console.error('API Error:', error.body)
      return { error: error.body?.error || 'Failed to create dashboard link' }
    }
    return { error: 'Failed to create dashboard link' }
  }
}

/**
 * Get Connect account balance
 */
export async function getStripeConnectBalanceAction(): Promise<Balance | { error: string }> {
  const session = await getServerSession(authOptions)

  if (!session) {
    return { error: 'Authentication required' }
  }

  try {
    const apiClient = await getApiClient(session)
    const response = await apiClient.stripeConnect.stripeConnectBalanceRetrieve()
    
    return response
  } catch (error) {
    console.error('Failed to get Connect balance:', error)
    if (error instanceof ApiError) {
      console.error('API Error:', error.body)
      return { error: error.body?.error || 'Failed to get balance' }
    }
    return { error: 'Failed to get balance' }
  }
}

/**
 * Get earnings summary for the seller
 */
export async function getStripeConnectEarningsAction(): Promise<ConnectEarnings | { error: string }> {
  const session = await getServerSession(authOptions)

  if (!session) {
    return { error: 'Authentication required' }
  }

  try {
    const apiClient = await getApiClient(session)
    const response = await apiClient.stripeConnect.stripeConnectEarningsRetrieve()
    
    return response
  } catch (error) {
    console.error('Failed to get Connect earnings:', error)
    if (error instanceof ApiError) {
      console.error('API Error:', error.body)
      return { error: error.body?.error || 'Failed to get earnings' }
    }
    return { error: 'Failed to get earnings' }
  }
}

/**
 * List payment transactions for the authenticated seller
 */
export async function getStripeConnectTransactionsAction(): Promise<Array<PaymentTransaction> | { error: string }> {
  const session = await getServerSession(authOptions)

  if (!session) {
    return { error: 'Authentication required' }
  }

  try {
    const apiClient = await getApiClient(session)
    const response = await apiClient.stripeConnect.stripeConnectTransactionsList()
    
    return response
  } catch (error) {
    console.error('Failed to get Connect transactions:', error)
    if (error instanceof ApiError) {
      console.error('API Error:', error.body)
      return { error: error.body?.error || 'Failed to get transactions' }
    }
    return { error: 'Failed to get transactions' }
  }
}

/**
 * Create a Stripe Checkout session for a product purchase
 */
export async function createProductCheckoutSessionAction(
  data: CreateCheckoutSession
): Promise<CheckoutSessionResponse | { error: string }> {
  const session = await getServerSession(authOptions)

  if (!session) {
    return { error: 'Authentication required' }
  }

  try {
    const apiClient = await getApiClient(session)
    const response = await apiClient.stripeConnect.stripeConnectCheckoutCreate(data)
    
    return response
  } catch (error) {
    console.error('Failed to create product checkout session:', error)
    if (error instanceof ApiError) {
      console.error('API Error:', error.body)
      return { error: error.body?.error || 'Failed to create checkout session' }
    }
    return { error: 'Failed to create checkout session' }
  }
}

/**
 * Process a refund for a payment
 */
export async function createRefundAction(
  data: RefundRequest
): Promise<RefundResponse | { error: string }> {
  const session = await getServerSession(authOptions)

  if (!session) {
    return { error: 'Authentication required' }
  }

  try {
    const apiClient = await getApiClient(session)
    const response = await apiClient.stripeConnect.stripeConnectRefundCreate(data)
    
    return response
  } catch (error) {
    console.error('Failed to create refund:', error)
    if (error instanceof ApiError) {
      console.error('API Error:', error.body)
      return { error: error.body?.error || 'Failed to process refund' }
    }
    return { error: 'Failed to process refund' }
  }
}

/**
 * Get dashboard information for Connect account
 */
export async function getDashboardInfoAction(): Promise<any | { error: string }> {
  const session = await getServerSession(authOptions)

  if (!session) {
    return { error: 'Authentication required' }
  }

  try {
    const apiClient = await getApiClient(session)
    const response = await apiClient.stripeConnect.stripeConnectDashboardInfoRetrieve()
    
    return response
  } catch (error) {
    console.error('Failed to get dashboard info:', error)
    if (error instanceof ApiError) {
      console.error('API Error:', error.body)
      return { error: error.body?.error || 'Failed to get dashboard info' }
    }
    return { error: 'Failed to get dashboard info' }
  }
}

/**
 * Get recent Connect webhook events for debugging
 */
export async function getWebhookEventsAction(): Promise<Array<ConnectWebhookEvent> | { error: string }> {
  const session = await getServerSession(authOptions)

  if (!session) {
    return { error: 'Authentication required' }
  }

  try {
    const apiClient = await getApiClient(session)
    const response = await apiClient.stripeConnect.stripeConnectWebhookEventsList()
    
    return response
  } catch (error) {
    console.error('Failed to get webhook events:', error)
    if (error instanceof ApiError) {
      console.error('API Error:', error.body)
      return { error: error.body?.error || 'Failed to get webhook events' }
    }
    return { error: 'Failed to get webhook events' }
  }
}

// Type exports for convenience
export type { 
  AccountLink,
  AccountLinkResponse,
  Balance,
  CheckoutSessionResponse,
  ConnectAccountStatus,
  ConnectEarnings,
  ConnectWebhookEvent,
  CreateCheckoutSession,
  CreateConnectAccount,
  LoginLinkResponse,
  PaymentTransaction,
  RefundRequest,
  RefundResponse,
  StripeConnectAccount
} from '@frontend/types/api'