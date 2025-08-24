import { CustomLinksManager } from './components/CustomLinksManager'
import { getCustomLinksAction } from '@/actions'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Custom Links - Elevate Social',
  description: 'Manage your custom storefront links and buttons'
}

export default async function CustomLinksPage() {
  // Fetch data server-side
  const linksResult = await getCustomLinksAction()
  const links = 'error' in linksResult ? [] : (linksResult.results || [])

  return (
    <div className="flex-1 bg-gray-50">
      <CustomLinksManager initialLinks={links} />
    </div>
  )
}