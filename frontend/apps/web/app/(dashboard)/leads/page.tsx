import { LeadsManager } from './components/LeadsManager'
import { getOrdersAction } from '@/actions'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Leads - Elevate Social',
  description: 'View and manage your product orders and customer leads'
}

export default async function LeadsPage() {
  // Fetch orders server-side
  const ordersResult = await getOrdersAction({ page: 1 })
  const orders = 'error' in ordersResult ? [] : (ordersResult.results || [])
  const totalCount = 'error' in ordersResult ? 0 : (ordersResult.count || 0)

  return (
    <div className="flex-1 bg-gray-50">
      <LeadsManager
        initialOrders={orders}
        initialPage={1}
        initialCount={totalCount}
      />
    </div>
  )
}