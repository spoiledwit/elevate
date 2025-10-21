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
   * Checkout URL from Stripe (for iframe fallback)
   * This is what the current backend returns
   */
  checkoutUrl?: string

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
  checkoutUrl,
  publishableKey,
  onComplete,
  onCancel,
  isOpen
}: StripeCheckoutProps) {
  const [stripePromise, setStripePromise] = useState<Promise<any> | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [hasError, setHasError] = useState(false)

  useEffect(() => {
    if (publishableKey && isOpen) {
      setStripePromise(loadStripe(publishableKey))
    }
  }, [publishableKey, isOpen])

  useEffect(() => {
    if (!isOpen) {
      setIsLoading(true)
      setHasError(false)
      return
    }

    // Reset loading state after a timeout to prevent infinite loading
    const loadingTimeout = setTimeout(() => {
      setIsLoading(false)
    }, 3000) // Give iframe 3 seconds to load

    // Listen for messages from Stripe iframe (for iframe fallback mode)
    const handleMessage = (event: MessageEvent) => {
      // Only accept messages from Stripe
      if (event.origin !== 'https://checkout.stripe.com') return

      // Handle checkout completion
      if (event.data?.type === 'stripe-checkout-complete') {
        onComplete?.(event.data.sessionId)
      }
    }

    window.addEventListener('message', handleMessage)
    return () => {
      window.removeEventListener('message', handleMessage)
      clearTimeout(loadingTimeout)
    }
  }, [isOpen, onComplete])

  if (!isOpen) return null

  const handleClose = () => {
    onCancel?.()
  }

  // Render embedded checkout if clientSecret is provided (recommended approach)
  if (clientSecret && stripePromise) {
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

          {/* Embedded Checkout */}
          <div className="overflow-y-auto max-h-[calc(90vh-73px)]">
            <EmbeddedCheckoutProvider
              stripe={stripePromise}
              options={{
                clientSecret,
                onComplete: () => {
                  onComplete?.()
                }
              }}
            >
              <EmbeddedCheckout />
            </EmbeddedCheckoutProvider>
          </div>
        </div>
      </div>
    )
  }

  // Fallback: Render iframe if only checkoutUrl is provided
  // NOTE: This is not the recommended approach but works with current backend
  if (checkoutUrl) {
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

          {/* Loading indicator */}
          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-white z-10">
              <div className="text-center">
                <div className="inline-block w-8 h-8 border-4 border-brand-600 border-t-transparent rounded-full animate-spin mb-4"></div>
                <p className="text-gray-600">Loading checkout...</p>
              </div>
            </div>
          )}

          {/* Stripe Checkout iframe */}
          <iframe
            src={checkoutUrl}
            className="w-full h-[calc(90vh-73px)] border-0"
            onLoad={() => {
              setIsLoading(false)
              setHasError(false)
            }}
            onError={() => {
              setIsLoading(false)
              setHasError(true)
            }}
            title="Stripe Checkout"
            allow="payment"
            sandbox="allow-scripts allow-forms allow-same-origin allow-popups"
          />
        </div>
      </div>
    )
  }

  // No checkout data provided
  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md">
        <div className="text-center">
          <div className="text-red-600 mb-4">
            <X className="w-16 h-16 mx-auto" />
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">Checkout Error</h3>
          <p className="text-gray-600 mb-6">
            No checkout session available. Please try again.
          </p>
          <button
            onClick={handleClose}
            className="w-full bg-brand-600 hover:bg-brand-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}
