"use client"
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import type { PaginatedPlanList, Subscription } from '@frontend/types/api'
import { createCheckoutSessionAction } from '@/actions'

interface PricingPlansProps {
  plansData: PaginatedPlanList | null
  isDashboard?: boolean
  currentSubscription?: Subscription | { error: string } | null
}

export function PricingPlans({
  plansData,
  isDashboard = false,
  currentSubscription
}: PricingPlansProps) {
  const router = useRouter()
  const [loadingPlanId, setLoadingPlanId] = useState<number | null>(null)

  // Handle button click based on context
  const handleButtonClick = async (planId: number, planName: string) => {
    if (!isDashboard) {
      // Landing page: navigate to get-started
      router.push('/get-started')
      return
    }

    // Dashboard: create checkout session
    setLoadingPlanId(planId)
    try {
      const result = await createCheckoutSessionAction({
        plan_id: planId,
        success_url: `${window.location.origin}/subscription?success=true`,
        cancel_url: `${window.location.origin}/subscription?canceled=true`
      })

      if ('error' in result) {
        alert(`Error: ${result.error}`)
        return
      }

      // Redirect to Stripe checkout
      window.location.href = result.checkout_url
    } catch (error) {
      console.error('Error creating checkout session:', error)
      alert('Failed to start checkout process. Please try again.')
    } finally {
      setLoadingPlanId(null)
    }
  }

  // Check if user has current subscription to this plan
  const isCurrentPlan = (planId: number, isFree: boolean) => {
    // If user has an active subscription, check if it matches this plan
    if (currentSubscription && !('error' in currentSubscription) && currentSubscription.plan) {
      return currentSubscription.plan.id === planId
    }

    // If no subscription and this is dashboard view and plan is free, mark as current
    if (isDashboard && isFree && (!currentSubscription || 'error' in currentSubscription)) {
      return true
    }

    return false
  }

  // Transform API data to match the existing interface
  const plans = plansData?.results?.map((apiPlan) => {
    const price = apiPlan.price === "0.00" ? "$0" : `$${apiPlan.price}`
    const period = apiPlan.billing_period === "YEARLY" ? "per month" : "per month"
    let billing = apiPlan.billing_period === "YEARLY" ? "billed yearly" : "billed monthly"

    // Add trial information if available
    if (apiPlan.trial_period_days && apiPlan.trial_period_days > 0) {
      billing = `${apiPlan.trial_period_days}-day free trial, then ${billing}`
    }

    // Determine styling based on plan features
    const buttonStyle = apiPlan.is_featured
      ? "text-white"
      : "bg-black text-white hover:bg-gray-800"

    const isFree = apiPlan.price === "0.00"

    return {
      id: apiPlan.id,
      name: apiPlan.name,
      price,
      period,
      billing,
      buttonStyle,
      popular: apiPlan.is_featured,
      features: apiPlan.features?.map(feature => feature.feature_name) || [],
      hasTrial: apiPlan.trial_period_days && apiPlan.trial_period_days > 0,
      trialDays: apiPlan.trial_period_days || 0,
      isCurrentPlan: isCurrentPlan(apiPlan.id, isFree),
      isFree
    }
  }) || []

  return (
    <section className="pb-12 sm:pb-16 lg:pb-20 px-4 sm:px-6 lg:px-8">
      <div className={`max-w-6xl ${isDashboard ? '' : 'mx-auto'}`}>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
          {plans.map((plan) => (
            <div key={plan.name} className="relative">
              {plan.popular && !plan.isCurrentPlan && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 z-10">
                  <span className="text-white px-3 sm:px-4 py-1 rounded-full text-xs sm:text-sm font-medium" style={{backgroundColor: '#714efe'}}>
                    Popular
                  </span>
                </div>
              )}
              {plan.isCurrentPlan && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 z-10">
                  <span className="bg-green-500 text-white px-3 sm:px-4 py-1 rounded-full text-xs sm:text-sm font-medium">
                    Current Plan
                  </span>
                </div>
              )}

              <div className={`bg-white rounded-3xl border border-gray-600 p-4 sm:p-6 lg:p-8 h-full flex flex-col`}>
                <div className="mb-4 sm:mb-6">
                  <h3 className="text-xl sm:text-2xl font-bold text-black mb-3 sm:mb-4">{plan.name}</h3>

                  <div className="flex items-baseline mb-2">
                    <span className="text-3xl sm:text-4xl lg:text-5xl font-bold text-black">{plan.price}</span>
                    <span className="ml-2 text-gray-600 text-sm sm:text-base">{plan.period}</span>
                  </div>

                  <p className="text-gray-600 text-xs sm:text-sm">{plan.billing}</p>
                </div>

                <button
                  className={`w-full py-2.5 sm:py-3 rounded-lg font-semibold text-sm sm:text-base lg:text-lg mb-6 sm:mb-8 transition-all ${plan.isCurrentPlan
                    ? 'bg-green-500 text-white cursor-default'
                    : loadingPlanId === plan.id
                      ? 'bg-gray-400 text-white cursor-not-allowed'
                      : plan.buttonStyle
                    }`}
                  style={plan.popular && !plan.isCurrentPlan && loadingPlanId !== plan.id ? {backgroundColor: '#714efe'} : {}}
                  onClick={() => plan.isCurrentPlan ? undefined : handleButtonClick(plan.id, plan.name)}
                  disabled={plan.isCurrentPlan || loadingPlanId === plan.id}
                >
                  {plan.isCurrentPlan ? 'Current Plan' :
                    loadingPlanId === plan.id ? 'Loading...' :
                      isDashboard && !plan.isFree ? 'Upgrade to This Plan' :
                        plan.hasTrial ? `Start ${plan.trialDays}-Day Free Trial` : 'Get Started'}
                </button>

                <div className="flex-1">
                  <h4 className="text-base sm:text-lg font-semibold text-black mb-4 sm:mb-6">Includes</h4>

                  <ul className="space-y-3 sm:space-y-4">
                    {plan.features.map((feature, featureIndex) => (
                      <li key={featureIndex} className="flex items-start gap-2 sm:gap-3">
                        <svg
                          className={`w-4 h-4 sm:w-5 sm:h-5 ${plan.popular ? 'mt-0.5 flex-shrink-0' : 'text-gray-500 mt-0.5 flex-shrink-0'}`}
                          style={plan.popular ? {color: '#714efe'} : {}}
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path
                            fillRule="evenodd"
                            d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                            clipRule="evenodd"
                          />
                        </svg>
                        <span className={`text-xs sm:text-sm ${plan.popular ? 'leading-relaxed' : 'text-gray-700 leading-relaxed'}`} style={plan.popular ? {color: '#714efe'} : {}}>
                          {feature}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}