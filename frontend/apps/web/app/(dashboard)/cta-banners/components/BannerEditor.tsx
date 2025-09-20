'use client'

import { useState } from 'react'
import {
  X,
  Save,
  Type,
  Link,
  Eye,
  EyeOff,
  Loader2,
  Palette,
  Sparkles
} from 'lucide-react'
import { BannerPreview } from './BannerPreview'
import {
  createCTABannerAction,
  updateCTABannerAction
} from '@/actions'
import { validateUrl } from '@/lib/storefront-utils'

interface BannerEditorProps {
  banner?: any
  onClose: () => void
  onComplete: () => void
}

const bannerStyles = [
  {
    id: 'gradient-purple',
    name: 'Purple Gradient',
    preview: 'bg-gradient-to-r from-brand-500 to-brand-600',
    className: 'bg-gradient-to-r from-brand-500 to-brand-600'
  },
  {
    id: 'gradient-blue',
    name: 'Blue Gradient',
    preview: 'bg-gradient-to-r from-blue-500 to-blue-600',
    className: 'bg-gradient-to-r from-blue-500 to-blue-600'
  },
  {
    id: 'gradient-green',
    name: 'Green Gradient',
    preview: 'bg-gradient-to-r from-green-500 to-green-600',
    className: 'bg-gradient-to-r from-green-500 to-green-600'
  },
  {
    id: 'gradient-orange',
    name: 'Orange Gradient',
    preview: 'bg-gradient-to-r from-orange-500 to-orange-600',
    className: 'bg-gradient-to-r from-orange-500 to-orange-600'
  },
  {
    id: 'solid-black',
    name: 'Classic Black',
    preview: 'bg-gray-900',
    className: 'bg-gray-900'
  },
  {
    id: 'solid-white',
    name: 'Clean White',
    preview: 'bg-white border-2 border-gray-300',
    className: 'bg-white border-2 border-gray-300',
    textColor: 'text-gray-900'
  }
]

