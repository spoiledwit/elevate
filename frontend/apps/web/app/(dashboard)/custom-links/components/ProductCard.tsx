'use client'

import { Package, ExternalLink, Gift, Code } from 'lucide-react'

interface ProductCardProps {
  productType: 'digital' | 'opt_in' | 'url-media' | 'freebie' | 'iframe' | null
  thumbnail: string | null
  title: string
  subtitle?: string
  displayStyle: 'button' | 'callout'
  price?: string
  discountedPrice?: string
}

const productTypeIcons = {
  digital: Package,
  'opt_in': Package,
  'url-media': ExternalLink,
  freebie: Gift,
  iframe: Code,
}

export function ProductCard({
  productType,
  thumbnail,
  title,
  subtitle,
  displayStyle,
  price,
  discountedPrice
}: ProductCardProps) {
  const IconComponent = productType ? productTypeIcons[productType] : Package
  const hasDiscount = discountedPrice && price && parseFloat(discountedPrice) < parseFloat(price)

  if (displayStyle === 'button') {
    return (
      <div className="flex items-center gap-3 p-4 bg-white rounded-lg transition-colors cursor-pointer shadow-md hover:shadow-lg transition-shadow ">
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
            <IconComponent className="w-6 h-6 text-brand-600" />
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
  }

  // Callout style
  return (
    <div className="bg-white rounded-xl overflow-hidden shadow-md hover:shadow-lg transition-shadow cursor-pointer">
      {thumbnail ? (
        <div className=" overflow-hidden bg-purple-50">
          <img
            src={thumbnail}
            alt=""
            className="w-full h-full object-cover"
          />
        </div>
      ) : (
        <div className="aspect-square bg-gradient-to-br from-purple-100 to-purple-50 flex items-center justify-center">
          <IconComponent className="w-16 h-16 text-purple-400" />
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
        {price && productType !== 'freebie' && productType !== 'opt_in' && productType !== 'url-media' && (
          <div>
            {hasDiscount ? (
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-500 line-through">${price}</span>
                <span className="text-lg font-bold text-brand-600">${discountedPrice}</span>
              </div>
            ) : (
              <span className="text-lg font-bold text-brand-600">${price}</span>
            )}
          </div>
        )}
      </div>
    </div>
  )
}