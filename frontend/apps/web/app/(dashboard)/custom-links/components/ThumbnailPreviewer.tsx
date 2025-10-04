'use client'

import { Eye } from 'lucide-react'
import { ProductCard } from './ProductCard'

interface ThumbnailPreviewerProps {
  productType: 'digital' | 'opt_in' | 'url-media' | 'freebie' | null
  thumbnail: string | null
  title: string
  subtitle?: string
  displayStyle: 'button' | 'callout' | null
  buttonText?: string
  price?: string
  discountedPrice?: string
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

  if (!displayStyle) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-8">
        <div className="text-center">
          <h3 className="text-lg font-medium text-gray-900 mb-2">Preview</h3>
          <p className="text-gray-600">Select a display style to see how your product will appear</p>
        </div>
      </div>
    )
  }


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

                  <h1 className="text-xl font-bold text-gray-900 mb-2">Your Storefront</h1>
                  <p className="text-gray-600 text-sm">Product preview</p>
                </div>

                {/* Product Preview */}
                <div className="space-y-4">
                  <ProductCard
                    productType={productType}
                    thumbnail={thumbnail}
                    title={title}
                    subtitle={subtitle}
                    displayStyle={displayStyle}
                    price={price}
                    discountedPrice={discountedPrice}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}