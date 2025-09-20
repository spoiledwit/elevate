'use client'

import { Package, ExternalLink } from 'lucide-react'

interface ProductButtonCardProps {
  productType: 'digital' | 'custom' | 'ecourse' | 'url-media' | null
  thumbnail: string | null
  title: string
  subtitle?: string
}

const productTypeIcons = {
  digital: Package,
  custom: Package,
  ecourse: Package,
  'url-media': ExternalLink,
}

export function ProductButtonCard({
  productType,
  thumbnail,
  title,
  subtitle
}: ProductButtonCardProps) {
  const IconComponent = productType ? productTypeIcons[productType] : Package

  return (
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