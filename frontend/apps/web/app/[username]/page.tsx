import { notFound } from 'next/navigation'
import { PublicStorefront } from './components/PublicStorefront'
import { getPublicProfileAction, trackProfileViewAction } from '@/actions'
import type { Metadata } from 'next'

interface PublicStorefrontPageProps {
  params: Promise<{
    username: string
  }>
}

export async function generateMetadata({ params }: PublicStorefrontPageProps): Promise<Metadata> {
  const { username } = await params
  const profile = await getPublicProfileAction(username)

  if ('error' in profile) {
    return {
      title: 'Profile Not Found - Elevate Social'
    }
  }

  return {
    title: `${profile.display_name || username} - Elevate Social`,
    description: profile.bio || `Check out ${profile.display_name || username}'s links and content`,
    openGraph: {
      title: profile.display_name || username,
      description: profile.bio || `Check out my links and content`,
      images: profile.profile_image ? [
        {
          url: profile.profile_image,
          width: 400,
          height: 400,
          alt: `${profile.display_name || username}'s profile image`
        }
      ] : [],
      type: 'profile'
    },
    twitter: {
      card: 'summary',
      title: profile.display_name || username,
      description: profile.bio || `Check out my links and content`,
      images: profile.profile_image ? [profile.profile_image] : []
    }
  }
}

export default async function PublicStorefrontPage({ params }: PublicStorefrontPageProps) {
  const { username } = await params
  const profile = await getPublicProfileAction(username)

  if ('error' in profile) {
    notFound()
  }

  return <PublicStorefront username={username} profile={profile} />
}