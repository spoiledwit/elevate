'use client'

import type { profileAction } from '@/actions/profile-action'
import { fieldApiError } from '@/lib/forms'
import { profileFormSchema } from '@/lib/validation'
import type { UserCurrent } from '@frontend/types/api'
import { SubmitField } from '@frontend/ui/forms/submit-field'
import { TextField } from '@frontend/ui/forms/text-field'
import { SuccessMessage } from '@frontend/ui/messages/success-message'
import { zodResolver } from '@hookform/resolvers/zod'
import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import type { z } from 'zod'
import { checkUsernameAction } from '@/actions/check-username-action'
import logo from '@/assets/logo.png'
import { useSession } from 'next-auth/react'

export type ProfileFormSchema = z.infer<typeof profileFormSchema>

export function ProfileSection({
  currentUser,
  onSubmitHandler
}: {
  currentUser: Promise<UserCurrent>
  onSubmitHandler: typeof profileAction
}) {
  const [success, setSuccess] = useState<boolean>(false)
  const [username, setUsername] = useState<string>('')
  const [originalUsername, setOriginalUsername] = useState<string>('')
  const [isChecking, setIsChecking] = useState(false)
  const [isAvailable, setIsAvailable] = useState<boolean | null>(null)
  const [debouncedUsername, setDebouncedUsername] = useState('')
  const { update: updateSession } = useSession()

  const { formState, handleSubmit, register, setError, setValue, watch } =
    useForm<ProfileFormSchema>({
      resolver: zodResolver(profileFormSchema),
      defaultValues: async () => {
        const user = await currentUser
        const username = user.username || ''
        setUsername(username)
        setOriginalUsername(username)
        setDebouncedUsername(username)

        return {
          username: username,
          firstName: user.first_name || '',
          lastName: user.last_name || ''
        }
      }
    })

  // Watch username field changes
  const usernameValue = watch('username')

  // Update local state when form value changes
  useEffect(() => {
    if (usernameValue !== undefined) {
      setUsername(usernameValue)
    }
  }, [usernameValue])

  // Debounce username changes
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedUsername(username)
    }, 500)
    return () => clearTimeout(timer)
  }, [username])

  // Check username availability
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

  // Check if it's the user's own username
  const isOwnUsername = username.toLowerCase() === originalUsername.toLowerCase()

  const getInputBorderClass = () => {
    if (username.length < 3) return 'border-gray-300'
    if (isChecking) return 'border-gray-300'
    // If it's their own username or available, show green
    if (isAvailable === true || isOwnUsername) return 'border-green-400'
    if (isAvailable === false) return 'border-red-400'
    return 'border-gray-300'
  }

  const getStatusIndicator = () => {
    if (username.length < 3 || isChecking) return null

    // Show "taken by you" if it's their own username, regardless of API response
    if (isOwnUsername) {
      return (
        <div className="flex items-center gap-1">
          <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          <span className="text-xs text-green-600 font-medium">taken by you</span>
        </div>
      )
    }

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
    <form
      method="post"
      onSubmit={handleSubmit(async (data) => {
        const res = await onSubmitHandler(data)

        if (res !== true && typeof res !== 'boolean') {
          setSuccess(false)

          fieldApiError('username', 'username', res, setError)
          fieldApiError('first_name', 'firstName', res, setError)
          fieldApiError('last_name', 'lastName', res, setError)
        } else {
          setSuccess(true)
          // Update the session with new username to refresh sidebar
          if (data.username && data.username !== originalUsername) {
            await updateSession({ username: data.username })
            setOriginalUsername(data.username)
          }
        }
      })}
    >
      {success && (
        <SuccessMessage>Profile has been successfully updated</SuccessMessage>
      )}

      <div className="space-y-6">
        {/* Username Section */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            Username
          </label>
          <div className="relative">
            <div className={`flex items-center gap-2 bg-white rounded-lg px-3 h-11 shadow-sm overflow-hidden border transition-all duration-200 ${getInputBorderClass()}`}>
              <img
                src={logo.src}
                alt="elevate.social"
                className="h-6 flex-shrink-0"
              />
              <span className="font-medium text-sm flex-shrink-0 text-gray-700">elevate.social</span>
              <span className="font-medium text-sm flex-shrink-0" style={{ color: '#bea456' }}>/</span>
              <input
                {...register('username')}
                type="text"
                placeholder="username"
                onChange={(e) => {
                  const value = e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '')
                  setValue('username', value)
                  setUsername(value)
                }}
                className="min-w-0 flex-1 outline-none text-sm font-medium"
                style={{ color: '#bea456' }}
                maxLength={30}
              />
            </div>
            <div className="flex justify-end mt-2">
              {getStatusIndicator()}
            </div>
          </div>
          {formState.errors.username && (
            <p className="text-red-500 text-sm mt-1">{formState.errors.username.message}</p>
          )}
          <p className="text-xs text-gray-500">
            Your profile will be accessible at elevate.social/{username || 'username'}
          </p>
        </div>

        <TextField
          type="text"
          register={register('firstName')}
          label="First name"
          formState={formState}
        />

        <TextField
          type="text"
          register={register('lastName')}
          label="Last name"
          formState={formState}
        />

        <SubmitField isLoading={formState.isLoading}>
          Update profile
        </SubmitField>
      </div>
    </form>
  )
}