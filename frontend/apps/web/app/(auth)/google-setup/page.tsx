'use client'

import { useState, useEffect } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { FcGoogle } from 'react-icons/fc'
import { checkUsernameAction } from '@/actions'
import { completeGoogleRegistration } from '@/actions/google-oauth-action'

export default function GoogleSetupPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [username, setUsername] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [isCheckingUsername, setIsCheckingUsername] = useState(false)
  const [usernameAvailable, setUsernameAvailable] = useState<boolean | null>(null)
  
  // Get Google data from URL params
  const googleData = searchParams.get('data')
  const [parsedGoogleData, setParsedGoogleData] = useState<any>(null)

  useEffect(() => {
    if (googleData) {
      try {
        const decoded = JSON.parse(decodeURIComponent(googleData))
        setParsedGoogleData(decoded)
        // Suggest username based on name or email
        const suggestedUsername = decoded.email?.split('@')[0] || decoded.given_name || ''
        setUsername(suggestedUsername.toLowerCase().replace(/[^a-z0-9]/g, ''))
      } catch (error) {
        console.error('Failed to parse Google data:', error)
        router.push('/login')
      }
    } else {
      router.push('/login')
    }
  }, [googleData, router])

  // Check username availability with debounce
  useEffect(() => {
    if (!username || username.length < 3) {
      setUsernameAvailable(null)
      return
    }

    const timeoutId = setTimeout(async () => {
      setIsCheckingUsername(true)
      try {
        const result = await checkUsernameAction({ username })
        if (result && 'available' in result) {
          setUsernameAvailable(result.available)
        }
      } catch (error) {
        console.error('Error checking username:', error)
      } finally {
        setIsCheckingUsername(false)
      }
    }, 500)

    return () => clearTimeout(timeoutId)
  }, [username])

  const handleCompleteRegistration = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!username || username.length < 3) {
      setError('Username must be at least 3 characters long')
      return
    }

    if (usernameAvailable === false) {
      setError('Username is already taken')
      return
    }

    setIsLoading(true)
    setError('')

    try {
      // Complete Google OAuth registration with username
      const result = await completeGoogleRegistration({
        username,
        google_token: parsedGoogleData.google_token,
        google_data: parsedGoogleData
      })

      if (result.success && result.data) {
        // Registration successful - redirect to login with success message
        router.push(`/login?registration=success&username=${result.data.user.username}`)
      } else {
        setError(result.error || 'Registration failed')
      }
    } catch (error) {
      console.error('Registration error:', error)
      setError('Registration failed. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  if (!parsedGoogleData) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <div className="flex justify-center">
            <FcGoogle className="w-12 h-12" />
          </div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Choose your username
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Welcome {parsedGoogleData.name}! Please choose a username to complete your account setup.
          </p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleCompleteRegistration}>
          <div>
            <label htmlFor="username" className="block text-sm font-medium text-gray-700">
              Username
            </label>
            <div className="mt-1 relative">
              <input
                id="username"
                name="username"
                type="text"
                required
                className="appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-lg focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                placeholder="Enter your username"
                value={username}
                onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9]/g, ''))}
                maxLength={30}
                minLength={3}
              />
              {isCheckingUsername && (
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-indigo-500"></div>
                </div>
              )}
            </div>
            
            {/* Username validation feedback */}
            {username && username.length >= 3 && !isCheckingUsername && (
              <div className="mt-1">
                {usernameAvailable === true && (
                  <p className="text-sm text-green-600">✓ Username is available</p>
                )}
                {usernameAvailable === false && (
                  <p className="text-sm text-red-600">✗ Username is already taken</p>
                )}
              </div>
            )}
            
            {username && username.length < 3 && (
              <p className="mt-1 text-sm text-gray-500">Username must be at least 3 characters</p>
            )}
          </div>

          {error && (
            <div className="bg-red-100 border border-red-200 rounded-lg p-3">
              <p className="text-red-700 text-sm">{error}</p>
            </div>
          )}

          <div>
            <button
              type="submit"
              disabled={isLoading || !username || username.length < 3 || usernameAvailable === false || isCheckingUsername}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Creating Account...' : 'Complete Registration'}
            </button>
          </div>

          <div className="text-center">
            <button
              type="button"
              onClick={() => router.push('/login')}
              className="text-sm text-indigo-600 hover:text-indigo-500"
            >
              Back to login
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}