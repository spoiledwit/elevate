'use client'

import { useEffect, useState } from 'react'
import { ArrowLeft } from 'lucide-react'
import { StorefrontHeaderPreview } from '../../(dashboard)/custom-links/components/StorefrontHeaderPreview'
import { ProductCard } from '../../(dashboard)/custom-links/components/ProductCard'
import { CheckoutForm } from '../../(dashboard)/custom-links/components/CheckoutForm'
import { trackProfileViewAction, trackLinkClickAction, getSystemConfigAction } from '@/actions'
import logo from '@/assets/logo.png'
import Image from 'next/image'

interface PublicStorefrontProps {
  username: string
  profile: any
}

export function PublicStorefront({ username, profile }: PublicStorefrontProps) {
  const [hasTrackedView, setHasTrackedView] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState<any>(null)
  const [checkoutUrl, setCheckoutUrl] = useState<string>('')

  // Fetch system config on mount
  useEffect(() => {
    const fetchSystemConfig = async () => {
      try {
        const config = await getSystemConfigAction()
        if (config?.checkout_url) {
          setCheckoutUrl(config.checkout_url)
        }
      } catch (error) {
        console.error('Failed to fetch system config:', error)
      }
    }
    fetchSystemConfig()
  }, [])

  // Track profile view on mount
  useEffect(() => {
    if (!hasTrackedView) {
      trackProfileView()
      setHasTrackedView(true)
    }
  }, [hasTrackedView])

  const trackProfileView = async () => {
    try {
      const userAgent = navigator.userAgent
      const referrer = document.referrer
      await trackProfileViewAction(username, userAgent, referrer)
    } catch (error) {
      console.error('Failed to track profile view:', error)
    }
  }

  const trackLinkClick = async (linkId: number) => {
    try {
      const userAgent = navigator.userAgent
      const referrer = document.referrer
      await trackLinkClickAction(linkId.toString(), userAgent as any, referrer)
    } catch (error) {
      console.error('Failed to track link click:', error)
    }
  }

  const handleBackToProducts = () => {
    setSelectedProduct(null)
  }

  const handleOrderSuccess = () => {
    // For opt-in products, the redirect is handled in CheckoutForm immediately after submission
    // For other products, just navigate back to products list
    if (selectedProduct?.type !== 'opt_in') {
      setSelectedProduct(null)
    }
  }

  const handleProductClick = (link: any) => {
    trackLinkClick(link.id)

    // If it's a url_media type, redirect directly to the destination URL
    if (link.type === 'url_media' && link.additional_info?.destination_url) {
      window.open(link.additional_info.destination_url, '_blank')
    } else if (link.type === 'iframe' && link.additional_info?.iframe_url) {
      // If it's an iframe type, redirect to the iframe URL
      window.open(link.additional_info.iframe_url, '_blank')
    } else {
      // Otherwise, open the checkout page
      setSelectedProduct(link)
    }
  }

  const activeCustomLinks = profile.custom_links?.filter((link: any) => link.is_active) || []

  return (
    <div className="min-h-screen bg-white">
      {/* Desktop Layout */}
      <div className="hidden md:flex h-screen">
        {/* Fixed Header - Left Side */}
        <div className="w-[35%] bg-white fixed left-0 top-0 h-full overflow-y-auto border-r border-gray-200">
          <div className="h-full flex flex-col items-center justify-center p-8">
            <div className="flex-1 flex items-center justify-center">
              <StorefrontHeaderPreview
                profileImage={profile?.profile_image}
                displayName={profile?.display_name || username}
                bio={profile?.bio}
                socialIcons={profile?.social_icons || []}
                video={profile?.embedded_video}
                size="large"
              />
            </div>
            {/* Logo Footer */}
            <div className="pb-8 flex items-center gap-2">
              <Image
                src={logo}
                alt="Elevate Social logo"
                width={30}
                height={30}
                className="opacity-30 hover:opacity-50 transition-opacity"
              />
              <span className="text-gray-400 text-sm font-medium">elevate social</span>
            </div>
          </div>
        </div>

        {/* Scrollable Products/Checkout - Right Side */}
        <div className="flex-1 ml-[35%] bg-white overflow-y-auto">
          {selectedProduct ? (
            // Checkout View
            <div className="h-full">
              {/* Checkout Form - No Shadows */}
              <div className="flex-1 flex items-center justify-center p-8">
                <div className="max-w-2xl w-full relative">
                  {/* Back Button - Top Left of Image */}
                  <div className="absolute top-6 left-6 z-10">
                    <button
                      onClick={handleBackToProducts}
                      className="w-10 h-10 bg-white rounded-full shadow-md flex items-center justify-center text-gray-600 hover:text-gray-900 hover:shadow-lg transition-all"
                    >
                      <ArrowLeft className="w-5 h-5" />
                    </button>
                  </div>

                  <CheckoutForm
                    linkId={selectedProduct.id.toString()}
                    productType={selectedProduct.type || 'digital'}
                    thumbnail={selectedProduct.checkout_image || selectedProduct.thumbnail}
                    title={selectedProduct.title || selectedProduct.text}
                    subtitle={selectedProduct.subtitle}
                    checkoutTitle={selectedProduct.checkout_title}
                    checkoutDescription={selectedProduct.checkout_description}
                    checkoutBottomTitle={selectedProduct.checkout_bottom_title}
                    checkoutCtaButtonText={selectedProduct.checkout_cta_button_text}
                    price={selectedProduct.checkout_price}
                    discountedPrice={selectedProduct.checkout_discounted_price}
                    customFields={[]}
                    collectInfoFields={selectedProduct.collect_info_fields || []}
                    isActive={true}
                    className="overflow-hidden"
                    checkoutRedirectUrl={selectedProduct.type === 'opt_in' ? checkoutUrl : undefined}
                    onOrderSuccess={handleOrderSuccess}
                  />
                </div>
              </div>
            </div>
          ) : (
            // Products List View
            <div className={`h-full flex justify-center p-8 pb-16 ${activeCustomLinks.length === 1 ? 'items-center' : ''}`}>
              <div className="max-w-xs space-y-4 w-full">
                {activeCustomLinks.map((link: any) => (
                  <div key={link.id}
                    onClick={() => handleProductClick(link)}
                  >
                    <ProductCard
                      productType={link.type || 'digital'}
                      thumbnail={link.thumbnail}
                      title={link.title || link.text}
                      subtitle={link.subtitle}
                      displayStyle={link.style}
                      price={link.type === 'url_media' || link.type === 'opt_in' || link.type === 'iframe' ? undefined : link.checkout_price}
                      discountedPrice={link.type === 'url_media' || link.type === 'opt_in' || link.type === 'iframe' ? undefined : link.checkout_discounted_price}
                    />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Mobile Layout */}
      <div className="md:hidden">
        {selectedProduct ? (
          // Mobile Checkout View
          <div className="min-h-screen flex flex-col">
            {/* Back Button */}
            <div className="p-4 border-b border-gray-200 bg-white">
              <button
                onClick={handleBackToProducts}
                className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to Products
              </button>
            </div>

            {/* Mobile Checkout Form */}
            <div className="flex-1 overflow-y-auto p-4">
              <CheckoutForm
                linkId={selectedProduct.id.toString()}
                productType={selectedProduct.type || 'digital'}
                thumbnail={selectedProduct.checkout_image || selectedProduct.thumbnail}
                title={selectedProduct.title || selectedProduct.text}
                subtitle={selectedProduct.subtitle}
                checkoutTitle={selectedProduct.checkout_title}
                checkoutDescription={selectedProduct.checkout_description}
                checkoutBottomTitle={selectedProduct.checkout_bottom_title}
                checkoutCtaButtonText={selectedProduct.checkout_cta_button_text}
                price={selectedProduct.checkout_price}
                discountedPrice={selectedProduct.checkout_discounted_price}
                customFields={[]}
                collectInfoFields={selectedProduct.collect_info_fields || []}
                isActive={true}
                className="rounded-xl shadow-lg overflow-hidden"
                checkoutRedirectUrl={selectedProduct.type === 'opt_in' ? checkoutUrl : undefined}
                onOrderSuccess={handleOrderSuccess}
              />
            </div>
          </div>
        ) : (
          // Mobile Products List View
          <div className="max-w-sm mx-auto py-8">
            <div className="space-y-6">
              {/* Header */}
              <StorefrontHeaderPreview
                profileImage={profile?.profile_image}
                displayName={profile?.display_name || username}
                bio={profile?.bio}
                socialIcons={profile?.social_icons || []}
                video={profile?.embedded_video}
              />

              {/* Products */}
              <div className="space-y-4 px-4">
                {activeCustomLinks.map((link: any) => (
                  <div key={link.id}
                    className='mb-8'
                    onClick={() => handleProductClick(link)}
                  >
                    <ProductCard
                      productType={link.type || 'digital'}
                      thumbnail={link.thumbnail}
                      title={link.title || link.text}
                      subtitle={link.subtitle}
                      displayStyle="callout"
                      price={link.type === 'url_media' || link.type === 'opt_in' || link.type === 'iframe' ? undefined : link.checkout_price}
                      discountedPrice={link.type === 'url_media' || link.type === 'opt_in' || link.type === 'iframe' ? undefined : link.checkout_discounted_price}
                    />
                  </div>
                ))}
              </div>

              {/* Logo Footer */}
              <div className="flex items-center justify-center gap-2 pt-4 pb-8">
                <Image
                  src={logo}
                  alt="Elevate Social logo"
                  width={30}
                  height={30}
                  className="opacity-30 hover:opacity-50 transition-opacity"
                />
                <span className="text-gray-400 text-sm font-medium">elevate social</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}