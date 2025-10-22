'use client'

import { useState, useEffect } from 'react'
import { loadStripe, StripeElementsOptions } from '@stripe/stripe-js'
import {
  Elements,
  PaymentElement,
  useStripe,
  useElements
} from '@stripe/react-stripe-js'

interface InlineStripePaymentProps {
  clientSecret: string
  publishableKey: string
  amount: number
  currency: string
  onSuccess: () => void
  onError: (error: string) => void
}

/**
 * Payment Form Component
 * This sits inside the Elements provider and handles the payment submission
 */
function PaymentForm({ onSuccess, onError }: { onSuccess: () => void; onError: (error: string) => void }) {
  const stripe = useStripe()
  const elements = useElements()
  const [isProcessing, setIsProcessing] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()

    if (!stripe || !elements) {
      return
    }

    setIsProcessing(true)
    setErrorMessage(null)

    try {
      const { error, paymentIntent } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          // We don't need return_url since we're handling everything inline
          return_url: window.location.href,
        },
        redirect: 'if_required', // Only redirect if absolutely necessary
      })

      if (error) {
        setErrorMessage(error.message || 'Payment failed')
        onError(error.message || 'Payment failed')
      } else if (paymentIntent && paymentIntent.status === 'succeeded') {
        onSuccess()
      }
    } catch (err) {
      setErrorMessage('An unexpected error occurred')
      onError('An unexpected error occurred')
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Payment Element with tabs layout */}
      <div className="stripe-payment-element">
        <PaymentElement
          options={{
            layout: {
              type: 'tabs',
              defaultCollapsed: false,
              radios: false,
              spacedAccordionItems: false
            },
            wallets: {
              applePay: 'auto',
              googlePay: 'auto'
            },
            fields: {
              billingDetails: {
                address: {
                  country: 'auto' // Auto-detect country for location-based payment methods
                }
              }
            }
          }}
        />
      </div>

      {/* Error message */}
      {errorMessage && (
        <div className="text-red-600 text-sm p-3 bg-red-50 rounded-lg">
          {errorMessage}
        </div>
      )}

      {/* Submit button */}
      <button
        type="submit"
        disabled={!stripe || isProcessing}
        className="w-full bg-brand-600 hover:bg-brand-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isProcessing ? 'Processing...' : 'Pay Now'}
      </button>
    </form>
  )
}

/**
 * Inline Stripe Payment Component
 * Shows payment fields inline in the form, not in a popup
 */
export function InlineStripePayment({
  clientSecret,
  publishableKey,
  amount,
  currency,
  onSuccess,
  onError
}: InlineStripePaymentProps) {
  const [stripePromise, setStripePromise] = useState<Promise<any> | null>(null)

  useEffect(() => {
    if (publishableKey) {
      setStripePromise(loadStripe(publishableKey))
    }
  }, [publishableKey])

  if (!clientSecret || !stripePromise) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-12 bg-gray-200 rounded"></div>
        <div className="h-12 bg-gray-200 rounded"></div>
        <div className="h-12 bg-gray-300 rounded"></div>
      </div>
    )
  }

  const options: StripeElementsOptions = {
    clientSecret,
    appearance: {
      theme: 'stripe',
      variables: {
        colorPrimary: '#7c3aed', // brand-600
        borderRadius: '8px',
        fontFamily: 'system-ui, sans-serif',
      },
    },
    // Allow payment method collection for different regions
    loader: 'auto',
  }

  return (
    <div className="space-y-4">
      {/* Order summary */}
      <div className="bg-gray-50 p-4 rounded-lg">
        <div className="flex justify-between items-center">
          <span className="text-gray-700 font-medium">Total</span>
          <span className="text-2xl font-bold text-brand-600">
            ${amount} {currency.toUpperCase()}
          </span>
        </div>
      </div>

      {/* Stripe Elements Provider */}
      <Elements stripe={stripePromise} options={options}>
        <PaymentForm onSuccess={onSuccess} onError={onError} />
      </Elements>

      {/* Powered by Stripe badge */}
      <div className="text-center text-sm text-gray-500">
        <span>Secured by </span>
        <span className="font-semibold">Stripe</span>
      </div>
    </div>
  )
}
