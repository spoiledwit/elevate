import { authOptions } from '@/lib/auth'
import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import { DashboardLayout } from '@/components/dashboard/dashboard-layout'

export default async function DashboardLayoutWrapper({
  children
}: {
  children: React.ReactNode
}) {
  const session = await getServerSession(authOptions)

  if (session === null) {
    return redirect('/')
  }

  return (
    <DashboardLayout>
      {children}
    </DashboardLayout>
  )
}
