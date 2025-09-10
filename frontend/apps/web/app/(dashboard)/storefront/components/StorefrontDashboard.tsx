'use client'

import { useState } from 'react'
import { useSession } from 'next-auth/react'
import { toast } from 'sonner'
import {
  Store,
  Link,
  Users,
  MousePointerClick,
  Copy,
  Check
} from 'lucide-react'
import { StorefrontEditor } from './StorefrontEditor'

interface StorefrontDashboardProps {
  initialProfile: any
  initialCustomLinks: any[]
  initialDashboardStats: any
}

export function StorefrontDashboard({
  initialProfile,
  initialCustomLinks,
  initialDashboardStats
}: StorefrontDashboardProps) {
  const { data: session } = useSession()
  const [profile] = useState(initialProfile)
  const [customLinks] = useState(initialCustomLinks)
  const [dashboardStats] = useState(initialDashboardStats)

  return (
    <div className="flex-1 bg-gray-50">
      {/* Header */}
      <div 
        className="bg-white"
        style={{ boxShadow: 'rgba(0, 0, 0, 0.02) 0px 2px 8px' }}
      >
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

              {profile && (
                <div className="flex items-center gap-2">
                  <a
                    href={`/${session?.user?.username}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-purple-600 hover:text-purple-700 transition-colors font-medium text-base"
                  >
                    elevate.social/{session?.user?.username}
                  </a>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(`https://elevate.social/${session?.user?.username}`)
                      toast.custom(
                        (t) => (
                          <div 
                            className="text-white px-6 py-4 rounded-2xl shadow-lg flex items-center justify-between min-w-80"
                            style={{ 
                              backgroundColor: '#7c3aed',
                              border: 'none',
                              boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)'
                            }}
                          >
                            <div className="flex items-center gap-3">
                              <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                                <Check className="w-4 h-4 text-white" />
                              </div>
                              <span className="font-medium">URL Copied!</span>
                            </div>
                            <button
                              onClick={() => toast.dismiss(t)}
                              className="bg-white/20 hover:bg-white/30 px-3 py-1 rounded-lg text-sm font-medium transition-colors text-white"
                            >
                              OK
                            </button>
                          </div>
                        ),
                        {
                          duration: 4000,
                          unstyled: true,
                          style: {
                            backgroundColor: 'transparent',
                            border: 'none',
                            boxShadow: 'none',
                            padding: '0'
                          }
                        }
                      )
                    }}
                    className="p-1.5 text-purple-600 hover:text-purple-700 transition-colors"
                    title="Copy link"
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="p-6">
        <div className="max-w-7xl mx-auto">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div 
              className="bg-white rounded-xl p-6"
              style={{ boxShadow: 'rgba(0, 0, 0, 0.02) 0px 2px 8px' }}
            >
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

            <div 
              className="bg-white rounded-xl p-6"
              style={{ boxShadow: 'rgba(0, 0, 0, 0.02) 0px 2px 8px' }}
            >
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

            <div 
              className="bg-white rounded-xl p-6"
              style={{ boxShadow: 'rgba(0, 0, 0, 0.02) 0px 2px 8px' }}
            >
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

          {/* Main Content with Mobile Preview */}
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
            {/* Editor Area */}
            <div className="xl:col-span-2">
              <StorefrontEditor
                profile={profile}
                onUpdate={() => { }}
              />
            </div>

            {/* Mobile Preview */}
            <div className="flex items-start justify-center">
              <div 
                className="w-80 h-[700px] bg-white rounded-[2rem] sticky top-6 p-4"
                style={{
                  boxShadow: 'rgba(50, 50, 93, 0.25) 0px 50px 100px -20px, rgba(0, 0, 0, 0.3) 0px 30px 60px -30px, rgba(10, 37, 64, 0.35) 0px -2px 6px 0px inset'
                }}
              >
                <div className="w-full h-full rounded-xl overflow-hidden">
                  <iframe
                    src={`/${session?.user?.username}`}
                    className="w-full h-full"
                    style={{ 
                      transform: 'scale(0.9)', 
                      transformOrigin: 'top left', 
                      width: '111%', 
                      height: '111%',
                      border: 'none',
                      outline: 'none'
                    }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}