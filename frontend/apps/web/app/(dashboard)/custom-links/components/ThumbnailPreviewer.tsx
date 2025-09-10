'use client'

import { Eye, ExternalLink, ShoppingCart, Package } from 'lucide-react'

interface ThumbnailPreviewerProps {
  productType: 'digital' | 'custom' | 'ecourse' | 'url-media' | null
  thumbnail: string | null
  title: string
  subtitle?: string
  displayStyle: 'button' | 'callout' | null
  buttonText?: string
  price?: string
  discountedPrice?: string
}

const productTypeIcons = {
  digital: Package,
  custom: Package,
  ecourse: Package,
  'url-media': ExternalLink,
}

export function ThumbnailPreviewer({ 
  productType, 
  thumbnail, 
  title, 
  subtitle, 
  displayStyle, 
  buttonText = 'View',
  price,
  discountedPrice
}: ThumbnailPreviewerProps) {
  const hasDiscount = discountedPrice && price && parseFloat(discountedPrice) < parseFloat(price)

  if (!displayStyle) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-8">
        <div className="text-center">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Eye className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Preview</h3>
          <p className="text-gray-600">Select a display style to see how your product will appear</p>
        </div>
      </div>
    )
  }

  const IconComponent = productType ? productTypeIcons[productType] : Package

  const renderButtonStyle = () => (
    <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer border border-gray-200">
      {thumbnail ? (
        <div className="w-12 h-12 rounded-lg overflow-hidden bg-gray-200 flex-shrink-0">
          <img 
            src={thumbnail} 
            alt=""
            className="w-full h-full object-cover"
          />
        </div>
      ) : (
        <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
          <IconComponent className="w-6 h-6 text-purple-600" />
        </div>
      )}
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-gray-900 text-sm truncate">
          {title || 'Product Title'}
        </p>
        {subtitle && (
          <p className="text-gray-600 text-xs truncate mt-0.5">
            {subtitle}
          </p>
        )}
      </div>
    </div>
  )

  const renderCalloutStyle = () => (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm hover:shadow-md transition-shadow cursor-pointer">
      {thumbnail ? (
        <div className="aspect-[4/3] overflow-hidden bg-purple-50">
          <img 
            src={thumbnail} 
            alt=""
            className="w-full h-full object-cover"
          />
        </div>
      ) : (
        <div className="aspect-[4/3] bg-gradient-to-br from-purple-100 to-purple-50 flex items-center justify-center">
          <IconComponent className="w-12 h-12 text-purple-400" />
        </div>
      )}
      <div className="p-4">
        <h3 className="font-bold text-gray-900 mb-1 text-sm">
          {title || 'Product Title'}
        </h3>
        {subtitle && (
          <p className="text-gray-600 text-xs mb-2 leading-relaxed">
            {subtitle}
          </p>
        )}
        {price && (
          <div>
            {hasDiscount ? (
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-500 line-through">${price}</span>
                <span className="text-lg font-bold text-purple-600">${discountedPrice}</span>
              </div>
            ) : (
              <span className="text-lg font-bold text-purple-600">${price}</span>
            )}
          </div>
        )}
      </div>
    </div>
  )

  return (
    <div className="flex items-start justify-center">
      <div 
        className="w-80 h-[700px] bg-white rounded-[2rem] sticky top-6 p-4"
        style={{
          boxShadow: 'rgba(50, 50, 93, 0.25) 0px 50px 100px -20px, rgba(0, 0, 0, 0.3) 0px 30px 60px -30px, rgba(10, 37, 64, 0.35) 0px -2px 6px 0px inset'
        }}
      >
        <div className="w-full h-full rounded-xl overflow-hidden bg-white">
          <div className="h-full overflow-y-auto">
            {/* Mobile Content */}
            <div className="p-6">
              <div className="space-y-6">
                {/* Sample Profile Section (simplified) */}
                <div className="text-center">
                  <div className="w-20 h-20 mx-auto mb-4 rounded-full overflow-hidden bg-gray-100 flex items-center justify-center">
                    <Eye className="w-8 h-8 text-gray-400" />
                  </div>
                  <h1 className="text-xl font-bold text-gray-900 mb-2">Your Storefront</h1>
                  <p className="text-gray-600 text-sm">Product preview</p>
                </div>

                {/* Product Preview */}
                <div className="space-y-4">
                  {displayStyle === 'button' ? renderButtonStyle() : renderCalloutStyle()}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}