'use client'

import { 
  User, 
  ExternalLink, 
  Instagram,
  Facebook,
  Twitter,
  Linkedin,
  Youtube,
  Globe,
  Eye
} from 'lucide-react'

interface StorefrontPreviewProps {
  profile: any
  customLinks: any[]
  ctaBanner: any
}

const socialIcons = {
  instagram: Instagram,
  facebook: Facebook,
  twitter: Twitter,
  linkedin: Linkedin,
  youtube: Youtube,
  website: Globe,
}

export function StorefrontPreview({ profile, customLinks, ctaBanner }: StorefrontPreviewProps) {
  if (!profile) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-8">
        <div className="text-center">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Eye className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Preview Available</h3>
          <p className="text-gray-600">Complete your profile setup to see a preview of your storefront.</p>
        </div>
      </div>
    )
  }

  const activeSocialIcons = profile.social_icons?.filter((icon: any) => icon.is_active && icon.url) || []
  const activeCustomLinks = customLinks.filter(link => link.is_active)

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      {/* Preview Header */}
      <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
        <div className="flex items-center gap-2">
          <Eye className="w-4 h-4 text-gray-500" />
          <span className="text-sm font-medium text-gray-700">Storefront Preview</span>
        </div>
      </div>

      {/* Mobile Frame */}
      <div className="p-6">
        <div className="max-w-sm mx-auto bg-gray-900 rounded-3xl p-2 shadow-xl">
          <div className="bg-white rounded-2xl overflow-hidden">
            {/* Mobile Content */}
            <div className="p-6 space-y-6">
              {/* Profile Section */}
              <div className="text-center">
                <div className="w-20 h-20 mx-auto mb-4 rounded-full overflow-hidden bg-gray-100 flex items-center justify-center">
                  {profile.profile_image ? (
                    <img 
                      src={profile.profile_image} 
                      alt={profile.display_name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <User className="w-8 h-8 text-gray-400" />
                  )}
                </div>
                
                <h1 className="text-xl font-bold text-gray-900 mb-2">
                  {profile.display_name || 'Your Name'}
                </h1>
                
                {profile.bio && (
                  <p className="text-gray-600 text-sm leading-relaxed">
                    {profile.bio}
                  </p>
                )}
              </div>

              {/* Social Icons */}
              {activeSocialIcons.length > 0 && (
                <div className="flex justify-center gap-4">
                  {activeSocialIcons.slice(0, 6).map((socialIcon: any, index: number) => {
                    const IconComponent = socialIcons[socialIcon.platform as keyof typeof socialIcons] || Globe
                    return (
                      <div
                        key={index}
                        className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center hover:bg-gray-200 transition-colors cursor-pointer"
                      >
                        <IconComponent className="w-5 h-5 text-gray-600" />
                      </div>
                    )
                  })}
                </div>
              )}

              {/* Embedded Video */}
              {profile.embedded_video && (
                <div className="relative">
                  <div className="aspect-video rounded-lg overflow-hidden bg-gray-100">
                    <iframe
                      src={profile.embedded_video}
                      title="Video Preview"
                      className="w-full h-full"
                      style={{ border: 0 }}
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    ></iframe>
                  </div>
                </div>
              )}

              {/* CTA Banner */}
              {ctaBanner && ctaBanner.is_active && (() => {
                const bannerStyles = {
                  'gradient-purple': {
                    className: 'bg-gradient-to-r from-purple-500 to-purple-600',
                    textColor: 'text-white',
                    buttonStyle: 'bg-white text-purple-600'
                  },
                  'gradient-blue': {
                    className: 'bg-gradient-to-r from-blue-500 to-blue-600',
                    textColor: 'text-white',
                    buttonStyle: 'bg-white text-blue-600'
                  },
                  'gradient-green': {
                    className: 'bg-gradient-to-r from-green-500 to-green-600',
                    textColor: 'text-white',
                    buttonStyle: 'bg-white text-green-600'
                  },
                  'gradient-orange': {
                    className: 'bg-gradient-to-r from-orange-500 to-orange-600',
                    textColor: 'text-white',
                    buttonStyle: 'bg-white text-orange-600'
                  },
                  'solid-black': {
                    className: 'bg-gray-900',
                    textColor: 'text-white',
                    buttonStyle: 'bg-white text-gray-900'
                  },
                  'solid-white': {
                    className: 'bg-white border-2 border-gray-300',
                    textColor: 'text-gray-900',
                    buttonStyle: 'bg-gray-900 text-white'
                  }
                }
                
                const bannerStyle = ctaBanner.style && bannerStyles[ctaBanner.style as keyof typeof bannerStyles] 
                  ? bannerStyles[ctaBanner.style as keyof typeof bannerStyles] 
                  : bannerStyles['gradient-purple']
                
                return (
                  <div className={`${bannerStyle.className} rounded-lg p-4 text-center`}>
                    <p className={`font-medium mb-2 ${bannerStyle.textColor}`}>{ctaBanner.text}</p>
                    <div className={`${bannerStyle.buttonStyle} px-4 py-2 rounded-md font-semibold text-sm inline-block`}>
                      {ctaBanner.button_text}
                    </div>
                  </div>
                )
              })()}

              {/* Custom Links */}
              <div className="space-y-3">
                {activeCustomLinks.length > 0 ? (
                  activeCustomLinks.slice(0, 10).map((link: any, index: number) => (
                    <div
                      key={index}
                      className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
                    >
                      {link.thumbnail && (
                        <div className="w-10 h-10 rounded-md overflow-hidden bg-gray-200 flex-shrink-0">
                          <img 
                            src={link.thumbnail} 
                            alt=""
                            className="w-full h-full object-cover"
                          />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-900 text-sm truncate">
                          {link.text}
                        </p>
                      </div>
                      <ExternalLink className="w-4 h-4 text-gray-400 flex-shrink-0" />
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8">
                    <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                      <ExternalLink className="w-5 h-5 text-gray-400" />
                    </div>
                    <p className="text-sm text-gray-500 mb-1">No links added yet</p>
                    <p className="text-xs text-gray-400">Add custom links to see them here</p>
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="text-center pt-4 border-t border-gray-100">
                <p className="text-xs text-gray-400">
                  Powered by Elevate Social
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Preview Info */}
      <div className="p-4 bg-gray-50 border-t border-gray-200">
        <p className="text-sm text-gray-600 text-center">
          This is how your storefront will look to visitors on mobile devices
        </p>
      </div>
    </div>
  )
}