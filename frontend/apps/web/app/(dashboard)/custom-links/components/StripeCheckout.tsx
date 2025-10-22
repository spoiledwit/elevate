'use client'

import { useEffect, useState } from 'react'
import { loadStripe } from '@stripe/stripe-js'
import { EmbeddedCheckoutProvider, EmbeddedCheckout } from '@stripe/react-stripe-js'
import { X } from 'lucide-react'

interface StripeCheckoutProps {
  /**
   * Client secret from Stripe Checkout Session (for embedded mode)
   * Backend should create session with ui_mode: 'embedded'
   */
  clientSecret?: string

  /**
   * Your Stripe publishable key
   * Should be stored in environment variables
   */
  publishableKey: string

  /**
   * Callback when user completes the payment
   */
  onComplete?: (sessionId?: string) => void

  /**
   * Callback when user cancels/closes the checkout
   */
  onCancel?: () => void

  /**
   * Whether to show the checkout modal
   */
  isOpen: boolean
}

/**
 * StripeCheckout Component
 *
 * This component renders Stripe checkout inline instead of redirecting.
 *
 * SETUP REQUIREMENTS:
 * 1. Install packages: pnpm add @stripe/stripe-js @stripe/react-stripe-js --filter web
 * 2. Add NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY to your .env file
 *
 * BACKEND REQUIREMENTS FOR EMBEDDED MODE:
 * To use the proper embedded checkout (recommended), update your backend to:
 * 1. Create Stripe Checkout Session with ui_mode: 'embedded'
 * 2. Return { client_secret: session.client_secret } instead of checkout_url
 *
 * Example backend code:
 * ```python
 * session = stripe.checkout.Session.create(
 *   ui_mode='embedded',
 *   line_items=[...],
 *   mode='payment',
 *   return_url=your_return_url,
 * )
 * return { 'client_secret': session.client_secret }
 * ```
 *
 * FALLBACK MODE:
 * If backend only returns checkout_url, this component will render it in an iframe
 * (not recommended by Stripe, but works as a temporary solution)
 */
export function StripeCheckout({
  clientSecret,
  publishableKey,
  onComplete,
  onCancel,
  isOpen
}: StripeCheckoutProps) {
  const [stripePromise, setStripePromise] = useState<Promise<any> | null>(null)
  const [paymentComplete, setPaymentComplete] = useState(false)

  useEffect(() => {
    if (publishableKey && isOpen) {
      setStripePromise(loadStripe(publishableKey))
    }
  }, [publishableKey, isOpen, clientSecret])

  // Cleanup on unmount
  useEffect(() => {
    if (!isOpen) {
      setPaymentComplete(false)
    }
  }, [isOpen])

  if (!isOpen) return null

  const handleClose = () => {
    onCancel?.()
  }

  // Show success state when payment is complete
  if (paymentComplete) {
    return (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md">
          <div className="text-center">
            {/* Success Checkmark */}
            <div className="mb-6">
              <div className="mx-auto flex items-center justify-center h-20 w-20 rounded-full bg-green-100">
                <svg
                  className="h-12 w-12 text-green-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={3}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>
            </div>

            <h3 className="text-2xl font-bold text-gray-900 mb-2">
              Purchase Successful!
            </h3>
            <p className="text-gray-600 mb-6">
              Your payment has been processed successfully.
            </p>

            <button
              onClick={() => {
                setPaymentComplete(false)
                onComplete?.()
              }}
              className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
            >
              Continue
            </button>
          </div>
        </div>
      </div>
    )
  }

  // Always show the modal with checkout skeleton or actual checkout
  // This provides a smooth UX without any flashing states
  if (isOpen) {
    return (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden relative">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gray-50">
            <h2 className="text-xl font-semibold text-gray-900">Complete Your Purchase</h2>
            <button
              onClick={handleClose}
              className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
              aria-label="Close checkout"
            >
              <X className="w-5 h-5 text-gray-600" />
            </button>
          </div>

          {/* Embedded Checkout or Skeleton */}
          <div className="overflow-y-auto max-h-[calc(90vh-73px)]">
            {clientSecret && stripePromise ? (
              <EmbeddedCheckoutProvider
                stripe={stripePromise}
                options={{
                  clientSecret,
                  onComplete: () => {
                    // Show success state instead of redirecting
                    setPaymentComplete(true)
                  }
                }}
              >
                <EmbeddedCheckout className="stripe-embedded-checkout" />
              </EmbeddedCheckoutProvider>
            ) : (
              /* Checkout Skeleton - shown while loading */
              <div className="p-6 space-y-6 animate-pulse">
                {/* Email field skeleton */}
                <div>
                  <div className="h-4 bg-gray-200 rounded w-24 mb-2"></div>
                  <div className="h-12 bg-gray-200 rounded"></div>
                </div>

                {/* Card information skeleton */}
                <div>
                  <div className="h-4 bg-gray-200 rounded w-32 mb-2"></div>
                  <div className="h-12 bg-gray-200 rounded"></div>
                </div>

                {/* Name field skeleton */}
                <div>
                  <div className="h-4 bg-gray-200 rounded w-28 mb-2"></div>
                  <div className="h-12 bg-gray-200 rounded"></div>
                </div>

                {/* Country/Region skeleton */}
                <div>
                  <div className="h-4 bg-gray-200 rounded w-36 mb-2"></div>
                  <div className="h-12 bg-gray-200 rounded"></div>
                </div>

                {/* Pay button skeleton */}
                <div className="h-12 bg-gray-300 rounded"></div>

                {/* Powered by Stripe */}
                <div className="flex items-center justify-center gap-2 pt-4">
                  <div className="h-4 bg-gray-200 rounded w-20"></div>
                  <div className="h-4 bg-gray-200 rounded w-12"></div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    )
  }

  // If modal is not open, don't render anything
  return null
}
