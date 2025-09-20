'use client'

import { Package, ExternalLink } from 'lucide-react'

interface ProductCalloutCardProps {
  productType: 'digital' | 'custom' | 'ecourse' | 'url-media' | null
  thumbnail: string | null
  title: string
  subtitle?: string
  price?: string
  discountedPrice?: string
}

const productTypeIcons = {
  digital: Package,
  custom: Package,
  ecourse: Package,
  'url-media': ExternalLink,
}

export function ProductCalloutCard({
  productType,
  thumbnail,
  title,
  subtitle,
  price,
  discountedPrice
}: ProductCalloutCardProps) {
  const IconComponent = productType ? productTypeIcons[productType] : Package
  const hasDiscount = discountedPrice && price && parseFloat(discountedPrice) < parseFloat(price)

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm hover:shadow-md transition-shadow cursor-pointer">
      {thumbnail ? (
        <div className="aspect-square overflow-hidden bg-purple-50">
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
        {price && (
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