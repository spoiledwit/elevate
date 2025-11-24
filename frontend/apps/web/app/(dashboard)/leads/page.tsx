import { LeadsManager } from './components/LeadsManager'
import { getOrdersAction, getCurrentProfileAction } from '@/actions'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Leads - Elevate Social',
  description: 'View and manage your product orders and customer leads'
}

export default async function LeadsPage() {
  // Fetch orders and profile server-side
  const [ordersResult, profileResult] = await Promise.all([
    getOrdersAction({ page: 1 }),
    getCurrentProfileAction()
  ])

  const orders = 'error' in ordersResult ? [] : (ordersResult.results || [])
  const totalCount = 'error' in ordersResult ? 0 : (ordersResult.count || 0)

  const profile = 'error' in profileResult ? null : profileResult
  const profileEmailAutomation = profile?.email_automation_enabled ?? true

  return (
    <div className="flex-1 bg-gray-50">
      <LeadsManager
        initialOrders={orders}
        initialPage={1}
        initialCount={totalCount}
        profileEmailAutomation={profileEmailAutomation}
      />
    </div>
  )
}