'use client'

import { useEffect, useState } from 'react'
import { 
  getStripeConnectAccountAction,
  createStripeConnectAccountAction,
  createAccountLinkAction,
  refreshStripeConnectStatusAction,
  createDashboardLoginLinkAction,
  type StripeConnectAccount
} from '@/actions/stripe-connect-action'

type ConnectStatus = 'not_connected' | 'pending' | 'connected' | 'restricted'

export function StripeConnectSection() {
  const [isLoading, setIsLoading] = useState(false)
  const [isInitialLoading, setIsInitialLoading] = useState(true)
  const [connectStatus, setConnectStatus] = useState<ConnectStatus>('not_connected')
  const [accountData, setAccountData] = useState<StripeConnectAccount | null>(null)
  const [error, setError] = useState<string | null>(null)

  // Load account data on component mount and handle URL parameters
  useEffect(() => {
    loadAccountData()
    
    // Handle URL parameters from Stripe onboarding
    const urlParams = new URLSearchParams(window.location.search)
    const success = urlParams.get('success')
    const refresh = urlParams.get('refresh')
    
    if (success === 'true') {
      // Clean up URL and show success message
      window.history.replaceState({}, document.title, window.location.pathname)
      // Account data will be loaded automatically, status will update
    }
    
    if (refresh === 'true') {
      // Clean up URL and refresh account status
      window.history.replaceState({}, document.title, window.location.pathname)
      setTimeout(async () => {
        // Refresh account status
        try {
          await refreshStripeConnectStatusAction()
          await loadAccountData()
        } catch (err) {
          console.error('Error refreshing on URL param:', err)
        }
      }, 1000) // Small delay to ensure user sees the refresh action
    }
  }, [])

  const loadAccountData = async () => {
    setIsInitialLoading(true)
    setError(null)
    
    try {
      const result = await getStripeConnectAccountAction()
      
      if (result && 'error' in result) {
        setError(result.error)
        setConnectStatus('not_connected')
        setAccountData(null)
      } else if (result) {
        setAccountData(result)
        // Determine status based on account data
        if (result.charges_enabled && result.payouts_enabled) {
          setConnectStatus('connected')
        } else if (result.details_submitted) {
          setConnectStatus('pending')
        } else {
          setConnectStatus('restricted')
        }
      } else {
        // Account doesn't exist yet
        setConnectStatus('not_connected')
        setAccountData(null)
      }
    } catch (err) {
      console.error('Error loading account data:', err)
      setError('Failed to load account information')
      setConnectStatus('not_connected')
    } finally {
      setIsInitialLoading(false)
    }
  }

  const handleConnectStripe = async () => {
    setIsLoading(true)
    setError(null)
    
    try {
      // First create the account if it doesn't exist
      if (connectStatus === 'not_connected') {
        const createResult = await createStripeConnectAccountAction()
        
        if (createResult && 'error' in createResult) {
          setError(createResult.error)
          return
        }
      }
      
      // Create account link for onboarding
      const linkResult = await createAccountLinkAction({
        refresh_url: `${window.location.origin}/settings?refresh=true`,
        return_url: `${window.location.origin}/settings?success=true`,
        type: 'account_onboarding' as any // Type will be fixed when backend types are updated
      })
      
      if (linkResult && 'error' in linkResult) {
        setError(linkResult.error)
        return
      }
      
      if (linkResult.url) {
        // Redirect to Stripe onboarding
        window.location.href = linkResult.url
      }
    } catch (err) {
      console.error('Error connecting Stripe:', err)
      setError('Failed to initiate Stripe connection')
    } finally {
      setIsLoading(false)
    }
  }

  const handleGoToDashboard = async () => {
    setIsLoading(true)
    setError(null)
    
    try {
      const result = await createDashboardLoginLinkAction()
      
      if (result && 'error' in result) {
        setError(result.error)
        return
      }
      
      if (result.url) {
        window.open(result.url, '_blank')
      }
    } catch (err) {
      console.error('Error creating dashboard link:', err)
      setError('Failed to open Stripe dashboard')
    } finally {
      setIsLoading(false)
    }
  }

  const handleRefreshStatus = async () => {
    setIsLoading(true)
    setError(null)
    
    try {
      const result = await refreshStripeConnectStatusAction()
      
      if (result && 'error' in result) {
        setError(result.error)
        return
      }
      
      // Reload account data after refresh
      await loadAccountData()
    } catch (err) {
      console.error('Error refreshing status:', err)
      setError('Failed to refresh account status')
    } finally {
      setIsLoading(false)
    }
  }

  const handleDisconnect = async () => {
    if (confirm('Are you sure you want to disconnect your Stripe account? This will prevent you from receiving payments.')) {
      // Note: Stripe Connect accounts cannot be programmatically deleted
      // Users need to do this through the Stripe Dashboard
      alert('To disconnect your Stripe account, please contact support or manage it through your Stripe Dashboard.')
    }
  }

  const getStatusBadge = (status: ConnectStatus) => {
    const badges = {
      not_connected: (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
          Not Connected
        </span>
      ),
      pending: (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
          Pending Setup
        </span>
      ),
      connected: (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
          Connected
        </span>
      ),
      restricted: (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
          Incomplete
        </span>
      )
    }
    return badges[status]
  }

  // Show loading state initially
  if (isInitialLoading) {
    return (
      <div className="space-y-6">
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="animate-pulse">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gray-200 rounded-lg"></div>
              <div className="flex-1">
                <div className="h-4 bg-gray-200 rounded w-1/4 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (connectStatus === 'not_connected') {
    return (
      <div className="space-y-6">
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-red-800">{error}</p>
              </div>
            </div>
          </div>
        )}

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-blue-800">
                Connect your Stripe account
              </h3>
              <div className="mt-2 text-sm text-blue-700">
                <p>
                  To receive payments from customers, you'll need to connect your Stripe account. 
                  This allows us to securely process payments and transfer funds to you.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <h4 className="text-sm font-medium text-gray-900 mb-2">What happens when you connect:</h4>
            <ul className="text-sm text-gray-600 space-y-1 list-disc list-inside">
              <li>Customers can purchase your products directly</li>
              <li>Payments are processed securely through Stripe</li>
              <li>Funds are transferred to your account (minus platform fee)</li>
              <li>You get access to detailed transaction reports</li>
            </ul>
          </div>

          <div className="flex space-x-3">
            <button
              onClick={handleConnectStripe}
              disabled={isLoading}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Connecting...
                </>
              ) : (
                <>
                  <svg className="-ml-1 mr-2 h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                  </svg>
                  Connect Stripe Account
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Account Status Card */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <div className="flex items-start justify-between">
          <div className="flex items-start space-x-3">
            <div className="flex-shrink-0">
              <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-purple-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M4 4a2 2 0 00-2 2v4a2 2 0 002 2V6h10a2 2 0 00-2-2H4zm2 6a2 2 0 012-2h8a2 2 0 012 2v4a2 2 0 01-2 2H8a2 2 0 01-2-2v-4zm6 4a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                </svg>
              </div>
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center space-x-2">
                <h3 className="text-lg font-medium text-gray-900">Stripe Account</h3>
                {getStatusBadge(connectStatus)}
              </div>
              {accountData && (connectStatus === 'connected' || connectStatus === 'pending') && (
                <div className="mt-2 space-y-1">
                  {(accountData as any).business_name && (
                    <p className="text-sm text-gray-600">
                      <span className="font-medium">Business:</span> {(accountData as any).business_name}
                    </p>
                  )}
                  {accountData.email && (
                    <p className="text-sm text-gray-600">
                      <span className="font-medium">Email:</span> {accountData.email}
                    </p>
                  )}
                  {accountData.country && (
                    <p className="text-sm text-gray-600">
                      <span className="font-medium">Country:</span> {accountData.country}
                    </p>
                  )}
                  <p className="text-sm text-gray-600">
                    <span className="font-medium">Account ID:</span> {accountData.stripe_account_id}
                  </p>
                </div>
              )}
            </div>
          </div>
          <button
            onClick={handleRefreshStatus}
            disabled={isLoading}
            className="text-gray-400 hover:text-gray-600 disabled:opacity-50"
            title="Refresh status"
          >
            <svg className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
            </svg>
          </button>
        </div>
      </div>

      {/* Capabilities Status */}
      {accountData && (connectStatus === 'connected' || connectStatus === 'pending') && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <div className="flex items-center">
              <div className={`flex-shrink-0 w-2 h-2 rounded-full mr-2 ${accountData.charges_enabled ? 'bg-purple-400' : 'bg-red-400'}`}></div>
              <span className="text-sm font-medium text-gray-900">Accept Payments</span>
            </div>
            <p className="mt-1 text-xs text-gray-500">
              {accountData.charges_enabled ? 'Enabled' : 'Disabled - Complete account setup'}
            </p>
          </div>
          
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <div className="flex items-center">
              <div className={`flex-shrink-0 w-2 h-2 rounded-full mr-2 ${accountData.payouts_enabled ? 'bg-purple-400' : 'bg-red-400'}`}></div>
              <span className="text-sm font-medium text-gray-900">Receive Payouts</span>
            </div>
            <p className="mt-1 text-xs text-gray-500">
              {accountData.payouts_enabled ? 'Enabled' : 'Disabled - Complete account setup'}
            </p>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex flex-wrap gap-3">
        {connectStatus === 'connected' && (
          <>
            <button
              onClick={handleGoToDashboard}
              className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
            >
              <svg className="-ml-1 mr-2 h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M12.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
              View Stripe Dashboard
            </button>
            
            <button
              onClick={handleDisconnect}
              disabled={isLoading}
              className="inline-flex items-center px-4 py-2 border border-red-300 text-sm font-medium rounded-md shadow-sm text-red-700 bg-white hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <svg className="-ml-1 mr-2 h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" clipRule="evenodd" />
                <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3l1.293-1.293a1 1 0 011.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 011.414-1.414L9 9V6a1 1 0 011-1z" clipRule="evenodd" />
                <path fillRule="evenodd" d="M3 5a2 2 0 012-2h1a1 1 0 010 2H5v6h2l1 2H5a2 2 0 01-2-2V5zM15 5a2 2 0 00-2-2h-1a1 1 0 000 2h1v6h-2l-1 2h3a2 2 0 002-2V5z" clipRule="evenodd" />
              </svg>
              Disconnect Account
            </button>
          </>
        )}

        {(connectStatus === 'pending' || connectStatus === 'restricted') && (
          <>
            <div className="w-full mb-4">
              {connectStatus === 'restricted' ? (
                <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <svg className="h-5 w-5 text-orange-400" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <h3 className="text-sm font-medium text-orange-800">
                        Account Setup Incomplete
                      </h3>
                      <div className="mt-2 text-sm text-orange-700">
                        <p>Your Stripe account needs additional information to start accepting payments. Click "Complete Setup" below to continue where you left off.</p>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <h3 className="text-sm font-medium text-blue-800">
                        Setup In Progress
                      </h3>
                      <div className="mt-2 text-sm text-blue-700">
                        <p>Continue setting up your Stripe account to start receiving payments.</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
            
            <button
              onClick={handleConnectStripe}
              disabled={isLoading}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Loading...
                </>
              ) : (
                <>
                  <svg className="-ml-1 mr-2 h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  {connectStatus === 'restricted' ? 'Complete Setup' : 'Continue Setup'}
                </>
              )}
            </button>
          </>
        )}
      </div>

      {/* Recent Transactions Preview */}
      {connectStatus === 'connected' && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">          <div className="mb-4">
            <h4 className="text-lg font-medium text-gray-900">Recent Activity</h4>
          </div>
          <div className="text-sm text-gray-500">
            Transaction history will appear here once you start receiving payments.
          </div>
        </div>
      )}
    </div>
  )
}