'use client'

import { ExternalLink } from 'lucide-react'

interface BannerPreviewProps {
  banner: any
}

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

export function BannerPreview({ banner }: BannerPreviewProps) {
  if (!banner) {
    return (
      <div className="bg-gray-100 rounded-lg p-6 text-center">
        <p className="text-gray-500">No banner to preview</p>
      </div>
    )
  }

  // Get the banner style or default to gradient-purple
  const selectedBannerStyle = banner.style ? bannerStyles[banner.style as keyof typeof bannerStyles] : bannerStyles['gradient-purple']
  const bannerStyle = selectedBannerStyle?.className || 'bg-gradient-to-r from-brand-500 to-brand-600'
  const textColor = selectedBannerStyle?.textColor || 'text-white'

  return (
    <div className="space-y-4">
      {/* Mobile Preview */}
      <div>
        <h4 className="text-sm font-medium text-gray-900 mb-2">Mobile View</h4>
        <div className="max-w-xs mx-auto bg-gray-900 rounded-2xl p-2">
          <div className="bg-white rounded-xl overflow-hidden">
            <div className="p-4">
              <div className={`${bannerStyle} ${textColor} rounded-lg p-4 text-center`}>
                <p className="font-medium mb-3 text-sm leading-relaxed">
                  {banner.text || 'Your banner message will appear here'}
                </p>
                <button className={`px-4 py-2 rounded-md font-semibold text-sm ${textColor === 'text-white'
                  ? 'bg-white text-brand-600 hover:bg-gray-100'
                  : 'bg-gray-900 text-white hover:bg-gray-800'
                  } transition-colors`}>
                  {banner.button_text || 'Button Text'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Desktop Preview */}
      <div>
        <h4 className="text-sm font-medium text-gray-900 mb-2">Desktop View</h4>
        <div className={`${bannerStyle} ${textColor} rounded-lg p-6 text-center`}>
          <p className="font-medium mb-4 text-lg leading-relaxed">
            {banner.text || 'Your banner message will appear here'}
          </p>
          <button className={`inline-flex items-center gap-2 px-6 py-3 rounded-lg font-semibold ${textColor === 'text-white'
            ? 'bg-white text-brand-600 hover:bg-gray-100'
            : 'bg-gray-900 text-white hover:bg-gray-800'
            } transition-colors`}>
            {banner.button_text || 'Button Text'}
            <ExternalLink className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Banner Details */}
      <div className="bg-gray-50 rounded-lg p-4">
        <h4 className="text-sm font-medium text-gray-900 mb-2">Banner Details</h4>
        <div className="space-y-2 text-xs">
          <div className="flex justify-between">
            <span className="text-gray-600">Message:</span>
            <span className="font-medium text-gray-900 text-right max-w-48 truncate">
              {banner.text || 'Not set'}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Button:</span>
            <span className="font-medium text-gray-900">
              {banner.button_text || 'Not set'}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">URL:</span>
            <span className="font-medium text-gray-900 text-right max-w-48 truncate">
              {banner.button_url || 'Not set'}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Status:</span>
            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${banner.is_active
              ? 'bg-green-100 text-green-800'
              : 'bg-gray-100 text-gray-600'
              }`}>
              {banner.is_active ? 'Active' : 'Inactive'}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}