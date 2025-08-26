'use client'

import { CheckCircle, XCircle, Users, Unlink } from 'lucide-react'
import { FaFacebook, FaInstagram, FaPinterest, FaTiktok, FaYoutube } from 'react-icons/fa6'
import {
  getMetaAuthUrlAction,
  disconnectMetaAccountAction
} from '@/actions'
import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'

interface Platform {
  name: string
  display_name: string
  description?: string
  isComingSoon?: boolean
  connected: boolean
  connection_count: number
  connections: Array<{
    id: number
    platform_username?: string
    platform_display_name?: string
    platform_profile_url?: string
    facebook_page_name?: string
    instagram_username?: string
    pinterest_user_id?: string
    is_verified?: boolean
  }>
}

interface SocialAccountsManagerProps {
  initialPlatforms: Platform[]
}

const platformIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  facebook: FaFacebook,
  instagram: FaInstagram,
  pinterest: FaPinterest,
  tiktok: FaTiktok,
  youtube: FaYoutube,
  default: Users
}

export function SocialAccountsManager({ initialPlatforms }: SocialAccountsManagerProps) {
  const platforms = initialPlatforms
  const [isConnecting, setIsConnecting] = useState(false)
  const [statusMessage, setStatusMessage] = useState<{
    type: 'success' | 'error' | null
    message: string
  }>({ type: null, message: '' })

  const searchParams = useSearchParams()


  useEffect(() => {
    // Check URL parameters for connection status
    const connection = searchParams.get('connection')
    const accounts = searchParams.get('accounts')
    const message = searchParams.get('message')

    if (connection === 'success') {
      const accountCount = accounts ? parseInt(accounts) : 0
      setStatusMessage({
        type: 'success',
        message: `Successfully connected ${accountCount} account(s)!`
      })
    } else if (connection === 'error') {
      setStatusMessage({
        type: 'error',
        message: message || 'Failed to connect. Please try again.'
      })
    }

    // Clear URL parameters after showing message
    if (connection) {
      const newUrl = window.location.pathname
      window.history.replaceState({}, '', newUrl)
    }
  }, [searchParams])

  const handleConnect = async (platformName: string) => {
    if (platformName === 'facebook' || platformName === 'instagram') {
      // Both Facebook and Instagram use Meta OAuth
      try {
        setIsConnecting(true)
        const result = await getMetaAuthUrlAction()

        if ('error' in result) {
          console.error('Failed to get auth URL:', result.error)
          setStatusMessage({
            type: 'error',
            message: 'Failed to connect. Please try again.'
          })
          setIsConnecting(false)
          return
        }

        // Redirect to Meta OAuth (don't reset loading state as page will navigate away)
        window.location.href = result.auth_url
      } catch (error) {
        console.error('Failed to connect:', error)
        setStatusMessage({
          type: 'error',
          message: 'Failed to connect. Please try again.'
        })
        setIsConnecting(false)
      }
    } else {
      // Coming soon platforms
      setStatusMessage({
        type: 'error',
        message: `${platformName} integration coming soon!`
      })
    }
  }

  const handleDisconnect = async (connectionId: number, platformName: string) => {
    if (confirm(`Are you sure you want to disconnect this ${platformName} account?`)) {
      try {
        let result

        if (platformName === 'facebook' || platformName === 'instagram') {
          result = await disconnectMetaAccountAction(connectionId)
        } else {
          setStatusMessage({
            type: 'error',
            message: 'Platform not supported for disconnection'
          })
          return
        }

        if ('error' in result) {
          setStatusMessage({
            type: 'error',
            message: result.error
          })
        } else {
          setStatusMessage({
            type: 'success',
            message: 'Account disconnected successfully'
          })
          // Reload page to get fresh data
          window.location.reload()
        }
      } catch (error) {
        console.error('Failed to disconnect:', error)
        setStatusMessage({
          type: 'error',
          message: 'Failed to disconnect account'
        })
      }
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-6">
            <h1 className="text-2xl font-semibold text-gray-900">Social Accounts</h1>
            <p className="mt-1 text-sm text-gray-500">
              Connect and manage your social media accounts
            </p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Status Message */}
        {statusMessage.type && (
          <div className={`mb-6 p-4 rounded-lg flex items-center gap-3 max-w-2xl mx-auto ${statusMessage.type === 'success'
            ? 'bg-green-50 text-green-800 border border-green-200'
            : 'bg-red-50 text-red-800 border border-red-200'
            }`}>
            {statusMessage.type === 'success' ? (
              <CheckCircle className="w-5 h-5 text-green-600" />
            ) : (
              <XCircle className="w-5 h-5 text-red-600" />
            )}
            <span className="text-sm font-medium">{statusMessage.message}</span>
          </div>
        )}

        {/* Platform Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
          {platforms.map((platform) => {
            const IconComponent = platformIcons[platform.name] || platformIcons.default

            return (
              <div key={platform.name} className={`bg-white rounded-lg border border-gray-200 shadow-sm ${platform.isComingSoon ? 'opacity-75' : ''}`}>
                <div className="p-6">
                  <div className={`flex items-center justify-center w-12 h-12 rounded-lg mb-4 mx-auto ${platform.isComingSoon ? 'bg-gray-100' : 'bg-gray-50'}`}>
                    <IconComponent className={`w-6 h-6 ${platform.isComingSoon ? 'text-gray-400' : 'text-gray-600'}`} />
                  </div>

                  <div className="text-center mb-4">
                    <h3 className="text-lg font-medium text-gray-900 mb-1">
                      {platform.display_name}
                    </h3>
                    {platform.description && (
                      <p className="text-sm text-gray-500">{platform.description}</p>
                    )}
                    {platform.isComingSoon && (
                      <span className="inline-flex items-center px-2 py-1 mt-2 text-xs font-medium bg-orange-100 text-orange-700 rounded-full">
                        Coming Soon
                      </span>
                    )}
                  </div>

                  {platform.connected ? (
                    <div className="space-y-4">
                      <div className="text-center">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          Connected ({platform.connection_count})
                        </span>
                      </div>

                      {/* Connected Accounts */}
                      <div className="space-y-2">
                        {platform.connections.map((connection) => (
                          <div key={connection.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-md">
                            <div className="flex items-center gap-3 flex-1 min-w-0">
                              {connection.platform_profile_url ? (
                                <img
                                  src={connection.platform_profile_url}
                                  alt="Profile"
                                  className="w-8 h-8 rounded-full object-cover"
                                  onError={(e) => {
                                    // Fallback to icon if image fails to load
                                    const IconComponent = platformIcons[platform.name] || platformIcons.default
                                    e.currentTarget.style.display = 'none'
                                    const iconContainer = e.currentTarget.nextElementSibling as HTMLElement
                                    if (iconContainer) iconContainer.style.display = 'flex'
                                  }}
                                />
                              ) : null}
                              <div className={`w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center ${connection.platform_profile_url ? 'hidden' : ''}`}>
                                {(() => {
                                  const IconComponent = platformIcons[platform.name] || platformIcons.default
                                  return <IconComponent className="w-4 h-4 text-gray-600" />
                                })()}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                  <p className="text-sm font-medium text-gray-900 truncate">
                                    {connection.facebook_page_name ||
                                      connection.instagram_username ||
                                      connection.platform_display_name ||
                                      connection.platform_username ||
                                      'Unnamed Account'}
                                  </p>
                                  {/* Show platform type for META */}
                                  {platform.name === 'meta' && (
                                    <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${connection.facebook_page_name
                                      ? 'bg-blue-100 text-blue-700'
                                      : 'bg-pink-100 text-pink-700'
                                      }`}>
                                      {connection.facebook_page_name ? 'Facebook' : 'Instagram'}
                                    </span>
                                  )}
                                </div>
                                {connection.is_verified && (
                                  <span className="text-xs text-blue-600">Verified</span>
                                )}
                              </div>
                            </div>
                            <button
                              onClick={() => handleDisconnect(connection.id, platform.name)}
                              className="ml-2 p-1 text-gray-400 hover:text-red-600 transition-colors"
                              title="Disconnect"
                            >
                              <Unlink className="w-4 h-4" />
                            </button>
                          </div>
                        ))}
                      </div>

                      {/* Add More Button */}
                      <button
                        onClick={() => handleConnect(platform.name)}
                        disabled={isConnecting}
                        className="w-full px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors disabled:opacity-50"
                      >
                        Add More {platform.display_name} Accounts
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <p className="text-sm text-gray-500 text-center">
                        {platform.isComingSoon
                          ? `${platform.display_name} integration is coming soon!`
                          : `Connect your ${platform.display_name} account to manage and publish content`
                        }
                      </p>

                      <button
                        onClick={() => handleConnect(platform.name)}
                        disabled={isConnecting || platform.isComingSoon}
                        className={`w-full flex justify-center items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${platform.isComingSoon
                          ? 'text-gray-600 bg-gray-200'
                          : 'text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500'
                          }`}
                      >
                        {platform.isComingSoon
                          ? 'Coming Soon'
                          : (isConnecting ? 'Connecting...' : `Connect ${platform.display_name}`)
                        }
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}