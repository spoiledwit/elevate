'use client'

import { useState } from 'react'
import {
  Megaphone,
  Plus,
  Edit,
  Eye,
  EyeOff,
  Trash2,
  Sparkles,
  MousePointerClick,
  TrendingUp
} from 'lucide-react'
import { BannerEditor } from './BannerEditor'
import { BannerPreview } from './BannerPreview'
import { BannerTemplates } from './BannerTemplates'
import {
  getCTABannersAction,
  deleteCTABannerAction,
  updateCTABannerAction
} from '@/actions'

const bannerStyles = {
  'gradient-purple': {
    className: 'bg-gradient-to-r from-brand-500 to-brand-600',
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

interface CTABannerManagerProps {
  initialBanners: any[]
  initialActiveBanner: any
}

export function CTABannerManager({
  initialBanners,
  initialActiveBanner
}: CTABannerManagerProps) {
  const [banners, setBanners] = useState(initialBanners)
  const [activeBanner, setActiveBanner] = useState(initialActiveBanner)
  const [showEditor, setShowEditor] = useState(false)
  const [showTemplates, setShowTemplates] = useState(false)
  const [selectedBanner, setSelectedBanner] = useState<any>(null)

  const loadBanners = async () => {
    try {
      const result = await getCTABannersAction()
      if (!('error' in result)) {
        const bannerList = result.results || []
        setBanners(bannerList)
        setActiveBanner(bannerList.find((banner: any) => banner.is_active) || null)
      }
    } catch (error) {
      console.error('Error loading banners:', error)
    }
  }

  const handleDeleteBanner = async (bannerId: string | number) => {
    if (!confirm('Are you sure you want to delete this banner? This action cannot be undone.')) {
      return
    }

    try {
      const result = await deleteCTABannerAction(String(bannerId))
      if (!('error' in result)) {
        await loadBanners()
      }
    } catch (error) {
      console.error('Error deleting banner:', error)
    }
  }

  const handleToggleActive = async (banner: any) => {
    try {
      const result = await updateCTABannerAction(String(banner.id), {
        is_active: !banner.is_active
      })
      if (!('error' in result)) {
        await loadBanners()
      }
    } catch (error) {
      console.error('Error updating banner:', error)
    }
  }

  const handleEditBanner = (banner: any) => {
    setSelectedBanner(banner)
    setShowEditor(true)
  }

  const handleCreateBanner = () => {
    setSelectedBanner(null)
    setShowEditor(true)
  }

  const handleEditorComplete = () => {
    setShowEditor(false)
    setSelectedBanner(null)
    loadBanners()
  }

  const handleTemplateSelect = (template: any) => {
    setSelectedBanner(template)
    setShowTemplates(false)
    setShowEditor(true)
  }

  return (
    <div className="flex-1 bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="px-6 py-6">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center">
                  <Megaphone className="w-7 h-7 text-orange-600" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">CTA Banners</h1>
                  <p className="text-gray-600">
                    Create promotional banners to boost conversions
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={() => setShowTemplates(true)}
                  className="inline-flex items-center gap-2 px-4 py-2.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium"
                >
                  <Sparkles className="w-4 h-4" />
                  Templates
                </button>
                <button
                  onClick={handleCreateBanner}
                  className="inline-flex items-center gap-2 px-4 py-2.5 bg-brand-600 text-white rounded-lg hover:bg-brand-700 transition-colors font-medium"
                >
                  <Plus className="w-4 h-4" />
                  Create Banner
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="p-6">
        <div className="max-w-7xl mx-auto">
          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Megaphone className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Banners</p>
                  <p className="text-2xl font-bold text-gray-900">{banners.length}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                  <Eye className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Active Banner</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {activeBanner ? '1' : '0'}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                  <MousePointerClick className="w-5 h-5 text-brand-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Banner Clicks</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {activeBanner?.click_count || 0}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Current Active Banner */}
          {activeBanner && (
            <div className="bg-white rounded-xl border border-gray-200 mb-8">
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-gray-900">Active Banner</h2>
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    Live on storefront
                  </span>
                </div>
              </div>
              <div className="p-6">
                <BannerPreview banner={activeBanner} />
                <div className="flex gap-3 mt-4">
                  <button
                    onClick={() => handleEditBanner(activeBanner)}
                    className="flex items-center gap-2 px-4 py-2 bg-brand-600 text-white rounded-lg hover:bg-brand-700 transition-colors font-medium"
                  >
                    <Edit className="w-4 h-4" />
                    Edit Banner
                  </button>
                  <button
                    onClick={() => handleToggleActive(activeBanner)}
                    className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium"
                  >
                    <EyeOff className="w-4 h-4" />
                    Hide Banner
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* All Banners List */}
          <div className="bg-white rounded-xl border border-gray-200">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">All Banners</h2>
              <p className="text-gray-600 mt-1">
                Manage your banner collection
              </p>
            </div>

            <div className="p-6">
              {banners.length > 0 ? (
                <div className="space-y-4">
                  {banners.map((banner) => {
                    const bannerStyle = banner.style ? bannerStyles[banner.style as keyof typeof bannerStyles] : bannerStyles['gradient-purple']

                    return (
                      <div
                        key={banner.id}
                        className={`flex items-center gap-4 p-4 rounded-lg border-2 transition-all ${banner.is_active
                          ? 'border-green-200 bg-green-50'
                          : 'border-gray-200 bg-white'
                          }`}
                      >
                        {/* Banner Preview */}
                        <div className="flex-1 min-w-0">
                          <div className={`p-4 rounded-lg ${banner.is_active ? bannerStyle.className : 'bg-gray-100'
                            }`}>
                            <p className={`font-medium mb-2 ${banner.is_active ? bannerStyle.textColor : 'text-gray-700'}`}>
                              {banner.text}
                            </p>
                            <div className={`inline-block px-4 py-2 rounded-md font-semibold text-sm ${banner.is_active
                              ? (bannerStyle.textColor === 'text-white' ? 'bg-white text-slate-900' : 'bg-slate-900 text-white')
                              : 'bg-gray-300 text-gray-700'
                              }`}>
                              {banner.button_text}
                            </div>
                          </div>

                          <div className="flex items-center gap-4 mt-3">
                            <span className="text-sm text-gray-600">
                              URL: {banner.button_url}
                            </span>
                            <span className="text-sm text-gray-600">
                              Clicks: {banner.click_count || 0}
                            </span>
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleToggleActive(banner)}
                            className={`p-2 rounded-lg transition-colors ${banner.is_active
                              ? 'text-green-600 hover:bg-green-100'
                              : 'text-gray-400 hover:bg-gray-100'
                              }`}
                            title={banner.is_active ? 'Hide banner' : 'Show banner'}
                          >
                            {banner.is_active ? (
                              <Eye className="w-4 h-4" />
                            ) : (
                              <EyeOff className="w-4 h-4" />
                            )}
                          </button>

                          <button
                            onClick={() => handleEditBanner(banner)}
                            className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                            title="Edit banner"
                          >
                            <Edit className="w-4 h-4" />
                          </button>

                          <button
                            onClick={() => handleDeleteBanner(banner.id)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Delete banner"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Megaphone className="w-8 h-8 text-gray-400" />
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No banners yet</h3>
                  <p className="text-gray-600 mb-6">
                    Create your first promotional banner to boost engagement on your storefront.
                  </p>
                  <div className="flex justify-center gap-3">
                    <button
                      onClick={() => setShowTemplates(true)}
                      className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium"
                    >
                      <Sparkles className="w-4 h-4" />
                      Browse Templates
                    </button>
                    <button
                      onClick={handleCreateBanner}
                      className="inline-flex items-center gap-2 px-4 py-2 bg-brand-600 text-white rounded-lg hover:bg-brand-700 transition-colors font-medium"
                    >
                      <Plus className="w-4 h-4" />
                      Create From Scratch
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Tips Section */}
          <div className="mt-8 bg-blue-50 border border-blue-200 rounded-xl p-6">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                <TrendingUp className="w-4 h-4 text-blue-600" />
              </div>
              <div>
                <h3 className="font-semibold text-blue-900 mb-2">Banner Best Practices</h3>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>• Keep your message clear and concise</li>
                  <li>• Use action-oriented button text (e.g., "Shop Now", "Get Started")</li>
                  <li>• Test different versions to see what works best</li>
                  <li>• Make sure your landing page matches your banner's promise</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Editor Modal */}
      {showEditor && (
        <BannerEditor
          banner={selectedBanner}
          onClose={() => setShowEditor(false)}
          onComplete={handleEditorComplete}
        />
      )}

      {/* Templates Modal */}
      {showTemplates && (
        <BannerTemplates
          onClose={() => setShowTemplates(false)}
          onTemplateSelect={handleTemplateSelect}
        />
      )}
    </div>
  )
}