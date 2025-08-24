'use client'

import { 
  X, 
  ShoppingCart, 
  Zap, 
  Gift, 
  Star, 
  Users, 
  BookOpen,
  Calendar,
  Download
} from 'lucide-react'

interface BannerTemplatesProps {
  onClose: () => void
  onTemplateSelect: (template: any) => void
}

const templates = [
  {
    id: 'ecommerce-sale',
    category: 'E-commerce',
    name: 'Flash Sale',
    icon: ShoppingCart,
    text: '🔥 Flash Sale! Get 30% off everything. Limited time only!',
    button_text: 'Shop Now',
    button_url: 'https://example.com/sale',
    style: 'gradient-orange',
    preview_bg: 'bg-gradient-to-r from-orange-500 to-red-500'
  },
  {
    id: 'lead-magnet',
    category: 'Lead Generation',
    name: 'Free Resource',
    icon: Gift,
    text: 'Download our FREE guide to boost your productivity by 200%!',
    button_text: 'Get Free Guide',
    button_url: 'https://example.com/guide',
    style: 'gradient-blue',
    preview_bg: 'bg-gradient-to-r from-blue-500 to-blue-600'
  },
  {
    id: 'newsletter',
    category: 'Newsletter',
    name: 'Subscribe',
    icon: Zap,
    text: 'Join 10,000+ creators getting our weekly tips and tricks!',
    button_text: 'Subscribe Now',
    button_url: 'https://example.com/subscribe',
    style: 'gradient-purple',
    preview_bg: 'bg-gradient-to-r from-purple-500 to-purple-600'
  },
  {
    id: 'course-launch',
    category: 'Education',
    name: 'Course Launch',
    icon: BookOpen,
    text: 'Master digital marketing in 30 days. Early bird pricing ends soon!',
    button_text: 'Enroll Today',
    button_url: 'https://example.com/course',
    style: 'gradient-green',
    preview_bg: 'bg-gradient-to-r from-green-500 to-green-600'
  },
  {
    id: 'webinar',
    category: 'Events',
    name: 'Webinar Registration',
    icon: Calendar,
    text: 'FREE Webinar: How to 10x Your Business in 2024 🚀',
    button_text: 'Reserve Seat',
    button_url: 'https://example.com/webinar',
    style: 'solid-black',
    preview_bg: 'bg-gray-900'
  },
  {
    id: 'app-download',
    category: 'Mobile',
    name: 'App Download',
    icon: Download,
    text: 'Get our mobile app and access exclusive content on the go!',
    button_text: 'Download App',
    button_url: 'https://example.com/app',
    style: 'gradient-blue',
    preview_bg: 'bg-gradient-to-r from-blue-500 to-indigo-600'
  },
  {
    id: 'testimonial',
    category: 'Social Proof',
    name: 'Success Story',
    icon: Star,
    text: '"This changed my life!" - Join thousands of happy customers',
    button_text: 'Start Today',
    button_url: 'https://example.com/start',
    style: 'solid-white',
    preview_bg: 'bg-white border-2 border-gray-300',
    text_color: 'text-gray-900'
  },
  {
    id: 'community',
    category: 'Community',
    name: 'Join Community',
    icon: Users,
    text: 'Connect with like-minded entrepreneurs in our exclusive community',
    button_text: 'Join Now',
    button_url: 'https://example.com/community',
    style: 'gradient-purple',
    preview_bg: 'bg-gradient-to-r from-pink-500 to-purple-600'
  }
]

const categories = [...new Set(templates.map(t => t.category))]

export function BannerTemplates({ onClose, onTemplateSelect }: BannerTemplatesProps) {
  const handleTemplateSelect = (template: any) => {
    const templateData = {
      text: template.text,
      button_text: template.button_text,
      button_url: template.button_url,
      style: template.style,
      is_active: false // Don't activate immediately
    }
    onTemplateSelect(templateData)
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-2xl max-w-5xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Banner Templates</h2>
            <p className="text-sm text-gray-600 mt-1">
              Choose a template to get started quickly
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6">
          {/* Category Tabs */}
          <div className="flex flex-wrap gap-2 mb-6">
            <button className="px-4 py-2 bg-purple-100 text-purple-700 rounded-lg font-medium text-sm">
              All Templates
            </button>
            {categories.map((category) => (
              <button
                key={category}
                className="px-4 py-2 bg-gray-100 text-gray-600 rounded-lg font-medium text-sm hover:bg-gray-200 transition-colors"
              >
                {category}
              </button>
            ))}
          </div>

          {/* Templates Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {templates.map((template) => {
              const IconComponent = template.icon
              return (
                <div
                  key={template.id}
                  className="bg-white border border-gray-200 rounded-xl overflow-hidden hover:shadow-lg transition-shadow cursor-pointer group"
                  onClick={() => handleTemplateSelect(template)}
                >
                  {/* Template Preview */}
                  <div className="p-4">
                    <div className={`${template.preview_bg} ${template.text_color || 'text-white'} rounded-lg p-4 text-center relative overflow-hidden`}>
                      <div className="relative z-10">
                        <p className="font-medium mb-3 text-sm leading-relaxed">
                          {template.text}
                        </p>
                        <button className={`px-4 py-2 rounded-md font-semibold text-sm ${
                          template.text_color === 'text-gray-900'
                            ? 'bg-gray-900 text-white'
                            : 'bg-white text-purple-600'
                        } transition-colors`}>
                          {template.button_text}
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Template Info */}
                  <div className="p-4 border-t border-gray-100">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center">
                        <IconComponent className="w-4 h-4 text-gray-600" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">{template.name}</h3>
                        <p className="text-xs text-gray-500">{template.category}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between mt-3">
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                        {template.category}
                      </span>
                      <button 
                        className="text-sm font-medium text-purple-600 hover:text-purple-700 group-hover:underline"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleTemplateSelect(template)
                        }}
                      >
                        Use Template
                      </button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Custom Template Option */}
          <div className="mt-8 p-6 bg-gray-50 border-2 border-dashed border-gray-300 rounded-xl text-center">
            <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center mx-auto mb-3">
              <Zap className="w-6 h-6 text-gray-400" />
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">Create Custom Banner</h3>
            <p className="text-sm text-gray-600 mb-4">
              Don't see what you're looking for? Start from scratch with a blank template.
            </p>
            <button
              onClick={() => onTemplateSelect({})}
              className="inline-flex items-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors font-medium"
            >
              <Zap className="w-4 h-4" />
              Create Custom
            </button>
          </div>

          {/* Usage Tips */}
          <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <h4 className="font-medium text-blue-900 mb-2">Template Tips</h4>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• Customize any template to match your brand</li>
              <li>• Test different messages to see what converts best</li>
              <li>• Keep your call-to-action clear and specific</li>
              <li>• Make sure your landing page delivers on the banner's promise</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}