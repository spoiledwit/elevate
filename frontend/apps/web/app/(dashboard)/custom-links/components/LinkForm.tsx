'use client'

import { useState, useRef } from 'react'
import { 
  X, 
  Save, 
  Link, 
  Type, 
  Upload, 
  Image as ImageIcon,
  Eye,
  EyeOff,
  Loader2,
  ExternalLink
} from 'lucide-react'
import { 
  createCustomLinkAction,
  updateCustomLinkAction,
  createCustomLinkWithFileAction,
  updateCustomLinkWithFileAction,
  createCustomLinkFormData
} from '@/actions'
import { validateUrl } from '@/lib/storefront-utils'

interface LinkFormProps {
  link?: any
  onClose: () => void
  onComplete: () => void
}

export function LinkForm({ link, onClose, onComplete }: LinkFormProps) {
  const [formData, setFormData] = useState({
    text: link?.text || '',
    url: link?.url || '',
    is_active: link?.is_active ?? true,
  })
  
  const [thumbnail, setThumbnail] = useState<File | null>(null)
  const [thumbnailPreview, setThumbnailPreview] = useState(link?.thumbnail || '')
  const [isLoading, setIsLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }))
    }
  }

  const handleThumbnailSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      setThumbnail(file)
      // Show preview
      const reader = new FileReader()
      reader.onload = (e) => setThumbnailPreview(e.target?.result as string)
      reader.readAsDataURL(file)
    }
  }

  const removeThumbnail = () => {
    setThumbnail(null)
    setThumbnailPreview('')
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.text.trim()) {
      newErrors.text = 'Link text is required'
    } else if (formData.text.length > 100) {
      newErrors.text = 'Link text must be 100 characters or less'
    }

    if (!formData.url.trim()) {
      newErrors.url = 'URL is required'
    } else if (!validateUrl(formData.url)) {
      newErrors.url = 'Please enter a valid URL (include https://)'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) {
      return
    }

    try {
      setIsLoading(true)

      let result

      // If we have a thumbnail file, use FormData
      if (thumbnail) {
        const formDataObj = await createCustomLinkFormData(formData, thumbnail)
        
        if (link) {
          // Update existing link with file
          result = await updateCustomLinkWithFileAction(link.id, formDataObj)
        } else {
          // Create new link with file
          result = await createCustomLinkWithFileAction(formDataObj)
        }
      } else {
        // No thumbnail file, use regular JSON submission
        const submitData = { ...formData }

        if (link) {
          // Update existing link without file
          result = await updateCustomLinkAction(link.id, submitData)
        } else {
          // Create new link without file
          result = await createCustomLinkAction(submitData)
        }
      }

      if ('error' in result) {
        console.error('Error saving link:', result.error)
        setErrors({ general: result.error })
      } else {
        onComplete()
      }
    } catch (error) {
      console.error('Error saving link:', error)
      setErrors({ general: 'Failed to save link. Please try again.' })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <Link className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                {link ? 'Edit Link' : 'Add New Link'}
              </h2>
              <p className="text-sm text-gray-600">
                Create a custom button for your storefront
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* General Error */}
          {errors.general && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-sm font-medium text-red-800">{errors.general}</p>
            </div>
          )}

          {/* Link Text */}
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">
              Button Text *
            </label>
            <div className="relative">
              <Type className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={formData.text}
                onChange={(e) => handleInputChange('text', e.target.value)}
                placeholder="e.g., Visit My Website, Shop Now, Contact Me"
                className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent ${
                  errors.text ? 'border-red-300' : 'border-gray-300'
                }`}
                maxLength={100}
              />
            </div>
            {errors.text && (
              <p className="mt-1 text-sm text-red-600">{errors.text}</p>
            )}
            <div className="flex justify-between items-center mt-1">
              <p className="text-xs text-gray-500">
                This text will appear on the button
              </p>
              <span className="text-xs text-gray-400">{formData.text.length}/100</span>
            </div>
          </div>

          {/* URL */}
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">
              Destination URL *
            </label>
            <div className="relative">
              <Link className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="url"
                value={formData.url}
                onChange={(e) => handleInputChange('url', e.target.value)}
                placeholder="https://example.com"
                className={`w-full pl-10 pr-12 py-3 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent ${
                  errors.url ? 'border-red-300' : 'border-gray-300'
                }`}
              />
              {formData.url && validateUrl(formData.url) && (
                <a
                  href={formData.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  title="Test link"
                >
                  <ExternalLink className="w-4 h-4" />
                </a>
              )}
            </div>
            {errors.url && (
              <p className="mt-1 text-sm text-red-600">{errors.url}</p>
            )}
            <p className="text-xs text-gray-500 mt-1">
              Include https:// for external links
            </p>
          </div>

          {/* Thumbnail */}
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">
              Button Thumbnail (Optional)
            </label>
            
            {thumbnailPreview ? (
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                  <img 
                    src={thumbnailPreview} 
                    alt="Thumbnail preview"
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">Thumbnail uploaded</p>
                  <p className="text-xs text-gray-600">This will appear above your button text</p>
                </div>
                <button
                  type="button"
                  onClick={removeThumbnail}
                  className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center cursor-pointer hover:border-purple-400 hover:bg-purple-50 transition-colors"
              >
                <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                  <ImageIcon className="w-6 h-6 text-gray-400" />
                </div>
                <p className="text-sm font-medium text-gray-900 mb-1">Upload thumbnail image</p>
                <p className="text-xs text-gray-600">PNG, JPG or GIF up to 2MB</p>
              </div>
            )}

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleThumbnailSelect}
              className="hidden"
            />
          </div>

          {/* Visibility Toggle */}
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-medium text-gray-900">Link Visibility</h3>
                {formData.is_active ? (
                  <Eye className="w-4 h-4 text-green-600" />
                ) : (
                  <EyeOff className="w-4 h-4 text-gray-400" />
                )}
              </div>
              <p className="text-sm text-gray-600">
                {formData.is_active 
                  ? 'This link will be visible on your storefront'
                  : 'This link will be hidden from your storefront'
                }
              </p>
            </div>
            <button
              type="button"
              onClick={() => handleInputChange('is_active', !formData.is_active)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                formData.is_active ? 'bg-purple-600' : 'bg-gray-200'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  formData.is_active ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          {/* Form Actions */}
          <div className="flex gap-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-3 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              {isLoading ? 'Saving...' : (link ? 'Update Link' : 'Create Link')}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}