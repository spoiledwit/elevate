'use client'

import { useState } from 'react'
import { useSession } from 'next-auth/react'
import {
  Store,
  Link,
  Megaphone,
  Eye,
  Settings,
  ExternalLink,
  Users,
  MousePointerClick
} from 'lucide-react'
import { StorefrontPreview } from './StorefrontPreview'
import { StorefrontEditor } from './StorefrontEditor'
import { QuickActions } from './QuickActions'

interface StorefrontDashboardProps {
  initialProfile: any
  initialCustomLinks: any[]
  initialCtaBanner: any
  initialDashboardStats: any
}

export function StorefrontDashboard({
  initialProfile,
  initialCustomLinks,
  initialCtaBanner,
  initialDashboardStats
}: StorefrontDashboardProps) {
  const { data: session } = useSession()
  const [profile, setProfile] = useState(initialProfile)
  const [customLinks, setCustomLinks] = useState(initialCustomLinks)
  const [ctaBanner, setCtaBanner] = useState(initialCtaBanner)
  const [dashboardStats, setDashboardStats] = useState(initialDashboardStats)
  const [activeTab, setActiveTab] = useState<'editor' | 'preview'>('editor')

  return (
    <div className="flex-1 bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="px-6 py-6">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                  <Store className="w-7 h-7 text-purple-600" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">My Storefront</h1>
                  <p className="text-gray-600">
                    Create your personalized link-in-bio page
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                {profile && (
                  <a
                    href={`/${session?.user?.username}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-4 py-2.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium"
                  >
                    <ExternalLink className="w-4 h-4" />
                    View Live
                  </a>
                )}

                <div className="flex bg-gray-100 rounded-lg p-1">
                  <button
                    onClick={() => setActiveTab('editor')}
                    className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${activeTab === 'editor'
                      ? 'bg-white text-gray-900 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                      }`}
                  >
                    <Settings className="w-4 h-4 mr-2 inline" />
                    Edit
                  </button>
                  <button
                    onClick={() => setActiveTab('preview')}
                    className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${activeTab === 'preview'
                      ? 'bg-white text-gray-900 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                      }`}
                  >
                    <Eye className="w-4 h-4 mr-2 inline" />
                    Preview
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="p-6">
        <div className="max-w-7xl mx-auto">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Users className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Views</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {dashboardStats?.analytics?.profile_views || 0}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                  <MousePointerClick className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Link Clicks</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {((dashboardStats?.analytics?.total_link_clicks || 0) + (dashboardStats?.analytics?.banner_clicks || 0))}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                  <Link className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Active Links</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {customLinks.filter(link => link.is_active).length}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
            {/* Editor/Preview Area */}
            <div className="xl:col-span-2">
              {activeTab === 'editor' ? (
                <StorefrontEditor
                  profile={profile}
                  onUpdate={() => { }}
                />
              ) : (
                <StorefrontPreview
                  profile={profile}
                  customLinks={customLinks}
                  ctaBanner={ctaBanner}
                />
              )}
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              <QuickActions
                customLinksCount={customLinks.length}
                hasCtaBanner={!!ctaBanner}
                onUpdate={() => {
                  // Could trigger a refresh of data if needed
                  // For now, the individual components handle their own updates
                }}
              />

              {/* Quick Setup Guide */}
              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Setup</h3>
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <div className={`w-5 h-5 rounded-full flex items-center justify-center ${profile?.profile_image ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-400'
                      }`}>
                      {profile?.profile_image ? '✓' : '1'}
                    </div>
                    <span className="text-sm text-gray-600">Upload profile image</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className={`w-5 h-5 rounded-full flex items-center justify-center ${profile?.bio ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-400'
                      }`}>
                      {profile?.bio ? '✓' : '2'}
                    </div>
                    <span className="text-sm text-gray-600">Write your bio</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className={`w-5 h-5 rounded-full flex items-center justify-center ${customLinks.length > 0 ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-400'
                      }`}>
                      {customLinks.length > 0 ? '✓' : '3'}
                    </div>
                    <span className="text-sm text-gray-600">Add custom links</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className={`w-5 h-5 rounded-full flex items-center justify-center ${ctaBanner ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-400'
                      }`}>
                      {ctaBanner ? '✓' : '4'}
                    </div>
                    <span className="text-sm text-gray-600">Create CTA banner</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}