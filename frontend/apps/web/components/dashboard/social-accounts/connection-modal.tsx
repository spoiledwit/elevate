'use client'

import { useState } from 'react'
import { X, ExternalLink, Shield, Zap, BarChart3, CheckCircle, Facebook, Instagram, Linkedin, Youtube, Twitter } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Platform {
  id: string
  name: string
  description: string
  icon: any
}

interface ConnectionModalProps {
  platform: string | null
  availablePlatforms: Platform[]
  onClose: () => void
  onConnect: (platformId: string, accountData: any) => void
}

const platformIcons = {
  facebook: Facebook,
  instagram: Instagram,
  linkedin: Linkedin,
  youtube: Youtube,
  tiktok: Twitter,
  pinterest: Twitter,
  twitter: Twitter
}

const connectionSteps = [
  {
    icon: Shield,
    title: 'Secure Authentication',
    description: 'We use OAuth 2.0 for secure, encrypted connections to your accounts'
  },
  {
    icon: Zap,
    title: 'Instant Access',
    description: 'Start posting and managing content immediately after connection'
  },
  {
    icon: BarChart3,
    title: 'Analytics & Insights',
    description: 'Get detailed analytics and performance insights for your content'
  }
]

export function ConnectionModal({ platform, availablePlatforms, onClose, onConnect }: ConnectionModalProps) {
  const [selectedPlatform, setSelectedPlatform] = useState(platform)
  const [isConnecting, setIsConnecting] = useState(false)
  const [step, setStep] = useState<'select' | 'connect' | 'success'>('select')

  const currentPlatform = availablePlatforms.find(p => p.id === selectedPlatform)
  const PlatformIcon = selectedPlatform ? platformIcons[selectedPlatform as keyof typeof platformIcons] : null

  const handleConnect = async () => {
    if (!selectedPlatform) return

    setIsConnecting(true)
    setStep('connect')

    // Simulate connection process
    setTimeout(() => {
      setStep('success')
      setTimeout(() => {
        onConnect(selectedPlatform, {
          platform: selectedPlatform,
          username: `user_${selectedPlatform}`,
          displayName: `My ${currentPlatform?.name} Account`
        })
      }, 2000)
    }, 2000)
  }

  const renderSelectStep = () => (
    <>
      <div className="flex items-center justify-between p-6 border-b border-gray-200">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Connect Social Account</h2>
          <p className="text-sm text-gray-600 mt-1">Choose a platform to connect</p>
        </div>
        <button
          onClick={onClose}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <X className="w-5 h-5 text-gray-400" />
        </button>
      </div>

      <div className="p-6 space-y-6">
        {/* Platform Selection */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {availablePlatforms.map((platformOption) => {
            const Icon = platformOption.icon
            const isSelected = selectedPlatform === platformOption.id

            return (
              <button
                key={platformOption.id}
                onClick={() => setSelectedPlatform(platformOption.id)}
                className={cn(
                  "p-4 border rounded-lg text-left transition-all hover:shadow-sm",
                  isSelected
                    ? "border-brand-500 bg-purple-50"
                    : "border-gray-200 hover:border-gray-300"
                )}
              >
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center">
                    <Icon className="w-5 h-5 text-gray-600" />
                  </div>
                  <span className="font-medium text-gray-900">{platformOption.name}</span>
                  {isSelected && (
                    <CheckCircle className="w-5 h-5 text-brand-600 ml-auto" />
                  )}
                </div>
                <p className="text-sm text-gray-600">{platformOption.description}</p>
              </button>
            )
          })}
        </div>

        {/* Connection Process */}
        <div>
          <h3 className="font-medium text-gray-900 mb-3">How it works:</h3>
          <div className="space-y-3">
            {connectionSteps.map((step, index) => (
              <div key={index} className="flex items-start gap-3">
                <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <step.icon className="w-4 h-4 text-brand-600" />
                </div>
                <div>
                  <p className="font-medium text-gray-900 text-sm">{step.title}</p>
                  <p className="text-sm text-gray-600">{step.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between p-6 border-t border-gray-200 bg-gray-50">
        <div className="text-sm text-gray-500">
          <Shield className="w-4 h-4 inline mr-1" />
          Your data is encrypted and secure
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleConnect}
            disabled={!selectedPlatform}
            className="flex items-center gap-2 px-6 py-2 bg-brand-600 text-white rounded-lg hover:bg-brand-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ExternalLink className="w-4 h-4" />
            Connect {currentPlatform?.name}
          </button>
        </div>
      </div>
    </>
  )

  const renderConnectStep = () => (
    <>
      <div className="flex items-center justify-between p-6 border-b border-gray-200">
        <div className="flex items-center gap-3">
          {PlatformIcon && (
            <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center">
              <PlatformIcon className="w-6 h-6 text-gray-600" />
            </div>
          )}
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Connecting to {currentPlatform?.name}</h2>
            <p className="text-sm text-gray-600">Please wait while we establish the connection...</p>
          </div>
        </div>
      </div>

      <div className="p-12 text-center">
        <div className="w-16 h-16 border-4 border-purple-200 border-t-brand-600 rounded-full animate-spin mx-auto mb-6"></div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">Authenticating...</h3>
        <p className="text-gray-600 mb-6">
          You may be redirected to {currentPlatform?.name} to authorize the connection.
        </p>
        <div className="bg-gray-50 rounded-lg p-4 text-left max-w-sm mx-auto">
          <p className="text-sm text-gray-600 mb-2">
            <strong>What's happening:</strong>
          </p>
          <ul className="text-sm text-gray-600 space-y-1">
            <li>• Redirecting to {currentPlatform?.name}</li>
            <li>• Requesting secure access</li>
            <li>• Establishing connection</li>
          </ul>
        </div>
      </div>
    </>
  )

  const renderSuccessStep = () => (
    <>
      <div className="flex items-center justify-between p-6 border-b border-gray-200">
        <div className="flex items-center gap-3">
          {PlatformIcon && (
            <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center">
              <PlatformIcon className="w-6 h-6 text-gray-600" />
            </div>
          )}
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Successfully Connected!</h2>
            <p className="text-sm text-gray-600">Your {currentPlatform?.name} account is now connected</p>
          </div>
        </div>
        <CheckCircle className="w-8 h-8 text-green-600" />
      </div>

      <div className="p-12 text-center">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircle className="w-8 h-8 text-green-600" />
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">All set!</h3>
        <p className="text-gray-600 mb-6">
          You can now start creating and scheduling posts for your {currentPlatform?.name} account.
        </p>
        <div className="bg-gray-50 rounded-lg p-4 text-left max-w-sm mx-auto">
          <p className="text-sm font-medium text-gray-900 mb-2">Next steps:</p>
          <ul className="text-sm text-gray-600 space-y-1">
            <li>• Create your first post</li>
            <li>• Set up posting schedule</li>
            <li>• View analytics dashboard</li>
          </ul>
        </div>
      </div>
    </>
  )

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {step === 'select' && renderSelectStep()}
        {step === 'connect' && renderConnectStep()}
        {step === 'success' && renderSuccessStep()}
      </div>
    </div>
  )
}