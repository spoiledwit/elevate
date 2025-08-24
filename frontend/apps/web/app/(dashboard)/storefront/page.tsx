import { StorefrontDashboard } from './components/StorefrontDashboard'
import {
  getCurrentProfileAction,
  getCustomLinksAction,
  getCTABannersAction,
  getDashboardStatsAction
} from '@/actions'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'My Storefront - Elevate Social',
  description: 'Manage your custom link-in-bio storefront'
}

export default async function StorefrontPage() {
  // Fetch all data server-side
  const [profileResult, linksResult, bannerResult, statsResult] = await Promise.all([
    getCurrentProfileAction(),
    getCustomLinksAction(),
    getCTABannersAction(),
    getDashboardStatsAction()
  ])

  const profile = 'error' in profileResult ? null : profileResult
  const customLinks = 'error' in linksResult ? [] : (linksResult.results || [])
  const banners = 'error' in bannerResult ? [] : (bannerResult.results || [])
  const ctaBanner = banners.length > 0 ? banners[0] : null
  const dashboardStats = 'error' in statsResult ? null : statsResult

  return (
    <div className="flex-1 bg-gray-50">
      <StorefrontDashboard 
        initialProfile={profile}
        initialCustomLinks={customLinks}
        initialCtaBanner={ctaBanner}
        initialDashboardStats={dashboardStats}
      />
    </div>
  )
}