'use client'

import { useState, useEffect, useRef } from 'react'
import { ShoppingCart } from 'lucide-react'
import { toast } from 'sonner'
import {
  createOrderAction,
  initializePaymentAction,
  finalizeOrderAction,
  type OrderCreateData
} from '@/actions/storefront-action'
import confetti from 'canvas-confetti'
import { InlineStripePayment } from './InlineStripePayment'

interface CheckoutFormProps {
  linkId?: string
  productType: 'digital' | 'opt_in' | 'url-media' | 'freebie' | 'iframe' | null
  thumbnail: string | null
  title: string
  subtitle?: string
  checkoutTitle?: string
  checkoutDescription?: string
  checkoutBottomTitle?: string
  checkoutCtaButtonText?: string
  price: string
  discountedPrice?: string
  customFields?: Array<{
    label: string
    value: string
  }>
  collectInfoFields: Array<{
    field_type: string
    label: string
    placeholder?: string
    is_required: boolean
    options?: string[]
  }>
  isActive?: boolean
  className?: string
  layout?: 'card' | 'fullpage' | 'mobile' | 'preview'
  checkoutRedirectUrl?: string
  onOrderSuccess?: (orderData: any) => void
}

export function CheckoutForm({
  linkId,
  productType,
  thumbnail,
  title,
  checkoutTitle,
  checkoutDescription,
  checkoutBottomTitle,
  checkoutCtaButtonText,
  price,
  discountedPrice,
  collectInfoFields = [],
  isActive = false,
  className = '',
  layout = 'card',
  checkoutRedirectUrl,
  onOrderSuccess
}: CheckoutFormProps) {
  const hasDiscount = discountedPrice && parseFloat(discountedPrice) < parseFloat(price)
  const isFreebie = productType === 'freebie' || productType === 'opt_in' || productType === 'url-media'
  const effectivePrice = hasDiscount ? discountedPrice : price

  // Form state for active mode
  const [formData, setFormData] = useState<Record<string, string | string[]>>({})
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showSuccessMessage, setShowSuccessMessage] = useState(false)
  const [isFormValid, setIsFormValid] = useState(false)

  // Stripe payment state
  const [showPaymentElement, setShowPaymentElement] = useState(false)
  const [stripeClientSecret, setStripeClientSecret] = useState<string | undefined>(undefined)
  const [paymentAmount, setPaymentAmount] = useState<number>(0)
  const [paymentCurrency, setPaymentCurrency] = useState<string>('usd')
  const [isLoadingPayment, setIsLoadingPayment] = useState(false)
  const [paymentIntentId, setPaymentIntentId] = useState<string | undefined>(undefined)
  const [isOrderFinalized, setIsOrderFinalized] = useState(false) // Track if order is created

  // Ref to prevent multiple simultaneous payment initializations
  const initializingPayment = useRef(false)

  // Initialize payment on page load for paid products
  useEffect(() => {
    const initializePayment = async () => {
      if (!isActive || !linkId || isFreebie || paymentIntentId || initializingPayment.current) return

      initializingPayment.current = true
      setIsLoadingPayment(true)

      try {
        console.log('Initializing payment for link:', linkId)
        const result = await initializePaymentAction(linkId)
        console.log('Initialize payment result:', result)

        if (result.success && result.data?.client_secret) {
          console.log('Payment initialized successfully:', result.data.payment_intent_id)
          setPaymentIntentId(result.data.payment_intent_id)
          setStripeClientSecret(result.data.client_secret)
          setPaymentAmount(result.data.amount || 0)
          setPaymentCurrency(result.data.currency || 'usd')
          setShowPaymentElement(true)
        } else if (result.data?.is_free) {
          console.log('Product is free, skipping payment initialization')
        } else {
          console.error('Failed to initialize payment:', result.error)
          toast.error('Failed to load payment', {
            description: result.error || 'Unable to initialize payment. Please try again.',
            duration: 5000
          })
        }
      } catch (error) {
        console.error('Failed to initialize payment:', error)
        toast.error('Failed to load payment', {
          description: 'Unable to initialize payment. Please refresh and try again.',
          duration: 5000
        })
      } finally {
        setIsLoadingPayment(false)
        initializingPayment.current = false
      }
    }

    initializePayment()
  }, [isActive, linkId, isFreebie, paymentIntentId])

  // Check form validity in real-time
  useEffect(() => {
    // Check if all required fields are filled
    const allRequiredFieldsFilled = collectInfoFields.every((field, index) => {
      if (!field.is_required) return true

      const fieldKey = `field_${index}`
      const value = formData[fieldKey]

      // Check if value exists and is not empty
      if (!value) return false
      if (Array.isArray(value) && value.length === 0) return false
      if (typeof value === 'string' && value.trim() === '') return false

      return true
    })

    setIsFormValid(allRequiredFieldsFilled)
  }, [formData, collectInfoFields])

  // Confetti animation for freebie success
  const triggerConfetti = () => {
    const duration = 3000
    const animationEnd = Date.now() + duration
    const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 9999 }

    const randomInRange = (min: number, max: number) => Math.random() * (max - min) + min

    const interval = window.setInterval(() => {
      const timeLeft = animationEnd - Date.now()

      if (timeLeft <= 0) {
        return clearInterval(interval)
      }

      const particleCount = 50 * (timeLeft / duration)

      confetti({
        ...defaults,
        particleCount,
        origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 }
      })
      confetti({
        ...defaults,
        particleCount,
        origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 }
      })
    }, 250)
  }

  const handleInputChange = (fieldIndex: number, value: string | string[]) => {
    const fieldKey = `field_${fieldIndex}`
    setFormData(prev => ({
      ...prev,
      [fieldKey]: value
    }))
    // Clear error when user starts typing
    if (errors[fieldKey]) {
      setErrors(prev => ({
        ...prev,
        [fieldKey]: ''
      }))
    }
  }

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    collectInfoFields.forEach((field, index) => {
      const fieldKey = `field_${index}`
      const value = formData[fieldKey]

      if (field.is_required && (!value || (Array.isArray(value) && value.length === 0) || (typeof value === 'string' && value.trim() === ''))) {
        newErrors[fieldKey] = `${field.label} is required`
      }
    })

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleBuyNow = async (): Promise<boolean> => {
    if (!isActive || !linkId || isSubmitting) return false

    if (validateForm()) {
      setIsSubmitting(true)

      try {
        // Transform form data to match API structure
        const formResponses: { [key: string]: any } = {}
        let customerName = ''
        let customerEmail = ''

        collectInfoFields.forEach((field, index) => {
          const fieldKey = `field_${index}`
          const value = formData[fieldKey]

          // Store the response using field label as key
          formResponses[field.label] = Array.isArray(value) ? value : value || ''

          // Extract customer info for dedicated fields
          if (field.field_type === 'email' || field.label.toLowerCase().includes('email')) {
            customerEmail = value as string || ''
          }
          if (field.label.toLowerCase().includes('name') || field.label.toLowerCase().includes('full name')) {
            customerName = value as string || ''
          }
        })

        const orderData: OrderCreateData = {
          customer_name: customerName,
          customer_email: customerEmail,
          form_responses: formResponses
        }

        // Handle paid products vs freebies differently
        if (!isFreebie && paymentIntentId) {
          // Paid product: finalize order and link to existing PaymentIntent
          const result = await finalizeOrderAction(linkId, paymentIntentId, orderData)

          if (result.success) {
            setIsOrderFinalized(true)
            console.log('Order finalized successfully')
            return true
          } else {
            toast.error('Order Failed', {
              description: result.error || 'Something went wrong. Please try again.',
              duration: 5000
            })
            return false
          }
        } else {
          // Freebie: create order directly
          const result = await createOrderAction(linkId, orderData)

          if (result.success) {
            // For opt-in products with redirect URL, redirect immediately (before setTimeout)
            if (productType === 'opt_in' && checkoutRedirectUrl) {
              // Redirect immediately while still in user interaction context
              window.location.href = checkoutRedirectUrl
              return true
            }

            setShowSuccessMessage(true)
            triggerConfetti()
            setFormData({})

            setTimeout(() => {
              setShowSuccessMessage(false)
              if (onOrderSuccess) {
                onOrderSuccess(result.data)
              }
            }, 2000)
            return true
          } else {
            toast.error('Order Failed', {
              description: result.error || 'Something went wrong. Please try again.',
              duration: 5000
            })
            return false
          }
        }
      } catch (error) {
        console.error('Order creation error:', error)
        toast.error('Order Failed', {
          description: 'Something went wrong. Please try again.',
          duration: 5000
        })
        return false
      } finally {
        setIsSubmitting(false)
      }
    }
    return false
  }

  // Handlers for Stripe payment
  const handlePaymentSuccess = () => {
    setShowPaymentElement(false)
    setStripeClientSecret(undefined)

    // Show success message with confetti for ALL products (freebies and paid)
    setShowSuccessMessage(true)
    triggerConfetti()

    // Clear form and reset
    setFormData({})
    setIsSubmitting(false)

    setTimeout(() => {
      setShowSuccessMessage(false)
      if (onOrderSuccess) {
        onOrderSuccess({ success: true })
      }
    }, 3000) // Show for 3 seconds
  }

  const handlePaymentError = (error: string) => {
    toast.error('Payment Failed', {
      description: error,
      duration: 5000
    })
    setIsSubmitting(false)
  }

  if (layout === 'fullpage') {
    return (
      <>
        <div className={`bg-white ${className} relative`}>
          <div className="max-w-2xl mx-auto p-8">
            <div className="space-y-8">
              {/* Header Section */}
              <div className="text-center">
                <h1 className="text-4xl font-bold text-gray-900 mb-4">
                  {checkoutTitle || title || 'Product Title'}
                </h1>
                {/* Price Section - Hide for freebie and opt_in */}
                {!isFreebie && (
                  <div className="mb-6">
                    {hasDiscount ? (
                      <div className="flex items-center justify-center gap-3">
                        <span className="text-xl text-gray-500 line-through">${price}</span>
                        <span className="text-3xl font-bold text-brand-600">${discountedPrice}</span>
                      </div>
                    ) : (
                      <span className="text-3xl font-bold text-brand-600">${price}</span>
                    )}
                  </div>
                )}
              </div>

              {/* Product Image */}
              {thumbnail && (
                <div className="flex justify-center">
                  <div className="w-80 aspect-[4/3] overflow-hidden bg-purple-50 rounded-xl">
                    <img
                      src={thumbnail}
                      alt=""
                      className="w-full h-full object-cover"
                    />
                  </div>
                </div>
              )}

              {/* Product Description */}
              {checkoutDescription && (
                <div className="text-center max-w-xl mx-auto">
                  <div
                    className="text-gray-600 leading-relaxed [&_ul]:list-disc [&_ul]:pl-6 [&_ul]:mb-4 [&_ol]:list-decimal [&_ol]:pl-6 [&_ol]:mb-4 [&_li]:mb-1 [&_h1]:text-gray-900 [&_h1]:font-bold [&_h1]:text-2xl [&_h1]:mt-6 [&_h1]:mb-4 [&_h2]:text-gray-900 [&_h2]:font-bold [&_h2]:text-xl [&_h2]:mt-6 [&_h2]:mb-3 [&_h3]:text-gray-900 [&_h3]:font-semibold [&_h3]:text-lg [&_h3]:mt-5 [&_h3]:mb-2 [&_h4]:text-gray-900 [&_h4]:font-semibold [&_h4]:mt-4 [&_h4]:mb-2 [&_h5]:text-gray-900 [&_h5]:font-medium [&_h5]:mt-3 [&_h5]:mb-1 [&_h6]:text-gray-900 [&_h6]:font-medium [&_h6]:mt-3 [&_h6]:mb-1"
                    dangerouslySetInnerHTML={{ __html: checkoutDescription }}
                  />
                </div>
              )}

              {/* Form Section */}
              <div className="max-w-md mx-auto">
                {/* Bottom Section Title */}
                {checkoutBottomTitle && (
                  <div className="text-center mb-6">
                    <h3 className="text-xl font-semibold text-gray-900">
                      {checkoutBottomTitle}
                    </h3>
                  </div>
                )}

                {/* Input Fields */}
                {collectInfoFields && collectInfoFields.length > 0 && (
                  <div className="space-y-4">
                    {collectInfoFields.map((field, index) => {
                      const fieldKey = `field_${index}`
                      const hasError = errors[fieldKey]
                      const errorClass = hasError ? 'border-red-500' : 'border-gray-300'

                      return (
                        <div key={index}>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            {field.label}
                            {field.is_required && <span className="text-red-500 ml-1">*</span>}
                          </label>

                          {field.field_type === 'text' && (
                            <input
                              type="text"
                              placeholder={field.placeholder || ''}
                              value={(formData[fieldKey] as string) || ''}
                              onChange={(e) => handleInputChange(index, e.target.value)}
                              className={`w-full px-4 py-3 border ${errorClass} rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 transition-all duration-200`}
                              disabled={!isActive}
                            />
                          )}

                          {field.field_type === 'email' && (
                            <input
                              type="email"
                              placeholder={field.placeholder || ''}
                              value={(formData[fieldKey] as string) || ''}
                              onChange={(e) => handleInputChange(index, e.target.value)}
                              className={`w-full px-4 py-3 border ${errorClass} rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 transition-all duration-200`}
                              disabled={!isActive}
                            />
                          )}

                          {field.field_type === 'tel' && (
                            <input
                              type="tel"
                              placeholder={field.placeholder || ''}
                              value={(formData[fieldKey] as string) || ''}
                              onChange={(e) => handleInputChange(index, e.target.value)}
                              className={`w-full px-4 py-3 border ${errorClass} rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 transition-all duration-200`}
                              disabled={!isActive}
                            />
                          )}

                          {field.field_type === 'url' && (
                            <input
                              type="url"
                              placeholder={field.placeholder || ''}
                              value={(formData[fieldKey] as string) || ''}
                              onChange={(e) => handleInputChange(index, e.target.value)}
                              className={`w-full px-4 py-3 border ${errorClass} rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 transition-all duration-200`}
                              disabled={!isActive}
                            />
                          )}

                          {field.field_type === 'number' && (
                            <input
                              type="number"
                              placeholder={field.placeholder || ''}
                              value={(formData[fieldKey] as string) || ''}
                              onChange={(e) => handleInputChange(index, e.target.value)}
                              className={`w-full px-4 py-3 border ${errorClass} rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 transition-all duration-200`}
                              disabled={!isActive}
                            />
                          )}

                          {field.field_type === 'textarea' && (
                            <textarea
                              placeholder={field.placeholder || ''}
                              value={(formData[fieldKey] as string) || ''}
                              onChange={(e) => handleInputChange(index, e.target.value)}
                              rows={4}
                              className={`w-full px-4 py-3 border ${errorClass} rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 transition-all duration-200 resize-none`}
                              disabled={!isActive}
                            />
                          )}

                          {field.field_type === 'select' && (
                            <select
                              value={(formData[fieldKey] as string) || ''}
                              onChange={(e) => handleInputChange(index, e.target.value)}
                              className={`w-full px-4 py-3 border ${errorClass} rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 transition-all duration-200`}
                              disabled={!isActive}
                            >
                              <option value="">{field.placeholder || 'Select an option'}</option>
                              {field.options?.map((option, optIndex) => (
                                <option key={optIndex} value={option}>
                                  {option}
                                </option>
                              ))}
                            </select>
                          )}

                          {field.field_type === 'checkbox' && (
                            <div className="space-y-3">
                              {field.options?.map((option, optIndex) => (
                                <label key={optIndex} className="flex items-center">
                                  <input
                                    type="checkbox"
                                    checked={((formData[fieldKey] as string[]) || []).includes(option)}
                                    onChange={(e) => {
                                      const currentValues = (formData[fieldKey] as string[]) || []
                                      const newValues = e.target.checked
                                        ? [...currentValues, option]
                                        : currentValues.filter(v => v !== option)
                                      handleInputChange(index, newValues)
                                    }}
                                    className="w-4 h-4 text-brand-600 border-gray-300 rounded focus:ring-brand-500"
                                    disabled={!isActive}
                                  />
                                  <span className="ml-3 text-gray-700">{option}</span>
                                </label>
                              ))}
                            </div>
                          )}

                          {field.field_type === 'radio' && (
                            <div className="space-y-3">
                              {field.options?.map((option, optIndex) => (
                                <label key={optIndex} className="flex items-center">
                                  <input
                                    type="radio"
                                    name={`radio-${index}`}
                                    checked={(formData[fieldKey] as string) === option}
                                    onChange={() => handleInputChange(index, option)}
                                    className="w-4 h-4 text-brand-600 border-gray-300 focus:ring-brand-500"
                                    disabled={!isActive}
                                  />
                                  <span className="ml-3 text-gray-700">{option}</span>
                                </label>
                              ))}
                            </div>
                          )}

                          {hasError && (
                            <p className="text-red-500 text-sm mt-1">{hasError}</p>
                          )}
                        </div>
                      )
                    })}
                  </div>
                )}

                {/* Purchase Button - Never show for paid products (price > 0) */}
                {parseFloat(effectivePrice) === 0 && (
                  <div className="pt-6">
                    <button
                      onClick={handleBuyNow}
                      className="w-full bg-brand-600 hover:bg-brand-700 text-white font-semibold py-4 px-6 rounded-lg transition-colors disabled:opacity-50 text-lg"
                      disabled={!isActive || isSubmitting}
                    >
                      {isSubmitting ? 'Processing...' : (checkoutCtaButtonText || 'Buy Now')}
                    </button>
                  </div>
                )}

                {/* Inline Stripe Payment Element */}
                {showPaymentElement && stripeClientSecret && (
                  <div className="pt-6">
                    <InlineStripePayment
                      clientSecret={stripeClientSecret}
                      publishableKey={process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || ''}
                      amount={paymentAmount}
                      currency={paymentCurrency}
                      onSuccess={handlePaymentSuccess}
                      onError={handlePaymentError}
                      disabled={!isFormValid}
                      onBeforePayment={handleBuyNow}
                    />
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Success Message Overlay - Fullpage */}
          {showSuccessMessage && (
            <div className="absolute inset-0 bg-white/95 backdrop-blur-sm flex items-center justify-center z-50">
              <div className="text-center px-6">
                <h2 className="text-5xl md:text-6xl font-bold text-brand-600 mb-4">
                  {isFreebie
                    ? (productType === 'opt_in' ? "You're in! 🎉" : "Check your email!")
                    : "Payment Successful! 🎉"}
                </h2>
                <p className="text-3xl md:text-4xl font-semibold text-gray-700">
                  {isFreebie
                    ? (productType === 'opt_in' ? "Check your email for next steps!" : "Your gift is on its way! 🎁")
                    : "Thank you for your purchase! Check your email for access."}
                </p>
              </div>
            </div>
          )}
        </div>
      </>
    )
  }

  // Card layout (default)
  return (
    <>
      <div className={`bg-white ${className} relative`}>
        {/* Checkout Page Image with Title Overlay */}
        {thumbnail ? (
          <div className="aspect-[3/2] overflow-hidden bg-purple-50 relative">
            <img
              src={thumbnail}
              alt=""
              className="w-full h-full object-cover"
            />
            {/* Title Overlay */}
            <div className="absolute inset-0 bg-black bg-opacity-40 flex items-end justify-start">
              <div className="text-left px-6 pb-6">
                <h1 className="text-xl font-bold text-white">
                  {checkoutTitle || title || 'Product Title'}
                </h1>
              </div>
            </div>
          </div>
        ) : (
          <div className="aspect-[4/3] sm:aspect-[4/3] md:aspect-[16/7] bg-gradient-to-br from-purple-100 to-purple-50 flex items-center justify-center relative">
            <ShoppingCart className="w-12 h-12 text-purple-400 mb-4" />
            {/* Title Overlay for placeholder */}
            <div className="absolute inset-0 flex items-end justify-start">
              <div className="text-left px-6 pb-6">
                <h1 className="text-xl font-bold text-purple-700">
                  {checkoutTitle || title || 'Product Title'}
                </h1>
              </div>
            </div>
          </div>
        )}

        {/* Checkout Content */}
        <div className="p-4">
          <div className="space-y-4">
            {/* Price Section - Hide for freebie and opt_in */}
            {!isFreebie && (
              <div className="text-left">
                {hasDiscount ? (
                  <div className="flex items-center gap-3">
                    <span className="text-lg text-gray-500 line-through">${price}</span>
                    <span className="text-2xl font-bold text-brand-600">${discountedPrice}</span>
                  </div>
                ) : (
                  <span className="text-2xl font-bold text-brand-600">${price}</span>
                )}
              </div>
            )}

            {/* Product Description */}
            {checkoutDescription && (
              <div className="text-left">
                <div
                  className="text-gray-600 text-sm leading-snug [&_ul]:list-disc [&_ul]:pl-6 [&_ul]:mb-3 [&_ol]:list-decimal [&_ol]:pl-6 [&_ol]:mb-3 [&_li]:mb-1 [&_h1]:text-gray-900 [&_h1]:font-bold [&_h1]:text-base [&_h1]:mt-3 [&_h1]:mb-2 [&_h2]:text-gray-900 [&_h2]:font-bold [&_h2]:text-sm [&_h2]:mt-3 [&_h2]:mb-1 [&_h3]:text-gray-900 [&_h3]:font-semibold [&_h3]:text-sm [&_h3]:mt-2 [&_h3]:mb-1 [&_h4]:text-gray-900 [&_h4]:font-semibold [&_h4]:text-xs [&_h4]:mt-2 [&_h4]:mb-1 [&_h5]:text-gray-900 [&_h5]:font-medium [&_h5]:text-xs [&_h5]:mt-2 [&_h5]:mb-1 [&_h6]:text-gray-900 [&_h6]:font-medium [&_h6]:text-xs [&_h6]:mt-1 [&_h6]:mb-1"
                  dangerouslySetInnerHTML={{ __html: checkoutDescription }}
                />
              </div>
            )}

            {/* Bottom Section Title */}
            {checkoutBottomTitle && (
              <div className="text-left">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">
                  {checkoutBottomTitle}
                </h3>
              </div>
            )}

            {/* Input Fields */}
            {collectInfoFields && collectInfoFields.length > 0 && (
              <div className="space-y-3">
                {collectInfoFields.map((field, index) => {
                  const fieldKey = `field_${index}`
                  const hasError = errors[fieldKey]
                  const errorClass = hasError ? 'border-red-500' : 'border-gray-300'

                  return (
                    <div key={index}>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        {field.label}
                        {field.is_required && <span className="text-red-500 ml-1">*</span>}
                      </label>

                      {field.field_type === 'text' && (
                        <input
                          type="text"
                          placeholder={field.placeholder || ''}
                          value={(formData[fieldKey] as string) || ''}
                          onChange={(e) => handleInputChange(index, e.target.value)}
                          className={`w-full px-3 py-2 border ${errorClass} rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 transition-all duration-200`}
                          disabled={!isActive}
                        />
                      )}

                      {field.field_type === 'email' && (
                        <input
                          type="email"
                          placeholder={field.placeholder || ''}
                          value={(formData[fieldKey] as string) || ''}
                          onChange={(e) => handleInputChange(index, e.target.value)}
                          className={`w-full px-3 py-2 border ${errorClass} rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 transition-all duration-200`}
                          disabled={!isActive}
                        />
                      )}

                      {field.field_type === 'tel' && (
                        <input
                          type="tel"
                          placeholder={field.placeholder || ''}
                          value={(formData[fieldKey] as string) || ''}
                          onChange={(e) => handleInputChange(index, e.target.value)}
                          className={`w-full px-3 py-2 border ${errorClass} rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 transition-all duration-200`}
                          disabled={!isActive}
                        />
                      )}

                      {field.field_type === 'url' && (
                        <input
                          type="url"
                          placeholder={field.placeholder || ''}
                          value={(formData[fieldKey] as string) || ''}
                          onChange={(e) => handleInputChange(index, e.target.value)}
                          className={`w-full px-3 py-2 border ${errorClass} rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 transition-all duration-200`}
                          disabled={!isActive}
                        />
                      )}

                      {field.field_type === 'number' && (
                        <input
                          type="number"
                          placeholder={field.placeholder || ''}
                          value={(formData[fieldKey] as string) || ''}
                          onChange={(e) => handleInputChange(index, e.target.value)}
                          className={`w-full px-3 py-2 border ${errorClass} rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 transition-all duration-200`}
                          disabled={!isActive}
                        />
                      )}

                      {field.field_type === 'textarea' && (
                        <textarea
                          placeholder={field.placeholder || ''}
                          value={(formData[fieldKey] as string) || ''}
                          onChange={(e) => handleInputChange(index, e.target.value)}
                          rows={3}
                          className={`w-full px-3 py-2 border ${errorClass} rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 transition-all duration-200 resize-none`}
                          disabled={!isActive}
                        />
                      )}

                      {field.field_type === 'select' && (
                        <select
                          value={(formData[fieldKey] as string) || ''}
                          onChange={(e) => handleInputChange(index, e.target.value)}
                          className={`w-full px-3 py-2 border ${errorClass} rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 transition-all duration-200`}
                          disabled={!isActive}
                        >
                          <option value="">{field.placeholder || 'Select an option'}</option>
                          {field.options?.map((option, optIndex) => (
                            <option key={optIndex} value={option}>
                              {option}
                            </option>
                          ))}
                        </select>
                      )}

                      {field.field_type === 'checkbox' && (
                        <div className="space-y-2">
                          {field.options?.map((option, optIndex) => (
                            <label key={optIndex} className="flex items-center">
                              <input
                                type="checkbox"
                                checked={((formData[fieldKey] as string[]) || []).includes(option)}
                                onChange={(e) => {
                                  const currentValues = (formData[fieldKey] as string[]) || []
                                  const newValues = e.target.checked
                                    ? [...currentValues, option]
                                    : currentValues.filter(v => v !== option)
                                  handleInputChange(index, newValues)
                                }}
                                className="w-4 h-4 text-brand-600 border-gray-300 rounded focus:ring-brand-500"
                                disabled={!isActive}
                              />
                              <span className="ml-2 text-sm text-gray-700">{option}</span>
                            </label>
                          ))}
                        </div>
                      )}

                      {field.field_type === 'radio' && (
                        <div className="space-y-2">
                          {field.options?.map((option, optIndex) => (
                            <label key={optIndex} className="flex items-center">
                              <input
                                type="radio"
                                name={`radio-${index}`}
                                checked={(formData[fieldKey] as string) === option}
                                onChange={() => handleInputChange(index, option)}
                                className="w-4 h-4 text-brand-600 border-gray-300 focus:ring-brand-500"
                                disabled={!isActive}
                              />
                              <span className="ml-2 text-sm text-gray-700">{option}</span>
                            </label>
                          ))}
                        </div>
                      )}

                      {hasError && (
                        <p className="text-red-500 text-xs mt-1">{hasError}</p>
                      )}
                    </div>
                  )
                })}
              </div>
            )}

            {/* Purchase Button - Never show for paid products (price > 0) */}
            {parseFloat(effectivePrice) === 0 && (
              <div className="pt-4">
                <button
                  onClick={handleBuyNow}
                  className="w-full bg-brand-600 hover:bg-brand-700 text-white font-semibold py-3 px-4 rounded-lg transition-colors disabled:opacity-50"
                  disabled={!isActive || isSubmitting}
                >
                  {isSubmitting ? 'Processing...' : (checkoutCtaButtonText || 'Buy Now')}
                </button>
              </div>
            )}

            {/* Inline Stripe Payment Element */}
            {showPaymentElement && stripeClientSecret && (
              <div className="pt-4">
                <InlineStripePayment
                  clientSecret={stripeClientSecret}
                  publishableKey={process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || ''}
                  amount={paymentAmount}
                  currency={paymentCurrency}
                  onSuccess={handlePaymentSuccess}
                  onError={handlePaymentError}
                  disabled={!isFormValid}
                  onBeforePayment={handleBuyNow}
                />
              </div>
            )}
          </div>
        </div>

        {/* Success Message Overlay */}
        {showSuccessMessage && (
          <div className="absolute inset-0 bg-white/95 backdrop-blur-sm flex items-center justify-center z-50 rounded-lg">
            <div className="text-center px-6">
              <h2 className="text-4xl md:text-5xl font-bold text-brand-600 mb-2">
                {isFreebie
                  ? (productType === 'opt_in' ? "You're in! 🎉" : "Check your email!")
                  : "Payment Successful! 🎉"}
              </h2>
              <p className="text-2xl md:text-3xl font-semibold text-gray-700">
                {isFreebie
                  ? (productType === 'opt_in' ? "Check your email for next steps!" : "Your gift is on its way! 🎁")
                  : "Thank you for your purchase! Check your email for access."}
              </p>
            </div>
          </div>
        )}
      </div>
    </>
  )
}