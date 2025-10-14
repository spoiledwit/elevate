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

          {/* Elevate Community */}
          <div className="bg-white rounded-lg shadow-sm overflow-hidden">
            <div className="p-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Elevate Community</h3>
            </div>
            <div className="relative" style={{ height: '800px' }}>
              <iframe
                src="https://highticketpurpose.app.clientclub.net/communities/groups/high-ticket-purpose/home"
                className="w-full h-full border-0"
                title="Elevate Community"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}