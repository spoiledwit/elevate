'use client'

import { Eye, ShoppingCart, ArrowLeft, CreditCard, Lock } from 'lucide-react'

interface CheckoutPreviewerProps {
  productType: 'digital' | 'custom' | 'ecourse' | 'url-media' | null
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
}

export function CheckoutPreviewer({
  productType,
  thumbnail,
  title,
  subtitle,
  checkoutTitle,
  checkoutDescription,
  checkoutBottomTitle,
  checkoutCtaButtonText,
  price,
  discountedPrice,
  customFields = [],
  collectInfoFields = []
}: CheckoutPreviewerProps) {
  const hasDiscount = discountedPrice && parseFloat(discountedPrice) < parseFloat(price)

  return (
    <div className="flex items-start justify-center">
      <div 
        className="h-[700px] bg-white rounded-[2rem] sticky top-6 p-4"
        style={{
          width: '330px',
          boxShadow: 'rgba(50, 50, 93, 0.25) 0px 50px 100px -20px, rgba(0, 0, 0, 0.3) 0px 30px 60px -30px, rgba(10, 37, 64, 0.35) 0px -2px 6px 0px inset'
        }}
      >
        <div className="w-full h-full rounded-xl overflow-hidden bg-white">
          <div className="h-full overflow-y-auto">
            {/* Checkout Page Image with Title Overlay */}
            {thumbnail ? (
              <div className="aspect-[4/3] overflow-hidden bg-purple-50 relative">
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
              <div className="aspect-[4/3] bg-gradient-to-br from-purple-100 to-purple-50 flex items-center justify-center relative">
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
            <div className="p-6">
              <div className="space-y-6">
                {/* Price Section */}
                <div className="text-left">
                  {hasDiscount ? (
                    <div className="flex items-center gap-3">
                      <span className="text-lg text-gray-500 line-through">${price}</span>
                      <span className="text-2xl font-bold text-purple-600">${discountedPrice}</span>
                    </div>
                  ) : (
                    <span className="text-2xl font-bold text-purple-600">${price}</span>
                  )}
                </div>

                {/* Product Description */}
                {checkoutDescription && (
                  <div className="text-left">
                    <div 
                      className="text-gray-600 text-sm leading-relaxed [&_ul]:list-disc [&_ul]:pl-6 [&_ul]:mb-4 [&_ol]:list-decimal [&_ol]:pl-6 [&_ol]:mb-4 [&_li]:mb-1 [&_h1]:text-gray-900 [&_h1]:font-bold [&_h1]:text-lg [&_h1]:mt-4 [&_h1]:mb-2 [&_h2]:text-gray-900 [&_h2]:font-bold [&_h2]:text-base [&_h2]:mt-4 [&_h2]:mb-2 [&_h3]:text-gray-900 [&_h3]:font-semibold [&_h3]:text-base [&_h3]:mt-3 [&_h3]:mb-1 [&_h4]:text-gray-900 [&_h4]:font-semibold [&_h4]:text-sm [&_h4]:mt-3 [&_h4]:mb-1 [&_h5]:text-gray-900 [&_h5]:font-medium [&_h5]:text-sm [&_h5]:mt-2 [&_h5]:mb-1 [&_h6]:text-gray-900 [&_h6]:font-medium [&_h6]:text-xs [&_h6]:mt-2 [&_h6]:mb-1"
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
                    {collectInfoFields.map((field, index) => (
                      <div key={index}>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          {field.label}
                          {field.is_required && <span className="text-red-500 ml-1">*</span>}
                        </label>
                        
                        {field.field_type === 'text' && (
                          <input
                            type="text"
                            placeholder={field.placeholder || ''}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-purple-500 focus:border-purple-500"
                            disabled
                          />
                        )}
                        
                        {field.field_type === 'email' && (
                          <input
                            type="email"
                            placeholder={field.placeholder || ''}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-purple-500 focus:border-purple-500"
                            disabled
                          />
                        )}
                        
                        {field.field_type === 'tel' && (
                          <input
                            type="tel"
                            placeholder={field.placeholder || ''}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-purple-500 focus:border-purple-500"
                            disabled
                          />
                        )}
                        
                        {field.field_type === 'url' && (
                          <input
                            type="url"
                            placeholder={field.placeholder || ''}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-purple-500 focus:border-purple-500"
                            disabled
                          />
                        )}
                        
                        {field.field_type === 'number' && (
                          <input
                            type="number"
                            placeholder={field.placeholder || ''}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-purple-500 focus:border-purple-500"
                            disabled
                          />
                        )}
                        
                        {field.field_type === 'textarea' && (
                          <textarea
                            placeholder={field.placeholder || ''}
                            rows={3}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-purple-500 focus:border-purple-500 resize-none"
                            disabled
                          />
                        )}
                        
                        {field.field_type === 'select' && (
                          <select
                            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-purple-500 focus:border-purple-500"
                            disabled
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
                                  className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
                                  disabled
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
                                  className="w-4 h-4 text-purple-600 border-gray-300 focus:ring-purple-500"
                                  disabled
                                />
                                <span className="ml-2 text-sm text-gray-700">{option}</span>
                              </label>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {/* Purchase Button */}
                <div className="pt-4">
                  <button 
                    className="w-full bg-purple-600 hover:bg-purple-700 text-white font-semibold py-3 px-4 rounded-lg transition-colors disabled:opacity-50"
                    disabled
                  >
                    {checkoutCtaButtonText || 'Buy Now'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}