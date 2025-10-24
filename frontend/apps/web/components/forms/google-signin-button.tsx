'use client'

import { signIn } from 'next-auth/react'
import { useState } from 'react'
import { FcGoogle } from 'react-icons/fc'

interface GoogleSignInButtonProps {
  callbackUrl?: string
  className?: string
}

export function GoogleSignInButton({
  callbackUrl = '/dashboard',
  className = ''
}: GoogleSignInButtonProps) {
  const [isLoading, setIsLoading] = useState(false)

  const handleGoogleSignIn = async () => {
    try {
      setIsLoading(true)
      await signIn('google', {
        callbackUrl,
        redirect: true
      })
    } catch (error) {
      console.error('Google sign-in error:', error)
      setIsLoading(false)
    }
  }

  return (
    <button
      type="button"
      onClick={handleGoogleSignIn}
      disabled={isLoading}
      className={`flex items-center justify-center w-full px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors ${className}`}
      style={{ '--focus-ring-color': '#bea456' } as any}
      onFocus={(e) => e.target.style.boxShadow = `0 0 0 2px #bea45666`}
      onBlur={(e) => e.target.style.boxShadow = ''}
    >
      <FcGoogle className="w-5 h-5 mr-2" />
      {isLoading ? 'Signing in...' : 'Continue with Google'}
    </button>
  )
}