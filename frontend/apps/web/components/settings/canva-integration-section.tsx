'use client'

import { useCanva } from '@/hooks/useCanva'
import { Loader2 } from 'lucide-react'

export function CanvaIntegrationSection() {
  const { isConnected, checking, connectToCanva, openCanvaDesign } = useCanva()

  return (
    <div className="space-y-6">
      {/* Connection Status */}
      <div className="rounded-lg border border-gray-200 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Canva Connection</h3>
            <p className="text-sm text-gray-600 mt-1">
              Connect your Canva account to create and edit designs directly from Elevate
            </p>
          </div>

          {checking ? (
            <div className="flex items-center gap-2 text-gray-500">
              <Loader2 className="h-5 w-5 animate-spin" />
              <span className="text-sm">Checking...</span>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <div
                  className={`h-3 w-3 rounded-full ${isConnected ? 'bg-green-500' : 'bg-gray-300'
                    }`}
                />
                <span className="text-sm font-medium whitespace-nowrap text-gray-700">
                  {isConnected ? 'Connected' : 'Not Connected'}
                </span>
              </div>

              {!isConnected && (
                <button
                  onClick={connectToCanva}
                  className="px-4 py-2 bg-purple-600 whitespace-nowrap hover:bg-purple-700 text-white text-sm font-medium rounded-lg transition-colors"
                >
                  Connect Canva
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Feature Information */}
      <div className="rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          What you can do with Canva
        </h3>

        <div className="space-y-4">
          <div className="flex gap-3">
            <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-purple-100 flex items-center justify-center">
              <svg className="w-5 h-5 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122" />
              </svg>
            </div>
            <div>
              <h4 className="font-medium text-gray-900">Create Professional Designs</h4>
              <p className="text-sm text-gray-600 mt-1">
                Access Canva's full design editor with thousands of templates for social media posts, presentations, and more
              </p>
            </div>
          </div>

          <div className="flex gap-3">
            <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-purple-100 flex items-center justify-center">
              <svg className="w-5 h-5 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <div>
              <h4 className="font-medium text-gray-900">Export & Download</h4>
              <p className="text-sm text-gray-600 mt-1">
                Export your designs in high quality and download them directly to use in your content
              </p>
            </div>
          </div>

          <div className="flex gap-3">
            <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-purple-100 flex items-center justify-center">
              <svg className="w-5 h-5 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <div>
              <h4 className="font-medium text-gray-900">Manage Your Designs</h4>
              <p className="text-sm text-gray-600 mt-1">
                Keep track of all your Canva designs in one place, with easy access to edit or export anytime
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Action */}
      {isConnected && (
        <div className="rounded-lg border border-purple-200 bg-purple-50 p-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-purple-900">
                Ready to create?
              </h3>
              <p className="text-sm text-purple-700 mt-1">
                Start designing with Canva's powerful editor right now
              </p>
            </div>
            <button
              onClick={openCanvaDesign}
              className="px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white font-medium rounded-lg transition-colors shadow-sm"
            >
              Create Design
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
