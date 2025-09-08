'use client'

import { useEffect, useState } from 'react'
import {
  User,
  ExternalLink,
  Instagram,
  Facebook,
  Twitter,
  Linkedin,
  Youtube,
  Globe,
  MousePointerClick,
  Heart
} from 'lucide-react'
import { trackProfileViewAction, trackLinkClickAction, trackBannerClickAction } from '@/actions'

interface PublicStorefrontProps {
  username: string
  profile: any
}

const socialIcons = {
  instagram: { icon: Instagram, color: 'hover:text-pink-500' },
  facebook: { icon: Facebook, color: 'hover:text-blue-600' },
  twitter: { icon: Twitter, color: 'hover:text-blue-400' },
  linkedin: { icon: Linkedin, color: 'hover:text-blue-700' },
  youtube: { icon: Youtube, color: 'hover:text-red-600' },
  website: { icon: Globe, color: 'hover:text-gray-700' },
}

const bannerStyles = {
  'gradient-purple': {
    className: 'bg-gradient-to-r from-purple-500 to-purple-600',
    textColor: 'text-white'
  },
  'gradient-blue': {
    className: 'bg-gradient-to-r from-blue-500 to-blue-600',
    textColor: 'text-white'
  },
  'gradient-green': {
    className: 'bg-gradient-to-r from-green-500 to-green-600',
    textColor: 'text-white'
  },
  'gradient-orange': {
    className: 'bg-gradient-to-r from-orange-500 to-orange-600',
    textColor: 'text-white'
  },
  'solid-black': {
    className: 'bg-gray-900',
    textColor: 'text-white'
  },
  'solid-white': {
    className: 'bg-white border-2 border-gray-300',
    textColor: 'text-gray-900'
  }
}

