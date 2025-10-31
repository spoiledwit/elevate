'use client'

import { useEffect, useState, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { handleCanvaCallbackAction } from '@/actions/canva-action'

function CanvaCallbackContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [status, setStatus] = useState<'processing' | 'success' | 'error'>('processing')
  const [errorMessage, setErrorMessage] = useState('')

  useEffect(() => {
    const handleCallback = async () => {
      // Check for error from Canva
      const error = searchParams.get('error')
      const errorDescription = searchParams.get('error_description')

      if (error) {
        console.error('Canva OAuth error:', error, errorDescription)
        setStatus('error')
        setErrorMessage(errorDescription || error)
        return
      }

      // Get authorization code
      const code = searchParams.get('code')
      const state = searchParams.get('state')

      if (!code || !state) {
        console.error('Missing code or state')
        setStatus('error')
        setErrorMessage('Missing authorization code or state')
        return
      }

      try {
        console.log('Processing Canva callback...')

        // The server action will get the session internally
        // We need to get user_id from localStorage if stored during auth
        const storedUserId = localStorage.getItem('canva_user_id')

        if (!storedUserId) {
          console.error('No user ID found')
          setStatus('error')
          setErrorMessage('Session expired. Please log in and try again.')
          return
        }

        // Exchange code for access token via backend
        const result = await handleCanvaCallbackAction({
          code,
          state,
          user_id: parseInt(storedUserId, 10)
        })

        console.log('Callback result:', result)

        if ('error' in result) {
          console.error('Callback error:', result.error)
          setStatus('error')
          setErrorMessage(result.error)
          return
        }

        console.log('Canva connection successful!')
        setStatus('success')

        // Clean up
        localStorage.removeItem('canva_user_id')

        // Redirect back to settings after 2 seconds
        setTimeout(() => {
          router.push('/settings?tab=canva')
        }, 2000)

      } catch (error) {
        console.error('Callback exception:', error)
        setStatus('error')
        setErrorMessage('Failed to complete authorization. Please try again.')
      }
    }

    handleCallback()
  }, [searchParams, router])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8">
        {status === 'processing' && (
          <div className="text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-gray-900 mx-auto mb-4"></div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Connecting to Canva...
            </h2>
            <p className="text-gray-600">
              Please wait while we complete the authorization.
            </p>
          </div>
        )}

        {status === 'success' && (
          <div className="text-center">
            <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100 mb-4">
              <svg
                className="h-8 w-8 text-green-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Successfully Connected!
            </h2>
            <p className="text-gray-600 mb-4">
              Your Canva account has been connected.
            </p>
            <p className="text-sm text-gray-500">
              Redirecting to dashboard...
            </p>
          </div>
        )}

        {status === 'error' && (
          <div className="text-center">
            <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-red-100 mb-4">
              <svg
                className="h-8 w-8 text-red-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Connection Failed
            </h2>
            <p className="text-gray-600 mb-4">
              {errorMessage}
            </p>
            <button
              onClick={() => router.push('/dashboard')}
              className="mt-4 px-6 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors"
            >
              Back to Dashboard
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

export default function CanvaCallbackPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-gray-900 mx-auto mb-4"></div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Loading...
            </h2>
          </div>
        </div>
      </div>
    }>
      <CanvaCallbackContent />
    </Suspense>
  )
}