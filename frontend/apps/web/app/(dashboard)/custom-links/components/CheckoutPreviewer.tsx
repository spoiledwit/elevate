'use client'

import { CheckoutForm } from './CheckoutForm'

interface CheckoutPreviewerProps {
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
  collectInfoFields = [],
  isActive = false
}: CheckoutPreviewerProps) {
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
            <CheckoutForm
              productType={productType}
              thumbnail={thumbnail}
              title={title}
              subtitle={subtitle}
              checkoutTitle={checkoutTitle}
              checkoutDescription={checkoutDescription}
              checkoutBottomTitle={checkoutBottomTitle}
              checkoutCtaButtonText={checkoutCtaButtonText}
              price={price}
              discountedPrice={discountedPrice}
              customFields={customFields}
              collectInfoFields={collectInfoFields}
              isActive={isActive}
              layout='preview'
            />
          </div>
        </div>
      </div>
    </div>
  )
}