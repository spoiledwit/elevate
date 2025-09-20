'use client'

import { useEffect, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { getPlansAction, getCurrentSubscriptionAction, createPortalSessionAction } from '@/actions'
import { PricingPlans } from '@/components/landing/pricing-plans'
import type { PaginatedPlanList, Subscription } from '@frontend/types/api'
import { CheckCircle, XCircle, ExternalLink, CreditCard, Calendar, AlertCircle } from 'lucide-react'

export default function SubscriptionPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [plansData, setPlansData] = useState<PaginatedPlanList | null>(null)
  const [currentSubscription, setCurrentSubscription] = useState<Subscription | { error: string } | null>(null)
  const [loading, setLoading] = useState(true)
  const [showNotification, setShowNotification] = useState(false)
  const [notificationType, setNotificationType] = useState<'success' | 'error' | null>(null)
  const [portalLoading, setPortalLoading] = useState(false)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [plans, subscription] = await Promise.all([
          getPlansAction(),
          getCurrentSubscriptionAction()
        ])
        setPlansData(plans)
        setCurrentSubscription(subscription)
      } catch (error) {
        console.error('Error fetching subscription data:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  useEffect(() => {
    const success = searchParams.get('success')
    const canceled = searchParams.get('canceled')

    if (success === 'true') {
      setNotificationType('success')
      setShowNotification(true)
      // Remove the parameter from URL
      router.replace('/subscription', { scroll: false })
    } else if (canceled === 'true') {
      setNotificationType('error')
      setShowNotification(true)
      // Remove the parameter from URL
      router.replace('/subscription', { scroll: false })
    }
  }, [searchParams, router])

  const handlePortalClick = async () => {
    setPortalLoading(true)
    try {
      const result = await createPortalSessionAction()

      if ('error' in result) {
        alert(`Error: ${result.error}`)
        return
      }

      // Redirect to Stripe Customer Portal
      window.location.href = result.portal_url
    } catch (error) {
      console.error('Error creating portal session:', error)
      alert('Failed to open billing portal. Please try again.')
    } finally {
      setPortalLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex-1 bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading subscription data...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 bg-gray-50">
      {/* Success/Error Notifications */}
      {showNotification && (
        <div className="fixed top-4 right-4 z-50 max-w-md">
          <div className={`p-4 rounded-lg shadow-lg border ${notificationType === 'success'
            ? 'bg-green-50 border-green-200 text-green-800'
            : 'bg-red-50 border-red-200 text-red-800'
            }`}>
            <div className="flex items-start gap-3">
              {notificationType === 'success' ? (
                <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
              ) : (
                <XCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
              )}
              <div className="flex-1">
                <h4 className="font-medium">
                  {notificationType === 'success' ? 'Subscription Successful!' : 'Subscription Canceled'}
                </h4>
                <p className="text-sm mt-1">
                  {notificationType === 'success'
                    ? 'Your subscription has been activated successfully. You now have access to all plan features.'
                    : 'You canceled the subscription process. No charges have been made to your account.'
                  }
                </p>
              </div>
              <button
                onClick={() => setShowNotification(false)}
                className="text-gray-400 hover:text-gray-600 ml-2"
              >
                <XCircle className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="p-6">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Subscription Plans
            </h1>
            <p className="text-gray-600">
              Choose the perfect plan for your creator business
            </p>
          </div>

          {/* Current Subscription Details */}
          {currentSubscription && !('error' in currentSubscription) && (
            <div className="mb-8 bg-white rounded-lg border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-gray-900">Current Subscription</h2>
                <button
                  onClick={handlePortalClick}
                  disabled={portalLoading}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-brand-600 text-white rounded-lg hover:bg-brand-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {portalLoading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      Loading...
                    </>
                  ) : (
                    <>
                      <CreditCard className="w-4 h-4" />
                      Manage Billing
                      <ExternalLink className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                    <CreditCard className="w-5 h-5 text-brand-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Plan</p>
                    <p className="font-semibold text-gray-900">
                      {currentSubscription.plan?.name || 'Active Subscription'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${currentSubscription.status === 'ACTIVE' ? 'bg-green-100' :
                    currentSubscription.status === 'TRIALING' ? 'bg-blue-100' :
                      'bg-yellow-100'
                    }`}>
                    <div className={`w-3 h-3 rounded-full ${currentSubscription.status === 'ACTIVE' ? 'bg-green-500' :
                      currentSubscription.status === 'TRIALING' ? 'bg-blue-500' :
                        'bg-yellow-500'
                      }`}></div>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Status</p>
                    <p className="font-semibold text-gray-900 capitalize">
                      {currentSubscription.status?.toLowerCase().replace('_', ' ')}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                    <Calendar className="w-5 h-5 text-gray-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">
                      {currentSubscription.is_trialing ? 'Trial Ends' : 'Next Billing'}
                    </p>
                    <p className="font-semibold text-gray-900">
                      {currentSubscription.current_period_end
                        ? new Date(currentSubscription.current_period_end).toLocaleDateString()
                        : 'N/A'
                      }
                    </p>
                  </div>
                </div>
              </div>

              {currentSubscription.canceled_at && (
                <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg flex items-start gap-2">
                  <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-yellow-800">Subscription Canceled</p>
                    <p className="text-sm text-yellow-700">
                      Your subscription is scheduled to end on {' '}
                      {currentSubscription.current_period_end
                        ? new Date(currentSubscription.current_period_end).toLocaleDateString()
                        : 'the next billing date'
                      }. You'll retain access until then.
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* No Subscription Message */}
          {(!currentSubscription || ('error' in currentSubscription)) && (
            <div className="mb-8 bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium text-blue-800">No Active Subscription</p>
                  <p className="text-sm text-blue-700">
                    You're currently on the free plan. Upgrade to unlock premium features and grow your creator business.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Pricing Plans */}
          <PricingPlans
            plansData={plansData}
            isDashboard={true}
            currentSubscription={currentSubscription}
          />
        </div>
      </div>
    </div>
  )
}