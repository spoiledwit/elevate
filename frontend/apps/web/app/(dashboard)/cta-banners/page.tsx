import { CTABannerManager } from './components/CTABannerManager'
import { getCTABannersAction } from '@/actions'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'CTA Banners - Elevate Social',
  description: 'Create and manage promotional banners for your storefront'
}

export default async function CTABannersPage() {
  // Fetch data server-side
  const bannerResult = await getCTABannersAction()
  const banners = 'error' in bannerResult ? [] : (bannerResult.results || [])
  const activeBanner = banners.find((banner: any) => banner.is_active) || null

  return (
    <div className="flex-1 bg-gray-50">
      <CTABannerManager 
        initialBanners={banners}
        initialActiveBanner={activeBanner}
      />
    </div>
  )
}