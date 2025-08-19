import { DashboardHeader } from '@/components/dashboard/dashboard-header'
import { AnalyticsOverview } from '@/components/dashboard/analytics-overview'
import { StartGuide } from '@/components/dashboard/start-guide'
import { QuickActions } from '@/components/dashboard/quick-actions'
import { ConnectPromoBanner } from '@/components/dashboard/connect-promo-banner'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Dashboard - Elevate Social'
}

export default function Dashboard() {
  return (
    <div className="flex-1 bg-gray-50">
      <DashboardHeader />
      
      <div className="p-6">
        <div className="max-w-7xl mx-auto space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main content area */}
            <div className="lg:col-span-2 space-y-6">
              <StartGuide />
              <AnalyticsOverview />
              <ConnectPromoBanner />
            </div>
            
            {/* Sidebar */}
            <div className="space-y-6">
              <QuickActions />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}