'use client'

import { loginFormSchema } from '@/lib/validation'
import { zodResolver } from '@hookform/resolvers/zod'
import { signIn } from 'next-auth/react'
import { useSearchParams } from 'next/navigation'
import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import type { z } from 'zod'
import { toast } from 'sonner'
import { GoogleSignInButton } from './google-signin-button'

type LoginFormSchema = z.infer<typeof loginFormSchema>

export function LoginForm() {
  const search = useSearchParams()
  const [showPassword, setShowPassword] = useState(false)

  // Show toast for OAuth errors
  useEffect(() => {
    if (search.has('error') && search.get('error') === 'OAuthAccountNotLinked') {
      toast.error('Registration is currently disabled', {
        description: 'New sign ups are not available at this time. Please contact support if you need access.',
      })
    }
  }, [search])


  const { register, handleSubmit, formState } = useForm<LoginFormSchema>({
    resolver: zodResolver(loginFormSchema)
  })

  const onSubmitHandler = handleSubmit((data) => {
    signIn('credentials', {
      username: data.username,
      password: data.password,
      callbackUrl: '/dashboard'
    })
  })

  return (
    <div className="w-full max-w-md">
      <h1 className="text-3xl font-bold text-black mb-2">
        Welcome back
      </h1>
      <p className="text-gray-600 mb-8">
        Sign in to your Elevate Social account
      </p>

      {search.has('error') && search.get('error') === 'CredentialsSignin' && (
        <div className="bg-red-100 border border-red-200 rounded-lg p-3 mb-6 flex items-center gap-2">
          <span className="text-red-600">❌</span>
          <span className="text-red-700 text-sm">Invalid username/email or password. Please try again.</span>
        </div>
      )}

      <form onSubmit={onSubmitHandler} className="space-y-6">

        <div className="space-y-4">
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">Username or Email</label>
            <input
              {...register('username')}
              type="text"
              placeholder="Enter your username or email"
              className="w-full px-3 h-11 border border-gray-300 rounded-lg focus:ring-2 focus:border-transparent outline-none text-sm"
              style={{'--focus-ring-color': '#714efe'} as any}
              onFocus={(e) => e.target.style.boxShadow = `0 0 0 2px #714efe66`}
              onBlur={(e) => e.target.style.boxShadow = ''}
            />
            {formState.errors.username && (
              <p className="text-red-500 text-sm">{formState.errors.username.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">Password</label>
            <div className="relative">
              <input
                {...register('password', { required: true })}
                type={showPassword ? 'text' : 'password'}
                placeholder="Enter your password"
                className="w-full px-3 h-11 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:border-transparent outline-none text-sm"
                style={{'--focus-ring-color': '#714efe'} as any}
                onFocus={(e) => e.target.style.boxShadow = `0 0 0 2px #714efe66`}
                onBlur={(e) => e.target.style.boxShadow = ''}
              />
              <button
                type="button"
                className="absolute inset-y-0 right-0 flex items-center pr-3"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? (
                  <svg className="h-4 w-4 text-gray-400 hover:text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 11-4.243-4.243m4.242 4.242L9.88 9.88" />
                  </svg>
                ) : (
                  <svg className="h-4 w-4 text-gray-400 hover:text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                )}
              </button>
            </div>
            {formState.errors.password && (
              <p className="text-red-500 text-sm">{formState.errors.password.message}</p>
            )}

            <div className="flex justify-end mt-2">
              <a href="/forgot-password" className="text-sm font-medium hover:underline" style={{color: '#714efe'}}>Forgot password?</a>
            </div>
          </div>
        </div>

        <button
          type="submit"
          className="w-full text-white font-medium h-11 rounded-lg text-sm transition-colors"
          style={{backgroundColor: '#714efe'}}
          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#5f3fd6'}
          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#714efe'}
        >
          Sign in
        </button>
      </form>

      {/* Divider */}
      <div className="relative my-6">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-gray-300" />
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="bg-gray-50 px-2 text-gray-500">Or continue with</span>
        </div>
      </div>

      {/* Google Sign-In Button */}
      <GoogleSignInButton callbackUrl="/dashboard" />

      <p className="text-xs text-gray-500 mt-6 text-center">
        By signing in, you agree to our{' '}
        <a href="/terms" className="underline">Terms of Service</a> and{' '}
        <a href="/privacy" className="underline">Privacy Policy</a>.
      </p>
    </div>
  )
}
