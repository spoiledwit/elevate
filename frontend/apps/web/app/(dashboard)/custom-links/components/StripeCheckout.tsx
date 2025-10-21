'use client'

import { useEffect, useState, useRef } from 'react'
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
  const [error, setError] = useState<string | null>(null)
  const checkoutRef = useRef<HTMLDivElement>(null)
  const embeddedCheckoutRef = useRef<any>(null)

  useEffect(() => {
    if (publishableKey && isOpen) {
      setStripePromise(loadStripe(publishableKey))
    }
  }, [publishableKey, isOpen])

  // Handle embedded checkout with checkoutUrl using initEmbeddedCheckout (fallback for old endpoint)
  useEffect(() => {
    if (!isOpen || !checkoutUrl || clientSecret || !publishableKey) {
      return
    }

    let mounted = true

    const initializeEmbeddedCheckout = async () => {
      try {
        setIsLoading(true)
        setError(null)

        const stripe = await loadStripe(publishableKey)
        if (!stripe || !mounted) return

        // Try to extract client secret from the checkout URL
        // Checkout URLs from Stripe typically contain the session ID (client secret)
        // Format: https://checkout.stripe.com/c/pay/cs_test_xxx or cs_live_xxx
        const sessionMatch = checkoutUrl.match(/cs_[a-zA-Z0-9_]+/)

        if (!sessionMatch) {
          throw new Error(
            'Unable to embed checkout: The checkout URL does not contain a valid session ID. ' +
            'Please update your backend to return the client_secret from the Stripe session instead.'
          )
        }

        const clientSecretFromUrl = sessionMatch[0]

        // Mount embedded checkout using initEmbeddedCheckout
        const checkout = await stripe.initEmbeddedCheckout({
          clientSecret: clientSecretFromUrl,
        })

        if (mounted && checkoutRef.current) {
          embeddedCheckoutRef.current = checkout
          checkout.mount(checkoutRef.current)
          setIsLoading(false)
        }
      } catch (err) {
        if (mounted) {
          console.error('Failed to initialize embedded checkout:', err)
          setError(err instanceof Error ? err.message : 'Failed to load checkout')
          setIsLoading(false)
        }
      }
    }

    initializeEmbeddedCheckout()

    return () => {
      mounted = false
      if (embeddedCheckoutRef.current) {
        embeddedCheckoutRef.current.destroy()
        embeddedCheckoutRef.current = null
      }
    }
  }, [isOpen, checkoutUrl, clientSecret, publishableKey])

  // Cleanup on unmount
  useEffect(() => {
    if (!isOpen) {
      setIsLoading(true)
      setError(null)
      if (embeddedCheckoutRef.current) {
        embeddedCheckoutRef.current.destroy()
        embeddedCheckoutRef.current = null
      }
    }
  }, [isOpen])

  if (!isOpen) return null

  const handleClose = () => {
    onCancel?.()
  }

  // Render embedded checkout if clientSecret is provided (recommended approach)
  // This works when backend creates session with ui_mode='embedded' and returns client_secret
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

  // Fallback: Use checkoutUrl with initEmbeddedCheckout
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

          {/* Content Area */}
          <div className="overflow-y-auto max-h-[calc(90vh-73px)] relative">
            {/* Loading State */}
            {isLoading && !error && (
              <div className="flex items-center justify-center p-12">
                <div className="text-center">
                  <div className="inline-block w-10 h-10 border-4 border-brand-600 border-t-transparent rounded-full animate-spin mb-4"></div>
                  <p className="text-gray-600">Loading checkout...</p>
                </div>
              </div>
            )}

            {/* Error State */}
            {error && (
              <div className="p-8">
                <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
                  <div className="text-red-600 mb-3">
                    <X className="w-12 h-12 mx-auto" />
                  </div>
                  <h3 className="text-lg font-semibold text-red-900 mb-2">Checkout Error</h3>
                  <p className="text-red-700 mb-4">{error}</p>
                  <p className="text-sm text-red-600 mb-4">
                    Your backend needs to create a Stripe Checkout Session with <code>ui_mode='embedded'</code>
                    and return the <code>client_secret</code> instead of a checkout URL.
                  </p>
                  <button
                    onClick={handleClose}
                    className="bg-red-600 hover:bg-red-700 text-white font-semibold py-2 px-6 rounded-lg transition-colors"
                  >
                    Close
                  </button>
                </div>
              </div>
            )}

            {/* Embedded Checkout Mount Point */}
            <div ref={checkoutRef} className="min-h-[400px]" />
          </div>
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
