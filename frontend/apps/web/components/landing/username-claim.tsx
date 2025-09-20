'use client'

import { useState, useEffect } from 'react'
import logo from "@/assets/logo.png"
import { checkUsernameAction } from '@/actions/check-username-action'
import { useRouter } from 'next/navigation'

interface UsernameClaimProps {
  onSubmit?: (username: string) => void // Optional custom submit handler
  buttonText?: string // Optional custom button text
  initialValue?: string // Optional initial username value
  layout?: 'row' | 'col' // Layout direction - row (horizontal) or col (vertical)
  variant?: 'large' | 'small' // Size variant - large for landing, small for forms
}

export function UsernameClaim({ onSubmit, buttonText = "Claim your username", initialValue = "", layout = "row", variant = "large" }: UsernameClaimProps) {
  const [username, setUsername] = useState(initialValue)
  const [isChecking, setIsChecking] = useState(false)
  const [isAvailable, setIsAvailable] = useState<boolean | null>(null)
  const [debouncedUsername, setDebouncedUsername] = useState('')
  const router = useRouter()

  // Update username when initialValue changes
  useEffect(() => {
    if (initialValue && initialValue !== username) {
      setUsername(initialValue)
    }
  }, [initialValue])

  // Debounce the username input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedUsername(username)
    }, 500) // 500ms delay

    return () => clearTimeout(timer)
  }, [username])

  // Check username availability when debounced value changes
  useEffect(() => {
    const checkAvailability = async () => {
      if (debouncedUsername.length < 3) {
        setIsAvailable(null)
        return
      }

      setIsChecking(true)
      try {
        const result = await checkUsernameAction(debouncedUsername)
        if (result) {
          setIsAvailable(result.available)
        } else {
          setIsAvailable(null)
        }
      } catch (error) {
        console.error('Error checking username:', error)
        setIsAvailable(null)
      } finally {
        setIsChecking(false)
      }
    }

    checkAvailability()
  }, [debouncedUsername])

  const handleClaimUsername = () => {
    if (isAvailable && username.length >= 3) {
      if (onSubmit) {
        // Use custom submit handler if provided
        onSubmit(username)
      } else {
        // Default behavior: navigate to registration page with the username
        router.push(`/get-started?username=${encodeURIComponent(username)}`)
      }
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleClaimUsername()
    }
  }

  // Determine input border color based on availability
  const getInputBorderClass = () => {
    if (username.length < 3) return 'border-transparent'
    if (isChecking) return 'border-gray-300'
    if (isAvailable === true) return 'border-green-400'
    if (isAvailable === false) return 'border-red-400'
    return 'border-transparent'
  }

  // Determine status indicator
  const getStatusIndicator = () => {
    if (username.length < 3 || isChecking) return null
    if (isAvailable === true) {
      return (
        <div className="flex items-center gap-1">
          <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          <span className="text-xs text-green-600 font-medium">available</span>
        </div>
      )
    }
    if (isAvailable === false) {
      return (
        <div className="flex items-center gap-1">
          <svg className="w-4 h-4 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
          <span className="text-xs text-red-600 font-medium">taken</span>
        </div>
      )
    }
    return null
  }

  return (
    <div className="w-full">
      <div className={`flex ${layout === 'col' ? 'flex-col' : 'flex-col sm:flex-row items-stretch'} justify-center gap-3 max-w-xl mx-auto px-4 sm:px-0`}>
        <div className={`${layout === 'row' ? 'flex-1' : 'w-full'} relative`}>
          <div className={`flex items-center gap-1 sm:gap-2 bg-white rounded-lg ${variant === 'large' ? 'px-2 sm:px-4 h-12 sm:h-14' : 'px-3 h-11'} shadow-sm overflow-hidden border transition-all duration-200 ${getInputBorderClass()}`}>
            <img
              src={logo.src}
              alt="elevate.social"
              className={`${variant === 'large' ? 'h-6 sm:h-8' : 'h-6'} flex-shrink-0`}
            />
            <span className={`font-medium ${variant === 'large' ? 'text-sm sm:text-lg hidden xs:block' : 'text-sm'} flex-shrink-0 text-gray-700`}>elevate.social</span>
            <span className={`font-medium ${variant === 'large' ? 'text-sm sm:text-lg' : 'text-sm'} flex-shrink-0`} style={{ color: '#714efe' }}>/</span>
            <input
              type="text"
              placeholder="username"
              value={username}
              onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
              onKeyDown={handleKeyDown}
              className={`min-w-0 flex-1 outline-none ${variant === 'large' ? 'text-sm sm:text-lg' : 'text-sm'} font-medium`}
              style={{ color: '#714efe' }}
              maxLength={30}
            />
            {layout === 'col' && (
              <div className="absolute -top-2 right-2 bg-white px-2 py-1 rounded shadow-sm">
                {getStatusIndicator()}
              </div>
            )}
          </div>
          {layout === 'row' && (
            <div className="flex justify-center mt-2">
              {getStatusIndicator()}
            </div>
          )}
        </div>

        <button
          onClick={handleClaimUsername}
          disabled={!isAvailable || username.length < 3}
          className={`${layout === 'col' ? 'w-full' : variant === 'large' ? 'px-4 sm:px-6' : 'px-4'} ${variant === 'large' ? 'h-12 sm:h-14' : 'h-11'} rounded-lg font-medium text-center ${variant === 'large' ? 'text-sm sm:text-lg' : 'text-sm'} transition-all text-white ${isAvailable && username.length >= 3
            ? 'cursor-pointer'
            : 'cursor-not-allowed'
            }`}
          style={{ backgroundColor: '#714efe' }}
          onMouseEnter={(e) => {
            if (isAvailable && username.length >= 3) {
              e.currentTarget.style.backgroundColor = '#5f3fd6'
            }
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = '#714efe'
          }}
        >
          <span className="block sm:hidden">Claim</span>
          <span className="hidden sm:block">{buttonText}</span>
        </button>

      </div>
    </div>
  )
}