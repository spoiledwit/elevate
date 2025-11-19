import { getIframeMenuItemsAction } from '@/actions'
import { notFound } from 'next/navigation'
import IframeClient from './IframeClient'

interface PageProps {
  params: Promise<{
    slug: string
  }>
}

export default async function IframePage({ params }: PageProps) {
  const { slug } = await params

  // Fetch menu items on the server
  const result = await getIframeMenuItemsAction()

  if (!result || !('results' in result) || !result.results) {
    notFound()
  }

  const menuItem = result.results.find((item) => item.slug === slug)

  if (!menuItem) {
    notFound()
  }

  return <IframeClient menuItem={menuItem} />
}
