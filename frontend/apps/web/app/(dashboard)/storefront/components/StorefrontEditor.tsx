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
  Instagram,
  Facebook,
  Linkedin,
  Youtube,
  Globe
} from 'lucide-react'
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
  { key: 'instagram', label: 'Instagram', icon: Instagram, placeholder: 'https://instagram.com/username' },
  { key: 'facebook', label: 'Facebook', icon: Facebook, placeholder: 'https://facebook.com/username' },
  { key: 'twitter', label: 'X', icon: XIcon, placeholder: 'https://x.com/username' },
  { key: 'linkedin', label: 'LinkedIn', icon: Linkedin, placeholder: 'https://linkedin.com/in/username' },
  { key: 'youtube', label: 'YouTube', icon: Youtube, placeholder: 'https://youtube.com/c/username' },
  { key: 'website', label: 'Website', icon: Globe, placeholder: 'https://yourwebsite.com' },
]

export function StorefrontEditor({ profile, onUpdate }: StorefrontEditorProps) {
  const [formData, setFormData] = useState({
    display_name: profile?.display_name || '',
    bio: profile?.bio || '',
    embedded_video: profile?.embedded_video || '',
    is_active: profile?.is_active ?? true,
  })

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
    reader.onload = (e) => setImagePreview(e.target?.result as string)
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
  }

  const handleSocialLinkChange = (platform: string, url: string) => {
    setSocialLinks(prev => ({ ...prev, [platform]: url }))
  }

  const removeImage = () => {
    setImagePreview('')
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200">
      <div className="p-6 border-b border-gray-200">
        <h2 className="text-xl font-semibold text-gray-900">Profile Settings</h2>
        <p className="text-gray-600 mt-1">Customize how your storefront appears to visitors</p>
      </div>

      <div className="p-6 space-y-8">
        {/* Profile Image Section */}
        <div>
          <label className="block text-sm font-semibold text-gray-900 mb-4">Profile Image</label>
          <div className="flex items-center gap-6">
            <div className="relative">
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
              {isLoading && (
                <div className="absolute inset-0 bg-black bg-opacity-50 rounded-full flex items-center justify-center">
                  <Loader2 className="w-6 h-6 text-white animate-spin" />
                </div>
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
              <button
                onClick={() => fileInputRef.current?.click()}
                className="inline-flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium"
              >
                <Camera className="w-4 h-4" />
                Upload Image
              </button>
              {imagePreview && (
                <button
                  onClick={removeImage}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium"
                >
                  <X className="w-4 h-4" />
                  Remove
                </button>
              )}
              <p className="text-xs text-gray-500">JPG, PNG or GIF (max 5MB)</p>
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
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
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
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>
            <p className="text-xs text-gray-500 mt-1">Add a welcome video to your storefront</p>
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
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
            />
          </div>
          <div className="flex justify-between items-center mt-1">
            <p className="text-xs text-gray-500">Describe what you do and what visitors can expect</p>
            <span className="text-xs text-gray-400">{formData.bio.length}/500</span>
          </div>
        </div>

        {/* Social Links Section */}
        <div>
          <label className="block text-sm font-semibold text-gray-900 mb-4">Social Media Links</label>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {socialPlatforms.map((platform) => {
              const Icon = platform.icon
              return (
                <div key={platform.key}>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Icon className="w-4 h-4 inline mr-2" />
                    {platform.label}
                  </label>
                  <input
                    type="url"
                    value={socialLinks[platform.key] || ''}
                    onChange={(e) => handleSocialLinkChange(platform.key, e.target.value)}
                    placeholder={platform.placeholder}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>
              )
            })}
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