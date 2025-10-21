'use client'

import { useState, useEffect } from 'react'
import { ShoppingCart } from 'lucide-react'
import { toast } from 'sonner'
import { createOrderAction, type OrderCreateData } from '@/actions/storefront-action'
import confetti from 'canvas-confetti'
import { StripeCheckout } from './StripeCheckout'

interface CheckoutFormProps {
  linkId?: string
  productType: 'digital' | 'opt_in' | 'url-media' | 'freebie' | null
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
  onOrderSuccess
}: CheckoutFormProps) {
  const hasDiscount = discountedPrice && parseFloat(discountedPrice) < parseFloat(price)
  const isFreebie = productType === 'freebie' || productType === 'opt_in' || productType === 'url-media'

  // Form state for active mode
  const [formData, setFormData] = useState<Record<string, string | string[]>>({})
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showSuccessMessage, setShowSuccessMessage] = useState(false)

  // Stripe checkout state
  const [showStripeCheckout, setShowStripeCheckout] = useState(false)
  const [stripeCheckoutUrl, setStripeCheckoutUrl] = useState<string | undefined>(undefined)
  const [stripeClientSecret, setStripeClientSecret] = useState<string | undefined>(undefined)

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

  const handleBuyNow = async () => {
    if (!isActive || !linkId || isSubmitting) return

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

        const result = await createOrderAction(linkId, orderData)

        if (result.success && result.data) {
          // Check if we have a checkout URL or client secret from Stripe
          if (result.data.checkout_url || (result.data as any).client_secret) {
            toast.success('Opening payment checkout...', {
              duration: 2000
            })

            // Clear form data
            setFormData({})

            // Open inline Stripe checkout instead of redirecting
            setStripeCheckoutUrl(result.data.checkout_url)
            setStripeClientSecret((result.data as any).client_secret)
            setShowStripeCheckout(true)
          } else {
            // Fallback for when Stripe checkout fails but order is created
            // For freebies, show special success message with confetti
            if (isFreebie) {
              setShowSuccessMessage(true)
              triggerConfetti()

              // Hide success message after 2 seconds
              setTimeout(() => {
                setShowSuccessMessage(false)
                if (onOrderSuccess) {
                  onOrderSuccess(result.data)
                }
              }, 2000)
            } else {
              toast.success('Order Created Successfully!', {
                duration: 5000
              })
            }

            // Clear form data
            setFormData({})

            // Call success callback to navigate back (for non-freebies)
            if (!isFreebie && onOrderSuccess) {
              onOrderSuccess(result.data)
            }
          }
        } else {
          toast.error('Order Failed', {
            description: result.error || 'Something went wrong. Please try again.',
            duration: 5000
          })
        }
      } catch (error) {
        console.error('Order creation error:', error)
        toast.error('Order Failed', {
          description: 'Something went wrong. Please try again.',
          duration: 5000
        })
      } finally {
        setIsSubmitting(false)
      }
    }
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

              {/* Purchase Button */}
              <div className="pt-6">
                <button
                  onClick={handleBuyNow}
                  className="w-full bg-brand-600 hover:bg-brand-700 text-white font-semibold py-4 px-6 rounded-lg transition-colors disabled:opacity-50 text-lg"
                  disabled={!isActive || isSubmitting}
                >
                  {isSubmitting ? 'Processing...' : (checkoutCtaButtonText || 'Buy Now')}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Success Message Overlay for Freebies - Fullpage */}
        {showSuccessMessage && isFreebie && (
          <div className="absolute inset-0 bg-white/95 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="text-center px-6">
              <h2 className="text-5xl md:text-6xl font-bold text-brand-600 mb-4">
                {productType === 'opt_in' ? "You're in! 🎉" : "Check your email!"}
              </h2>
              <p className="text-3xl md:text-4xl font-semibold text-gray-700">
                {productType === 'opt_in' ? "Check your email for next steps!" : "Your gift is on its way! 🎁"}
              </p>
            </div>
          </div>
        )}
        </div>

        {/* Stripe Checkout Modal */}
        <StripeCheckout
          clientSecret={stripeClientSecret}
          checkoutUrl={stripeCheckoutUrl}
          publishableKey={process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || ''}
          onComplete={handleStripeComplete}
          onCancel={handleStripeCancel}
          isOpen={showStripeCheckout}
        />
      </>
    )
  }

  // Handlers for Stripe checkout
  const handleStripeComplete = () => {
    setShowStripeCheckout(false)

    // Show success message for freebies
    if (isFreebie) {
      setShowSuccessMessage(true)
      triggerConfetti()

      setTimeout(() => {
        setShowSuccessMessage(false)
        if (onOrderSuccess) {
          onOrderSuccess({ success: true })
        }
      }, 2000)
    } else {
      toast.success('Payment Completed Successfully!', {
        duration: 5000
      })

      if (onOrderSuccess) {
        onOrderSuccess({ success: true })
      }
    }
  }

  const handleStripeCancel = () => {
    setShowStripeCheckout(false)
    setStripeCheckoutUrl(undefined)
    setStripeClientSecret(undefined)
    setIsSubmitting(false)

    toast.info('Checkout cancelled', {
      duration: 3000
    })
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

          {/* Purchase Button */}
          <div className="pt-4">
            <button
              onClick={handleBuyNow}
              className="w-full bg-brand-600 hover:bg-brand-700 text-white font-semibold py-3 px-4 rounded-lg transition-colors disabled:opacity-50"
              disabled={!isActive || isSubmitting}
            >
              {isSubmitting ? 'Processing...' : ('Buy Now')}
            </button>
          </div>
        </div>
      </div>

      {/* Success Message Overlay for Freebies */}
      {showSuccessMessage && isFreebie && (
        <div className="absolute inset-0 bg-white/95 backdrop-blur-sm flex items-center justify-center z-50 rounded-lg">
          <div className="text-center px-6">
            <h2 className="text-4xl md:text-5xl font-bold text-brand-600 mb-2">
              {productType === 'opt_in' ? "You're in! 🎉" : "Check your email!"}
            </h2>
            <p className="text-2xl md:text-3xl font-semibold text-gray-700">
              {productType === 'opt_in' ? "Check your email for next steps!" : "Your gift is on its way! 🎁"}
            </p>
          </div>
        </div>
      )}
      </div>

      {/* Stripe Checkout Modal */}
      <StripeCheckout
        clientSecret={stripeClientSecret}
        checkoutUrl={stripeCheckoutUrl}
        publishableKey={process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || ''}
        onComplete={handleStripeComplete}
        onCancel={handleStripeCancel}
        isOpen={showStripeCheckout}
      />
    </>
  )
}