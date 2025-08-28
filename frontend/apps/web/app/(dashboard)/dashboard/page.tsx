import { DashboardHeader } from '@/components/dashboard/dashboard-header'
import { AnalyticsOverview } from '@/components/dashboard/analytics-overview'
import { getDashboardStatsAction } from '@/actions'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Dashboard - Elevate Social'
}

export default async function Dashboard() {
  // Fetch data server-side
  const statsResult = await getDashboardStatsAction()
  const dashboardStats = 'error' in statsResult ? null : statsResult

  return (
    <div className="flex-1 bg-gray-50">
      <DashboardHeader />

      <div className="p-6">
        <div className="max-w-7xl mx-auto space-y-6">
          <AnalyticsOverview initialStats={dashboardStats} />
        </div>
      </div>
    </div>
  )
}