export function PublicStorefront({ username, profile }: PublicStorefrontProps) {
  const [hasTrackedView, setHasTrackedView] = useState(false)
  const [clickedLinks, setClickedLinks] = useState<Set<string>>(new Set())

  // Track profile view on mount
  useEffect(() => {
    if (!hasTrackedView) {
      trackProfileView()
      setHasTrackedView(true)
    }
  }, [hasTrackedView])

  const trackProfileView = async () => {
    try {
      const userAgent = navigator.userAgent
      const referrer = document.referrer
      await trackProfileViewAction(username, userAgent, referrer)
    } catch (error) {
      console.error('Failed to track profile view:', error)
    }
  }

  const handleLinkClick = async (link: any) => {
    try {
      // Track the click
      const userAgent = navigator.userAgent
      const referrer = window.location.href
      await trackLinkClickAction(link.id.toString(), link.id, userAgent, referrer)

      // Mark as clicked for visual feedback
      //@ts-ignore
      setClickedLinks(prev => new Set([...prev, link.id.toString()]))

      // Navigate to the link
      window.open(link.url, '_blank', 'noopener,noreferrer')
    } catch (error) {
      console.error('Failed to track link click:', error)
      // Still navigate even if tracking fails
      window.open(link.url, '_blank', 'noopener,noreferrer')
    }
  }

  const activeSocialIcons = profile.social_icons?.filter((icon: any) => icon.is_active && icon.url) || []
  const activeCustomLinks = profile.custom_links?.filter((link: any) => link.is_active) || []
  const activeCTABanner = profile.cta_banner && profile.cta_banner.is_active ? profile.cta_banner : null

  // Get the banner style or default to gradient-purple
  const bannerStyle = activeCTABanner?.style ? bannerStyles[activeCTABanner.style as keyof typeof bannerStyles] : bannerStyles['gradient-purple']

  return (
    <div className="min-h-screen bg-white">
      {/* Modern Hero Section */}
      <div className="relative">
        {/* Subtle geometric background */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-50 rounded-full mix-blend-multiply opacity-70 animate-pulse"></div>
          <div className="absolute top-0 right-1/4 w-96 h-96 bg-purple-50 rounded-full mix-blend-multiply opacity-70 animate-pulse delay-1000"></div>
        </div>

        <div className="relative container mx-auto px-6 py-16 max-w-lg">
          {/* Profile Header */}
          <div className="text-center mb-12">
            {/* Profile Image */}
            <div className="relative mb-8">
              <div className="w-36 h-36 mx-auto rounded-full overflow-hidden border-4 border-white bg-white">
                {profile.profile_image ? (
                  <img
                    src={profile.profile_image}
                    alt={profile.display_name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center">
                    <User className="w-12 h-12 text-slate-500" />
                  </div>
                )}
              </div>
            </div>

            {/* Name and Bio */}
            <div className="space-y-4">
              <h1 className="text-3xl font-light text-slate-800 tracking-tight">
                {profile.display_name || username}
              </h1>

              {profile.bio && (
                <p className="text-slate-600 text-lg leading-relaxed max-w-md mx-auto font-light">
                  {profile.bio}
                </p>
              )}
            </div>
          </div>

          {/* Social Icons */}
          {activeSocialIcons.length > 0 && (
            <div className="flex justify-center gap-6 mb-12">
              {activeSocialIcons.slice(0, 6).map((socialIcon: any, index: number) => {
                const iconData = socialIcons[socialIcon.platform as keyof typeof socialIcons]
                if (!iconData) return null

                const IconComponent = iconData.icon
                return (
                  <a
                    key={index}
                    href={socialIcon.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-all duration-300 border border-slate-200"
                  >
                    <IconComponent className="w-5 h-5" />
                  </a>
                )
              })}
            </div>
          )}

          {/* Embedded Video */}
          {profile.embedded_video && (
            <div className="mb-12">
              <div className="rounded-3xl overflow-hidden border border-slate-200 bg-white">
                <div className="aspect-video">
                  <iframe
                    src={profile.embedded_video}
                    title="Embedded Video"
                    className="w-full h-full"
                    style={{ border: 0 }}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  ></iframe>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Content Section */}
      <div className="bg-slate-50 py-16">
        <div className="container mx-auto px-6 max-w-lg">

          {/* CTA Banner */}
          {activeCTABanner && bannerStyle && (
            <div className="mb-10">
              <div className={`${bannerStyle.className} rounded-2xl p-8 text-center relative overflow-hidden`}>
                <div className="relative z-10">
                  <p className={`${bannerStyle.textColor} text-xl font-light mb-6 leading-relaxed`}>
                    {activeCTABanner.text}
                  </p>
                  <button
                    onClick={async () => {
                      // Track the banner click and redirect
                      try {
                        const result = await trackBannerClickAction(activeCTABanner.id.toString())

                        // Check if tracking was successful and we got a redirect URL
                        if (result && !('error' in result) && (result as any).banner_url) {
                          window.location.href = (result as any).banner_url
                        } else if (activeCTABanner.button_url && activeCTABanner.button_url.trim()) {
                          // Fallback to original URL if tracking failed
                          window.location.href = activeCTABanner.button_url
                        } else {
                          console.warn('Banner URL is empty or invalid')
                        }
                      } catch (error) {
                        console.error('Failed to track banner click:', error)
                        // Fallback to original URL on error
                        if (activeCTABanner.button_url && activeCTABanner.button_url.trim()) {
                          window.location.href = activeCTABanner.button_url
                        }
                      }
                    }}
                    className={`${bannerStyle.textColor === 'text-white' ? 'bg-white text-slate-900 hover:bg-slate-50' : 'bg-slate-900 text-white hover:bg-slate-800'} px-8 py-4 rounded-xl font-medium transition-colors`}
                  >
                    {activeCTABanner.button_text}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Custom Links */}
          <div className="space-y-3">
            {activeCustomLinks.length > 0 ? (
              activeCustomLinks.slice(0, 10).map((link: any, index: number) => (
                <button
                  key={index}
                  onClick={() => handleLinkClick(link)}
                  className={`w-full bg-white rounded-2xl border border-slate-200 hover:border-slate-300 transition-all duration-300 p-6 group text-left ${clickedLinks.has(link.id.toString()) ? 'border-blue-300 bg-blue-50' : ''
                    }`}
                >
                  <div className="flex items-center gap-5">
                    {/* Thumbnail */}
                    {link.thumbnail && (
                      <div className="w-12 h-12 rounded-xl overflow-hidden bg-slate-100 flex-shrink-0">
                        <img
                          src={link.thumbnail}
                          alt=""
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}

                    {/* Link Content */}
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-slate-900 group-hover:text-slate-700 transition-colors truncate text-lg">
                        {link.text}
                      </h3>
                      {link.description && (
                        <p className="text-slate-500 truncate text-sm mt-1">
                          {link.description}
                        </p>
                      )}
                    </div>

                    {/* Arrow */}
                    <div className="flex-shrink-0">
                      <ExternalLink className="w-5 h-5 text-slate-400 group-hover:text-slate-600 transition-colors" />
                    </div>
                  </div>
                </button>
              ))
            ) : (
              <div className="text-center py-16">
                <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <ExternalLink className="w-8 h-8 text-slate-400" />
                </div>
                <p className="text-slate-500 font-light">No links available yet</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="bg-white border-t border-slate-100">
        <div className="text-center py-8">
          <div className="flex items-center justify-center gap-2 text-slate-400 text-sm">
            <Heart className="w-4 h-4" />
            <span>Powered by</span>
            <a
              href="https://elevate.social"
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-slate-600 hover:text-slate-800 transition-colors"
            >
              Elevate Social
            </a>
          </div>
        </div>
      </div>


    </div>
  )
}