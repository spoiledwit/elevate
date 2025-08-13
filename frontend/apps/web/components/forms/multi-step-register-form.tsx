'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import logo from '@/assets/logo.png'
import type { registerAction } from '@/actions/register-action'

// Schema for multi-step form
const stepOneSchema = z.object({
  username: z.string().min(3, 'Username must be at least 3 characters')
})

const stepTwoSchema = z.object({
  email: z.string().email('Please enter a valid email'),
  password: z.string().min(8, 'Password must be at least 8 characters')
})

const stepThreeSchema = z.object({
  instagram: z.string().optional(),
  facebook: z.string().optional(),
  tiktok: z.string().optional(),
  pinterest: z.string().optional(),
  youtube: z.string().optional(),
  linkedin: z.string().optional()
})

type StepOneData = z.infer<typeof stepOneSchema>
type StepTwoData = z.infer<typeof stepTwoSchema>
type StepThreeData = z.infer<typeof stepThreeSchema>

interface MultiStepRegisterFormProps {
  onSubmitHandler: typeof registerAction
}

export function MultiStepRegisterForm({ onSubmitHandler }: MultiStepRegisterFormProps) {
  const [currentStep, setCurrentStep] = useState(1)
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    socialProfiles: {}
  })
  const [isLoading, setIsLoading] = useState(false)

  // Step 1 - Username
  const stepOneForm = useForm<StepOneData>({
    resolver: zodResolver(stepOneSchema)
  })

  // Step 2 - Email/Password
  const stepTwoForm = useForm<StepTwoData>({
    resolver: zodResolver(stepTwoSchema)
  })

  // Step 3 - Social Profiles
  const stepThreeForm = useForm<StepThreeData>({
    resolver: zodResolver(stepThreeSchema)
  })

  const handleStepOne = (data: StepOneData) => {
    setFormData(prev => ({ ...prev, username: data.username }))
    setCurrentStep(2)
  }

  const handleStepTwo = (data: StepTwoData) => {
    setFormData(prev => ({ ...prev, email: data.email, password: data.password }))
    setCurrentStep(3)
  }

  const handleStepThree = async (data: StepThreeData) => {
    setFormData(prev => ({ ...prev, socialProfiles: data }))
    setCurrentStep(4)
    setIsLoading(true)

    // Simulate API call
    setTimeout(() => {
      setIsLoading(false)
      // Redirect to dashboard or next step
    }, 3000)
  }

  const renderStepIndicator = () => (
    <div className="flex items-center justify-center mb-8">
      <div className="flex items-center gap-4">
        {[1, 2, 3].map((step) => (
          <div key={step} className="flex items-center">
            <div className={`flex items-center justify-center w-10 h-10 rounded-full font-semibold transition-colors ${currentStep >= step ? 'bg-purple-500 text-white' : 'bg-gray-200 text-gray-500'
              }`}>
              {step}
            </div>
            {step < 3 && (
              <div className={`w-24 h-1 rounded-full transition-colors ${currentStep > step ? 'bg-purple-500' : 'bg-gray-200'
                }`}></div>
            )}
          </div>
        ))}
      </div>
    </div>
  )

  // Step 1: Username Claim
  if (currentStep === 1) {
    return (
      <div className="w-full max-w-md">
        {renderStepIndicator()}

        <h1 className="text-3xl font-bold text-black mb-2">
          Create Your Account
        </h1>
        <p className="text-gray-600 mb-8">
          Already have an account?{' '}
          <a href="/login" className="text-purple-500 font-semibold hover:underline">
            Login
          </a>
        </p>

        <form onSubmit={stepOneForm.handleSubmit(handleStepOne)} className="space-y-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2 bg-gray-50 rounded-lg px-4 py-4 border border-gray-200 focus-within:border-purple-500 transition-colors">
              <img src={logo.src} alt="" className="h-8" />
              <span className="font-semibold text-gray-700">elevate.social</span>
              <span className="text-purple-500 font-semibold">/</span>
              <input
                {...stepOneForm.register('username')}
                type="text"
                placeholder="yourname"
                className="flex-1 bg-transparent outline-none text-gray-900 placeholder-gray-400 font-medium"
              />
            </div>
            {stepOneForm.formState.errors.username && (
              <p className="text-red-500 text-sm">{stepOneForm.formState.errors.username.message}</p>
            )}
          </div>

          <button
            type="submit"
            className="w-full bg-purple-600 text-white font-semibold py-4 rounded-lg text-lg"
          >
            Create My Free Elevate Social
          </button>
        </form>

        <p className="text-xs text-gray-500 mt-6 text-center">
          By signing up, you agree to our{' '}
          <a href="/terms" className="underline">Terms of Service</a> and{' '}
          <a href="/privacy" className="underline">Privacy Policy</a>.
          This site is protected by reCAPTCHA and the Google Terms of Service and Privacy Policy apply.
        </p>
      </div>
    )
  }

  // Step 2: Email and Password
  if (currentStep === 2) {
    return (
      <div className="w-full max-w-md">
        {renderStepIndicator()}

        <div className="flex items-center gap-2 mb-6">
          <img src={logo.src} alt="Elevate Social" className="h-8" />
          <span className="text-sm text-gray-500">elevate.social</span>
        </div>

        {/* Success message */}
        <div className="bg-green-100 border border-green-200 rounded-lg p-3 mb-6 flex items-center gap-2">
          <span className="text-green-600">🎉</span>
          <span className="text-green-700 text-sm">{formData.username} is available</span>
        </div>

        <form onSubmit={stepTwoForm.handleSubmit(handleStepTwo)} className="space-y-6">
          <div className="text-center mb-6">
            <button className="w-full flex items-center justify-center gap-3 bg-white border border-gray-300 rounded-lg py-3 px-4 hover:bg-gray-50 transition-colors">
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="#4285f4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34a853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#fbbc05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                <path fill="#ea4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
              </svg>
              Continue with Google
            </button>
          </div>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-gray-500">OR</span>
            </div>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">Email</label>
              <input
                {...stepTwoForm.register('email')}
                type="email"
                placeholder="Enter your email address"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-colors"
              />
              {stepTwoForm.formState.errors.email && (
                <p className="text-red-500 text-sm">{stepTwoForm.formState.errors.email.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">Password</label>
              <input
                {...stepTwoForm.register('password')}
                type="password"
                placeholder="Enter your password"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-colors"
              />
              <p className="text-xs text-gray-500">Password should be 8+ characters.</p>
              {stepTwoForm.formState.errors.password && (
                <p className="text-red-500 text-sm">{stepTwoForm.formState.errors.password.message}</p>
              )}
            </div>
          </div>

          <button
            type="submit"
            className="w-full bg-purple-500 hover:bg-purple-600 text-white font-semibold py-4 rounded-lg transition-colors text-lg"
          >
            Sign Up
          </button>
        </form>

        <p className="text-xs text-gray-500 mt-6 text-center">
          By signing up, you agree to our{' '}
          <a href="/terms" className="underline">Terms of Service</a> and{' '}
          <a href="/privacy" className="underline">Privacy Policy</a>.
          This site is protected by reCAPTCHA and the Google Terms of Service and Privacy Policy apply.
        </p>
      </div>
    )
  }

  // Step 3: Social Profiles
  if (currentStep === 3) {
    const socialPlatforms = [
      { name: 'instagram', icon: '📷', placeholder: 'username', color: 'from-purple-500 to-pink-500' },
      { name: 'facebook', icon: 'f', placeholder: 'username', color: 'bg-blue-500' },
      { name: 'tiktok', icon: '🎵', placeholder: 'username', color: 'bg-black' },
      { name: 'pinterest', icon: 'P', placeholder: 'username', color: 'bg-red-500' },
      { name: 'youtube', icon: '▶️', placeholder: 'username', color: 'bg-red-600' },
      { name: 'linkedin', icon: 'in', placeholder: 'username', color: 'bg-blue-600' }
    ]

    return (
      <div className="w-full max-w-md">
        {renderStepIndicator()}

        <div className="flex items-center gap-2 mb-6">
          <img src={logo.src} alt="Elevate Social" className="h-8" />
          <span className="text-sm text-gray-500">elevate.social</span>
        </div>

        <div className="mb-6">
          <span className="text-sm text-gray-500">Step 1</span>
          <h2 className="text-2xl font-bold text-black mb-2">
            Connect Your Social Profiles.
          </h2>
          <p className="text-gray-600">
            Connect your social profiles to automatically display your icons on your Elevate Social page.
          </p>
        </div>

        <form onSubmit={stepThreeForm.handleSubmit(handleStepThree)} className="space-y-4">
          {socialPlatforms.map((platform) => (
            <div key={platform.name} className="flex items-center gap-3 border border-gray-200 rounded-lg px-4 py-3">
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-white text-sm font-bold ${platform.color.startsWith('from-') ? `bg-gradient-to-r ${platform.color}` : platform.color
                }`}>
                {platform.icon}
              </div>
              <input
                {...stepThreeForm.register(platform.name as keyof StepThreeData)}
                type="text"
                placeholder={platform.placeholder}
                className="flex-1 outline-none text-gray-900 placeholder-gray-400"
              />
            </div>
          ))}

          <button
            type="submit"
            className="w-full bg-purple-500 hover:bg-purple-600 text-white font-semibold py-4 rounded-lg transition-colors text-lg mt-8"
          >
            Next
          </button>
        </form>
      </div>
    )
  }

  // Step 4: Loading/Completion
  if (currentStep === 4) {
    return (
      <div className="w-full max-w-md text-center">
        <div className="mb-8">
          <img src={logo.src} alt="Elevate Social" className="h-16 mx-auto mb-4" />
          <span className="text-lg font-semibold text-gray-700">elevate.social</span>
        </div>

        <h2 className="text-2xl font-bold text-black mb-2">
          Elevating your brand.
        </h2>
        <p className="text-gray-600 mb-8">
          Connecting your platforms...
        </p>

        <div className="w-full bg-gray-200 rounded-full h-2 mb-8">
          <div className="bg-purple-500 h-2 rounded-full animate-pulse" style={{ width: '70%' }}></div>
        </div>

        {isLoading && (
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500 mx-auto"></div>
        )}
      </div>
    )
  }

  return null
}