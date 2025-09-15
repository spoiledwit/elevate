'use client'

import { useState, useRef } from 'react'
import {
  Camera,
  Save,
  Upload,
  X,
  User,
  FileText,
  Video,
  Loader2,
  Check,
  Globe,
  ChevronDown,
  ChevronUp
} from 'lucide-react'
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
import {
  updateProfileAction,
  uploadProfileImageAction,
  createProfileImageFormData,
  createSocialIconAction,
  updateSocialIconAction,
  deleteSocialIconAction
} from '@/actions'

interface StorefrontEditorProps {
  profile: any
  onUpdate: () => void
  onPreviewUpdate?: {
    setProfileImage: (image: string) => void
    setDisplayName: (name: string) => void
    setBio: (bio: string) => void
    setSocialIcons: (icons: any[]) => void
    setVideo: (video: string) => void
  }
}

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

const socialPlatforms = [
  { key: 'instagram', label: 'Instagram', icon: FaInstagram, color: '#E4405F', placeholder: 'https://instagram.com/username' },
  { key: 'facebook', label: 'Facebook', icon: FaFacebook, color: '#1877F2', placeholder: 'https://facebook.com/username' },
  { key: 'twitter', label: 'X', icon: XIcon, color: '#000000', placeholder: 'https://x.com/username' },
  { key: 'linkedin', label: 'LinkedIn', icon: FaLinkedin, color: '#0A66C2', placeholder: 'https://linkedin.com/in/username' },
  { key: 'youtube', label: 'YouTube', icon: FaYoutube, color: '#FF0000', placeholder: 'https://youtube.com/c/username' },
  { key: 'tiktok', label: 'TikTok', icon: FaTiktok, color: '#000000', placeholder: 'https://tiktok.com/@username' },
  { key: 'snapchat', label: 'Snapchat', icon: FaSnapchat, color: '#FFFC00', placeholder: 'https://snapchat.com/add/username' },
  { key: 'pinterest', label: 'Pinterest', icon: FaPinterest, color: '#BD081C', placeholder: 'https://pinterest.com/username' },
  { key: 'twitch', label: 'Twitch', icon: FaTwitch, color: '#9146FF', placeholder: 'https://twitch.tv/username' },
  { key: 'discord', label: 'Discord', icon: FaDiscord, color: '#5865F2', placeholder: 'https://discord.gg/username' },
  { key: 'telegram', label: 'Telegram', icon: FaTelegram, color: '#0088CC', placeholder: 'https://t.me/username' },
  { key: 'whatsapp', label: 'WhatsApp', icon: FaWhatsapp, color: '#25D366', placeholder: 'https://wa.me/phonenumber' },
  { key: 'reddit', label: 'Reddit', icon: FaReddit, color: '#FF4500', placeholder: 'https://reddit.com/u/username' },
  { key: 'tumblr', label: 'Tumblr', icon: FaTumblr, color: '#001935', placeholder: 'https://username.tumblr.com' },
  { key: 'medium', label: 'Medium', icon: FaMedium, color: '#000000', placeholder: 'https://medium.com/@username' },
  { key: 'github', label: 'GitHub', icon: FaGithub, color: '#181717', placeholder: 'https://github.com/username' },
  { key: 'dribbble', label: 'Dribbble', icon: FaDribbble, color: '#EA4C89', placeholder: 'https://dribbble.com/username' },
  { key: 'behance', label: 'Behance', icon: FaBehance, color: '#1769FF', placeholder: 'https://behance.net/username' },
  { key: 'spotify', label: 'Spotify', icon: FaSpotify, color: '#1DB954', placeholder: 'https://open.spotify.com/user/username' },
  { key: 'soundcloud', label: 'SoundCloud', icon: FaSoundcloud, color: '#FF3300', placeholder: 'https://soundcloud.com/username' },
  { key: 'email', label: 'Email', icon: FaEnvelope, color: '#6B7280', placeholder: 'mailto:your.email@example.com' },
  { key: 'website', label: 'Website', icon: Globe, color: '#6B7280', placeholder: 'https://yourwebsite.com' },
]

