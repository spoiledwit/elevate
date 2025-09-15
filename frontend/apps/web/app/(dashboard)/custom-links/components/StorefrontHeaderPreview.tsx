'use client'

import { User, Globe } from 'lucide-react'
import { 
  FaInstagram, 
  FaFacebook, 
  FaTwitter, 
  FaLinkedin, 
  FaYoutube,
  FaTiktok,
  FaSnapchat,
  FaPinterest,
  FaTwitch,
  FaDiscord,
  FaTelegram,
  FaWhatsapp,
  FaReddit,
  FaTumblr,
  FaMedium,
  FaGithub,
  FaDribbble,
  FaBehance,
  FaSpotify,
  FaSoundcloud,
  FaEnvelope
} from 'react-icons/fa'

// Custom X (Twitter) icon component
const XIcon = ({ className }: { className?: string }) => (
  <svg
    className={className}
    viewBox="0 0 24 24"
    fill="currentColor"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
  </svg>
)

interface StorefrontHeaderPreviewProps {
  profileImage?: string
  displayName?: string
  bio?: string
  socialIcons?: Array<{
    platform: string
    url: string
    is_active: boolean
  }>
  video?: string
  className?: string
  size?: 'small' | 'large'
}

const socialIconComponents = {
  instagram: FaInstagram,
  facebook: FaFacebook,
  twitter: XIcon,
  linkedin: FaLinkedin,
  youtube: FaYoutube,
  tiktok: FaTiktok,
  snapchat: FaSnapchat,
  pinterest: FaPinterest,
  twitch: FaTwitch,
  discord: FaDiscord,
  telegram: FaTelegram,
  whatsapp: FaWhatsapp,
  reddit: FaReddit,
  tumblr: FaTumblr,
  medium: FaMedium,
  github: FaGithub,
  dribbble: FaDribbble,
  behance: FaBehance,
  spotify: FaSpotify,
  soundcloud: FaSoundcloud,
  email: FaEnvelope,
  website: Globe,
}

export function StorefrontHeaderPreview({
  profileImage,
  displayName = 'Your Storefront',
  bio = 'Product preview',
  socialIcons = [],
  video,
  className = '',
  size = 'small'
}: StorefrontHeaderPreviewProps) {
  const activeSocialIcons = socialIcons.filter(icon => icon.is_active && icon.url)

  // Convert YouTube/Vimeo URLs to embed URLs
  const getEmbedUrl = (url: string) => {
    if (!url) return null
    
    // YouTube URL patterns
    const youtubeMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/)
    if (youtubeMatch) {
      return `https://www.youtube.com/embed/${youtubeMatch[1]}`
    }
    
    // Vimeo URL patterns
    const vimeoMatch = url.match(/(?:vimeo\.com\/)([0-9]+)/)
    if (vimeoMatch) {
      return `https://player.vimeo.com/video/${vimeoMatch[1]}`
    }
    
    return null
  }

  const embedUrl = video ? getEmbedUrl(video) : null

  // Size-based styling
  const imageSize = size === 'large' ? 'w-36 h-36' : 'w-24 h-24'
  const userIconSize = size === 'large' ? 'w-16 h-16' : 'w-10 h-10'
  const titleSize = size === 'large' ? 'text-2xl' : 'text-2xl'

  return (
    <div className={`text-center space-y-6 ${className}`}>
      {/* Profile Image */}
      <div className={`${imageSize} mx-auto rounded-full overflow-hidden bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center shadow-lg ring-4 ring-white`}>
        {profileImage ? (
          <img 
            src={profileImage} 
            alt={displayName}
            className="w-full h-full object-cover"
          />
        ) : (
          <User className={`${userIconSize} text-gray-500`} />
        )}
      </div>
      
      {/* Display Name */}
      <div className="space-y-2">
        <h1 className={`${titleSize} font-bold text-gray-900 tracking-tight`}>
          {displayName}
        </h1>
        
        {/* Bio */}
        {bio && (
          <p className="text-gray-600 text-base leading-relaxed max-w-xs mx-auto">
            {bio}
          </p>
        )}
      </div>

      {/* Video */}
      {embedUrl && (
        <div className="px-4">
          <div className="aspect-video bg-gray-100 rounded-xl overflow-hidden shadow-md">
            <iframe
              src={embedUrl}
              className="w-full h-full"
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
        </div>
      )}

      {/* Social Icons */}
      {activeSocialIcons.length > 0 && (
        <div className="pt-0">
          <div className="flex justify-center gap-2 flex-wrap">
            {activeSocialIcons.map((socialIcon, index) => {
              const IconComponent = socialIconComponents[socialIcon.platform as keyof typeof socialIconComponents] || Globe
              return (
                <a
                  key={index}
                  href={socialIcon.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-10 h-10 bg-white rounded-lg shadow-md flex items-center justify-center hover:shadow-lg hover:scale-105 transition-all duration-200 border border-gray-100"
                >
                  <IconComponent className="w-4 h-4 text-gray-700" />
                </a>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}