export function BannerEditor({ banner, onClose, onComplete }: BannerEditorProps) {
  const [formData, setFormData] = useState({
    text: banner?.text || '',
    button_text: banner?.button_text || '',
    button_url: banner?.button_url || '',
    is_active: banner?.is_active ?? true,
    style: banner?.style || 'gradient-purple'
  })

  const [isLoading, setIsLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [activeTab, setActiveTab] = useState<'content' | 'design'>('content')

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }))
    }
  }

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.text.trim()) {
      newErrors.text = 'Banner text is required'
    } else if (formData.text.length > 100) {
      newErrors.text = 'Banner text must be 100 characters or less'
    }

    if (!formData.button_text.trim()) {
      newErrors.button_text = 'Button text is required'
    } else if (formData.button_text.length > 30) {
      newErrors.button_text = 'Button text must be 30 characters or less'
    }

    if (!formData.button_url.trim()) {
      newErrors.button_url = 'Button URL is required'
    } else if (!validateUrl(formData.button_url)) {
      newErrors.button_url = 'Please enter a valid URL (include https://)'
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
      if (banner && banner.id) {
        // Update existing banner
        result = await updateCTABannerAction(String(banner.id), {
          text: formData.text,
          button_text: formData.button_text,
          button_url: formData.button_url,
          style: formData.style,
          is_active: formData.is_active
        })
      } else {
        // Create new banner
        result = await createCTABannerAction({
          text: formData.text,
          button_text: formData.button_text,
          button_url: formData.button_url,
          style: formData.style,
          is_active: formData.is_active
        })
      }

      if ('error' in result) {
        console.error('Error saving banner:', result.error)
        setErrors({ general: result.error })
      } else {
        onComplete()
      }
    } catch (error) {
      console.error('Error saving banner:', error)
      setErrors({ general: 'Failed to save banner. Please try again.' })
    } finally {
      setIsLoading(false)
    }
  }

  const selectedStyle = bannerStyles.find(style => style.id === formData.style) || bannerStyles[0]

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-orange-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                {banner ? 'Edit Banner' : 'Create Banner'}
              </h2>
              <p className="text-sm text-gray-600">
                Design a compelling call-to-action banner
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

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 p-6">
          {/* Form Section */}
          <div>
            {/* Tab Navigation */}
            <div className="flex bg-gray-100 rounded-lg p-1 mb-6">
              <button
                onClick={() => setActiveTab('content')}
                className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition-all ${activeTab === 'content'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
                  }`}
              >
                <Type className="w-4 h-4 mr-2 inline" />
                Content
              </button>
              <button
                onClick={() => setActiveTab('design')}
                className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition-all ${activeTab === 'design'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
                  }`}
              >
                <Palette className="w-4 h-4 mr-2 inline" />
                Design
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* General Error */}
              {errors.general && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <p className="text-sm font-medium text-red-800">{errors.general}</p>
                </div>
              )}

              {activeTab === 'content' && (
                <div className="space-y-6">
                  {/* Banner Text */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-900 mb-2">
                      Banner Message *
                    </label>
                    <div className="relative">
                      <Type className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                      <textarea
                        value={formData.text}
                        onChange={(e) => handleInputChange('text', e.target.value)}
                        placeholder="e.g., Get 20% off your first order! Limited time offer."
                        rows={3}
                        className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-transparent resize-none ${errors.text ? 'border-red-300' : 'border-gray-300'
                          }`}
                        maxLength={100}
                      />
                    </div>
                    {errors.text && (
                      <p className="mt-1 text-sm text-red-600">{errors.text}</p>
                    )}
                    <div className="flex justify-between items-center mt-1">
                      <p className="text-xs text-gray-500">
                        This is the main message visitors will see
                      </p>
                      <span className="text-xs text-gray-400">{formData.text.length}/100</span>
                    </div>
                  </div>

                  {/* Button Text */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-900 mb-2">
                      Button Text *
                    </label>
                    <div className="relative">
                      <Type className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input
                        type="text"
                        value={formData.button_text}
                        onChange={(e) => handleInputChange('button_text', e.target.value)}
                        placeholder="e.g., Shop Now, Get Started, Learn More"
                        className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-transparent ${errors.button_text ? 'border-red-300' : 'border-gray-300'
                          }`}
                        maxLength={30}
                      />
                    </div>
                    {errors.button_text && (
                      <p className="mt-1 text-sm text-red-600">{errors.button_text}</p>
                    )}
                    <div className="flex justify-between items-center mt-1">
                      <p className="text-xs text-gray-500">
                        Keep it short and action-oriented
                      </p>
                      <span className="text-xs text-gray-400">{formData.button_text.length}/30</span>
                    </div>
                  </div>

                  {/* Button URL */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-900 mb-2">
                      Button URL *
                    </label>
                    <div className="relative">
                      <Link className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input
                        type="url"
                        value={formData.button_url}
                        onChange={(e) => handleInputChange('button_url', e.target.value)}
                        placeholder="https://example.com/offer"
                        className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-transparent ${errors.button_url ? 'border-red-300' : 'border-gray-300'
                          }`}
                      />
                    </div>
                    {errors.button_url && (
                      <p className="mt-1 text-sm text-red-600">{errors.button_url}</p>
                    )}
                    <p className="text-xs text-gray-500 mt-1">
                      Where visitors will go when they click the button
                    </p>
                  </div>
                </div>
              )}

              {activeTab === 'design' && (
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-semibold text-gray-900 mb-4">
                      Banner Style
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                      {bannerStyles.map((style) => (
                        <button
                          key={style.id}
                          type="button"
                          onClick={() => handleInputChange('style', style.id)}
                          className={`p-3 rounded-lg border-2 transition-all ${formData.style === style.id
                            ? 'border-brand-500 ring-2 ring-purple-200'
                            : 'border-gray-200 hover:border-gray-300'
                            }`}
                        >
                          <div className={`w-full h-12 rounded-md mb-2 ${style.preview}`}></div>
                          <p className="text-xs font-medium text-gray-900">{style.name}</p>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Visibility Toggle */}
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-medium text-gray-900">Banner Visibility</h3>
                    {formData.is_active ? (
                      <Eye className="w-4 h-4 text-green-600" />
                    ) : (
                      <EyeOff className="w-4 h-4 text-gray-400" />
                    )}
                  </div>
                  <p className="text-sm text-gray-600">
                    {formData.is_active
                      ? 'This banner will appear on your storefront'
                      : 'This banner will be hidden from your storefront'
                    }
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => handleInputChange('is_active', !formData.is_active)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${formData.is_active ? 'bg-brand-600' : 'bg-gray-200'
                    }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${formData.is_active ? 'translate-x-6' : 'translate-x-1'
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
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-brand-600 text-white rounded-lg hover:bg-brand-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
                >
                  {isLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Save className="w-4 h-4" />
                  )}
                  {isLoading ? 'Saving...' : (banner ? 'Update Banner' : 'Create Banner')}
                </button>
              </div>
            </form>
          </div>

          {/* Preview Section */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Live Preview</h3>
            <div className="sticky top-6">
              <BannerPreview
                banner={formData}
              />

              <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600 mb-2">
                  <strong>Preview Notes:</strong>
                </p>
                <ul className="text-xs text-gray-500 space-y-1">
                  <li>• This shows how your banner will appear on your storefront</li>
                  <li>• Test your button URL before publishing</li>
                  <li>• Only one banner can be active at a time</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}