export function StorefrontEditor({ profile, onUpdate, onPreviewUpdate }: StorefrontEditorProps) {
  const [formData, setFormData] = useState({
    display_name: profile?.display_name || '',
    bio: profile?.bio || '',
    embedded_video: profile?.embedded_video || '',
    is_active: profile?.is_active ?? true,
  })

  const [showAllSocials, setShowAllSocials] = useState(false)

  const [socialLinks, setSocialLinks] = useState<Record<string, string>>(
    profile?.social_icons?.reduce((acc: any, icon: any) => {
      acc[icon.platform] = icon.url
      return acc
    }, {}) || {}
  )

  // Keep track of existing social icons for updates
  const [existingSocialIcons, setExistingSocialIcons] = useState<Record<string, any>>(
    profile?.social_icons?.reduce((acc: any, icon: any) => {
      acc[icon.platform] = icon
      return acc
    }, {}) || {}
  )

  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [saveSuccess, setSaveSuccess] = useState(false)
  const [imagePreview, setImagePreview] = useState(profile?.profile_image || '')
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    // Show preview immediately
    const reader = new FileReader()
    reader.onload = (e) => {
      const imageUrl = e.target?.result as string
      setImagePreview(imageUrl)
      // Update preview in real-time
      if (onPreviewUpdate) {
        onPreviewUpdate.setProfileImage(imageUrl)
      }
    }
    reader.readAsDataURL(file)

    try {
      setIsLoading(true)
      const formData = await createProfileImageFormData(file)
      const result = await uploadProfileImageAction(formData)

      if ('error' in result) {
        console.error('Error uploading image:', result.error)
        setImagePreview(profile?.profile_image || '')
      } else {
        onUpdate()
      }
    } catch (error) {
      console.error('Error uploading image:', error)
      setImagePreview(profile?.profile_image || '')
    } finally {
      setIsLoading(false)
    }
  }

  const handleSave = async () => {
    try {
      setIsSaving(true)
      
      // Save profile data first
      const profileResult = await updateProfileAction(formData)
      
      if ('error' in profileResult) {
        console.error('Error saving profile:', profileResult.error)
        return
      }
      
      // Save social links
      const socialLinkPromises = []
      
      for (const [platform, url] of Object.entries(socialLinks)) {
        if (url && url.trim() !== '') {
          // Check if this social icon already exists
          const existingIcon = existingSocialIcons[platform]
          
          if (existingIcon) {
            // Update existing social icon
            socialLinkPromises.push(
              updateSocialIconAction(existingIcon.id.toString(), {
                platform: platform as any,
                url: url,
                is_active: true
              })
            )
          } else {
            // Create new social icon
            socialLinkPromises.push(
              createSocialIconAction({
                platform: platform as any,
                url: url,
                is_active: true
              })
            )
          }
        } else if (existingSocialIcons[platform]) {
          // If URL is empty but we had an existing icon, delete it
          socialLinkPromises.push(
            deleteSocialIconAction(existingSocialIcons[platform].id.toString())
          )
        }
      }
      
      // Execute all social link operations
      const socialResults = await Promise.all(socialLinkPromises)
      
      // Check if any social link operations failed
      const failedSocialOps = socialResults.filter(result => 'error' in result)
      if (failedSocialOps.length > 0) {
        console.error('Some social links failed to save:', failedSocialOps)
      }
      
      setSaveSuccess(true)
      onUpdate()
      setTimeout(() => setSaveSuccess(false), 2000)
    } catch (error) {
      console.error('Error saving profile:', error)
    } finally {
      setIsSaving(false)
    }
  }

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    
    // Update preview in real-time
    if (onPreviewUpdate) {
      if (field === 'display_name' && typeof value === 'string') {
        onPreviewUpdate.setDisplayName(value)
      } else if (field === 'bio' && typeof value === 'string') {
        onPreviewUpdate.setBio(value)
      } else if (field === 'embedded_video' && typeof value === 'string') {
        onPreviewUpdate.setVideo(value)
      }
    }
  }

  const handleSocialLinkChange = (platform: string, url: string) => {
    setSocialLinks(prev => ({ ...prev, [platform]: url }))
    
    // Update existing social icons state
    if (url) {
      setExistingSocialIcons(prev => ({
        ...prev,
        [platform]: { platform, url, is_active: true }
      }))
    } else {
      // Remove icon if URL is empty
      setExistingSocialIcons(prev => {
        const updated = { ...prev }
        delete updated[platform]
        return updated
      })
    }
    
    // Update preview social icons in real-time
    if (onPreviewUpdate) {
      // Get all current social icons including the one being updated
      const allIcons = { ...existingSocialIcons }
      
      if (url) {
        allIcons[platform] = { platform, url, is_active: true }
      } else {
        delete allIcons[platform]
      }
      
      const updatedSocialIcons = Object.values(allIcons).filter((icon: any) => icon.is_active && icon.url)
      onPreviewUpdate.setSocialIcons(updatedSocialIcons)
    }
  }

  const removeImage = () => {
    setImagePreview('')
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
    // Update preview to remove image
    if (onPreviewUpdate) {
      onPreviewUpdate.setProfileImage('')
    }
  }

  return (
    <div 
      className="bg-white rounded-xl"
      style={{ boxShadow: 'rgba(0, 0, 0, 0.02) 0px 2px 8px' }}
    >
      <div className="p-6 border-b border-gray-200">
        <h2 className="text-xl font-semibold text-gray-900">Header</h2>
      </div>

      <div className="p-6 space-y-4">
        {/* Profile Image Section */}
        <div>
          <label className="block text-sm font-semibold text-gray-900 mb-4">Profile Image</label>
          <div className="flex items-start gap-6">
            <div 
              className="relative group cursor-pointer" 
              onClick={() => fileInputRef.current?.click()}
            >
              <div className="w-24 h-24 rounded-full overflow-hidden bg-gray-100 flex items-center justify-center">
                {imagePreview ? (
                  <img
                    src={imagePreview}
                    alt="Profile"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <User className="w-8 h-8 text-gray-400" />
                )}
              </div>
              {/* Edit Overlay */}
              <div className="absolute inset-0 bg-black/60 rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                {isLoading ? (
                  <Loader2 className="w-6 h-6 text-white animate-spin" />
                ) : (
                  <Camera className="w-6 h-6 text-white drop-shadow-lg" />
                )}
              </div>
              {/* Remove button - small X in top right */}
              {imagePreview && (
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    removeImage()
                  }}
                  className="absolute -top-1 -right-1 w-6 h-6 bg-gray-600 hover:bg-gray-700 text-white rounded-full flex items-center justify-center transition-colors shadow-md"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>

            <div className="flex flex-col gap-2">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
              />
            </div>
          </div>
        </div>

        {/* Basic Info Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">
              Display Name
            </label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={formData.display_name}
                onChange={(e) => handleInputChange('display_name', e.target.value)}
                placeholder="Your display name"
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none transition-all duration-300 ease-in-out"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">
              Video URL
            </label>
            <div className="relative">
              <Video className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="url"
                value={formData.embedded_video}
                onChange={(e) => handleInputChange('embedded_video', e.target.value)}
                placeholder="YouTube or Vimeo URL"
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none transition-all duration-300 ease-in-out"
              />
            </div>
          </div>
        </div>

        {/* Bio Section */}
        <div>
          <label className="block text-sm font-semibold text-gray-900 mb-2">Bio</label>
          <div className="relative">
            <FileText className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
            <textarea
              value={formData.bio}
              onChange={(e) => handleInputChange('bio', e.target.value)}
              placeholder="Tell visitors about yourself..."
              rows={4}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none transition-all duration-300 ease-in-out resize-none"
            />
          </div>
          <div className="flex justify-end items-center mt-1">
            <span className="text-xs text-gray-400">{formData.bio.length}/500</span>
          </div>
        </div>

        {/* Social Links Section */}
        <div>
          <label className="block text-lg font-semibold text-gray-900 mb-4">Social Media Links</label>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {(showAllSocials ? socialPlatforms : socialPlatforms.slice(0, 6)).map((platform) => {
              const IconComponent = platform.icon
              return (
                <div key={platform.key}>
                  <div className="relative">
                    <IconComponent 
                      className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4" 
                      style={{ color: platform.color }}
                    />
                    <span className="absolute left-9 top-1/2 transform -translate-y-1/2 text-xs text-gray-500">
                      URL
                    </span>
                    <input
                      type="url"
                      value={socialLinks[platform.key] || ''}
                      onChange={(e) => handleSocialLinkChange(platform.key, e.target.value)}
                      placeholder={platform.placeholder}
                      className="w-full pl-16 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none transition-all duration-300 ease-in-out"
                    />
                  </div>
                </div>
              )
            })}
          </div>
          <div className="flex justify-center mt-4">
            <button
              type="button"
              onClick={() => setShowAllSocials(!showAllSocials)}
              className="flex items-center gap-2 text-base text-purple-600 hover:text-purple-700 font-medium"
            >
              {showAllSocials ? 'Show Less' : 'View More'}
              {showAllSocials ? (
                <ChevronUp className="w-4 h-4" />
              ) : (
                <ChevronDown className="w-4 h-4" />
              )}
            </button>
          </div>
        </div>

        {/* Status Toggle */}
        <div>
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div>
              <h3 className="font-medium text-gray-900">Storefront Status</h3>
              <p className="text-sm text-gray-600">
                {formData.is_active ? 'Your storefront is live and visible to visitors' : 'Your storefront is hidden from visitors'}
              </p>
            </div>
            <button
              onClick={() => handleInputChange('is_active', !formData.is_active)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${formData.is_active ? 'bg-purple-600' : 'bg-gray-200'
                }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${formData.is_active ? 'translate-x-6' : 'translate-x-1'
                  }`}
              />
            </button>
          </div>
        </div>

        {/* Save Button */}
        <div className="flex justify-end pt-4 border-t border-gray-200">
          <button
            onClick={handleSave}
            disabled={isSaving}
            className={`inline-flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-all ${saveSuccess
              ? 'bg-green-600 text-white'
              : 'bg-purple-600 hover:bg-purple-700 text-white disabled:opacity-50 disabled:cursor-not-allowed'
              }`}
          >
            {isSaving ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : saveSuccess ? (
              <Check className="w-4 h-4" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            {isSaving ? 'Saving...' : saveSuccess ? 'Saved!' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  )
}