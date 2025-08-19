'use client'

import { CheckCircle, XCircle, Users, Unlink, Globe, Camera, Briefcase, Video, Pin } from 'lucide-react'
import { 
  getMetaAuthUrlAction, 
  getPlatformStatusAction, 
  disconnectMetaAccountAction,
  getPinterestAuthUrlAction,
  disconnectPinterestAccountAction,
  getLinkedInAuthUrlAction,
  disconnectLinkedInAccountAction 
} from '@/actions'
import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'

interface Platform {
  name: string
  display_name: string
  connected: boolean
  connection_count: number
  connections: Array<{
    id: number
    platform_username?: string
    platform_display_name?: string
    facebook_page_name?: string
    instagram_username?: string
    pinterest_user_id?: string
    is_verified?: boolean
  }>
}

const platformIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  facebook: Globe,
  instagram: Camera,
  linkedin: Briefcase,
  youtube: Video,
  pinterest: Pin,
  default: Users
}

export default function SocialAccountsPage() {
  const [platforms, setPlatforms] = useState<Platform[]>([])
  const [loading, setLoading] = useState(true)
  const [isConnecting, setIsConnecting] = useState(false)
  const [statusMessage, setStatusMessage] = useState<{
    type: 'success' | 'error' | null
    message: string
  }>({ type: null, message: '' })
  
  const searchParams = useSearchParams()
  
  // Available platforms to show (even if not in database yet)
  const availablePlatforms = [
    { name: 'facebook', display_name: 'Facebook' },
    { name: 'instagram', display_name: 'Instagram' },
    { name: 'pinterest', display_name: 'Pinterest' },
    { name: 'linkedin', display_name: 'LinkedIn' },
  ]
  
  // Load platform status
  const loadPlatforms = async () => {
    try {
      const result = await getPlatformStatusAction()
      
      // Merge API data with available platforms
      const mergedPlatforms = availablePlatforms.map(availablePlatform => {
        // Find matching platform from API
        const apiPlatform = !('error' in result) 
          ? result.platforms.find(p => p.name === availablePlatform.name)
          : null
        
        return {
          name: availablePlatform.name,
          display_name: availablePlatform.display_name,
          connected: apiPlatform?.connected || false,
          connection_count: apiPlatform?.connection_count || 0,
          connections: apiPlatform?.connections || []
        }
      })
      
      setPlatforms(mergedPlatforms)
      
    } catch (error) {
      console.error('Failed to load platforms:', error)
      // Show available platforms even if API fails
      setPlatforms(availablePlatforms.map(p => ({
        ...p,
        connected: false,
        connection_count: 0,
        connections: []
      })))
    } finally {
      setLoading(false)
    }
  }
  
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
    
    // Load platform status
    loadPlatforms()
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
          return
        }
        
        // Redirect to Meta OAuth
        window.location.href = result.auth_url
      } catch (error) {
        console.error('Failed to connect:', error)
        setStatusMessage({
          type: 'error',
          message: 'Failed to connect. Please try again.'
        })
      } finally {
        setIsConnecting(false)
      }
    } else if (platformName === 'pinterest') {
      // Pinterest OAuth
      try {
        setIsConnecting(true)
        const result = await getPinterestAuthUrlAction()
        
        if ('error' in result) {
          console.error('Failed to get Pinterest auth URL:', result.error)
          setStatusMessage({
            type: 'error',
            message: 'Failed to connect. Please try again.'
          })
          return
        }
        
        // Redirect to Pinterest OAuth
        window.location.href = result.auth_url
      } catch (error) {
        console.error('Failed to connect Pinterest:', error)
        setStatusMessage({
          type: 'error',
          message: 'Failed to connect. Please try again.'
        })
      } finally {
        setIsConnecting(false)
      }
    } else if (platformName === 'linkedin') {
      // LinkedIn OAuth
      try {
        setIsConnecting(true)
        const result = await getLinkedInAuthUrlAction()
        
        if ('error' in result) {
          console.error('Failed to get LinkedIn auth URL:', result.error)
          setStatusMessage({
            type: 'error',
            message: 'Failed to connect. Please try again.'
          })
          return
        }
        
        // Redirect to LinkedIn OAuth
        window.location.href = result.auth_url
      } catch (error) {
        console.error('Failed to connect LinkedIn:', error)
        setStatusMessage({
          type: 'error',
          message: 'Failed to connect. Please try again.'
        })
      } finally {
        setIsConnecting(false)
      }
    } else {
      // Other platforms not yet implemented
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
        } else if (platformName === 'pinterest') {
          result = await disconnectPinterestAccountAction(connectionId)
        } else if (platformName === 'linkedin') {
          result = await disconnectLinkedInAccountAction(connectionId)
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
          // Reload platforms
          loadPlatforms()
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-500">Loading platforms...</p>
        </div>
      </div>
    )
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
          <div className={`mb-6 p-4 rounded-lg flex items-center gap-3 max-w-2xl mx-auto ${
            statusMessage.type === 'success' 
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
              <div key={platform.name} className="bg-white rounded-lg border border-gray-200 shadow-sm">
                <div className="p-6">
                  <div className="flex items-center justify-center w-12 h-12 bg-gray-50 rounded-lg mb-4 mx-auto">
                    <IconComponent className="w-6 h-6 text-gray-600" />
                  </div>
                  
                  <h3 className="text-lg font-medium text-gray-900 text-center mb-2">
                    {platform.display_name}
                  </h3>
                  
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
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-gray-900 truncate">
                                {connection.facebook_page_name || 
                                 connection.instagram_username || 
                                 connection.platform_display_name || 
                                 connection.platform_username || 
                                 'Unnamed Account'}
                              </p>
                              {connection.is_verified && (
                                <span className="text-xs text-blue-600">Verified</span>
                              )}
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
                        Connect your {platform.display_name} account to manage and publish content
                      </p>
                      
                      <button
                        onClick={() => handleConnect(platform.name)}
                        disabled={isConnecting}
                        className="w-full flex justify-center items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isConnecting ? 'Connecting...' : `Connect ${platform.display_name}`}
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