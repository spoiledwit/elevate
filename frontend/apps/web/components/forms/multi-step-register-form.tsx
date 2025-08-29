'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useSearchParams, useRouter } from 'next/navigation'
import { signIn } from 'next-auth/react'
import logo from '@/assets/logo.png'
import { UsernameClaim } from '@/components/landing/username-claim'
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
  const searchParams = useSearchParams()
  const router = useRouter()
  const usernameFromUrl = searchParams.get('username') || ''

  const [currentStep, setCurrentStep] = useState(1)
  const [showPassword, setShowPassword] = useState(false)
  const [formData, setFormData] = useState({
    username: usernameFromUrl,
    email: '',
    password: '',
    socialProfiles: {}
  })
  const [isLoading, setIsLoading] = useState(false)

  // Auto-populate username from URL parameter
  useEffect(() => {
    if (usernameFromUrl && usernameFromUrl !== formData.username) {
      setFormData(prev => ({ ...prev, username: usernameFromUrl }))
    }
  }, [usernameFromUrl, formData.username])

  // Step 1 - Username
  const stepOneForm = useForm<StepOneData>({
    resolver: zodResolver(stepOneSchema),
    defaultValues: {
      username: formData.username
    }
  })

  // Step 2 - Email/Password
  const stepTwoForm = useForm<StepTwoData>({
    resolver: zodResolver(stepTwoSchema),
    defaultValues: {
      email: formData.email,
      password: formData.password
    }
  })

  // Step 3 - Social Profiles
  const stepThreeForm = useForm<StepThreeData>({
    resolver: zodResolver(stepThreeSchema),
    defaultValues: formData.socialProfiles
  })

  const handleStepOne = (username: string) => {
    setFormData(prev => ({ ...prev, username }))
    setCurrentStep(2)
  }

  const handleStepTwo = async (data: StepTwoData) => {
    const updatedFormData = { ...formData, email: data.email, password: data.password }
    setFormData(updatedFormData)
    setCurrentStep(3)
    setIsLoading(true)

    try {
      // Call the actual registration API
      const registrationData = {
        username: updatedFormData.username,
        email: updatedFormData.email,
        password: updatedFormData.password,
        passwordRetype: updatedFormData.password,
        instagram: '',
        facebook: '',
        pinterest: '',
        linkedin: '',
        tiktok: '',
        youtube: '',
        twitter: '',
        website: '',
      }

      const result = await onSubmitHandler(registrationData)

      if (result === true || (typeof result === 'object' && 'success' in result && result.success)) {
        // Auto sign in the user
        if (typeof result === 'object' && 'credentials' in result) {
          await signIn('credentials', {
            username: result.credentials.username,
            password: result.credentials.password,
            redirect: false
          })
        }
        setIsLoading(false)
        router.push('/dashboard')
      } else {
        setIsLoading(false)
        setCurrentStep(2)
      }
    } catch (error) {
      setIsLoading(false)
      console.error('Registration error:', error)
    }
  }

  const handleStepThree = async (data: StepThreeData) => {
    // Check if at least one social link is provided
    const hasAtLeastOneLink = Object.values(data).some(value => value && value.trim() !== '')
    if (!hasAtLeastOneLink) {
      return // Prevent submission if no links provided
    }

    const updatedFormData = { ...formData, socialProfiles: data }
    setFormData(updatedFormData)
    setCurrentStep(4)
    setIsLoading(true)

    try {
      // Call the actual registration API
      const registrationData = {
        username: updatedFormData.username,
        email: updatedFormData.email,
        password: updatedFormData.password,
        passwordRetype: updatedFormData.password, // Assuming same as password
        instagram: data.instagram || '',
        facebook: data.facebook || '',
        pinterest: data.pinterest || '',
        linkedin: data.linkedin || '',
        tiktok: data.tiktok || '',
        youtube: data.youtube || '',
        twitter: '', // Not collected in step 3
        website: '', // Not collected in step 3
      }

      const result = await onSubmitHandler(registrationData)

      if (result === true || (typeof result === 'object' && 'success' in result && result.success)) {
        // Auto sign in the user
        if (typeof result === 'object' && 'credentials' in result) {
          await signIn('credentials', {
            username: result.credentials.username,
            password: result.credentials.password,
            redirect: false
          })
        }
        setIsLoading(false)
        router.push('/dashboard')
      } else {
        setIsLoading(false)
        setCurrentStep(3)
      }
    } catch (error) {
      setIsLoading(false)
      console.error('Registration error:', error)
    }
  }

  const goToStep = (step: number) => {
    if (step < currentStep) {
      setCurrentStep(step)
    }
  }

  // Reset form values when returning to previous steps or when formData changes
  useEffect(() => {
    stepOneForm.reset({ username: formData.username })
    stepTwoForm.reset({ email: formData.email, password: formData.password })
    stepThreeForm.reset(formData.socialProfiles)
  }, [currentStep, formData, stepOneForm, stepTwoForm, stepThreeForm])

  const renderStepIndicator = () => (
    <div className="flex items-center justify-center mb-6 sm:mb-8">
      <div className="flex items-center gap-2 sm:gap-4">
        {[1, 2].map((step) => (
          <div key={step} className="flex items-center">
            <button
              onClick={() => goToStep(step)}
              disabled={step >= currentStep}
              className={`flex items-center justify-center w-8 h-8 sm:w-10 sm:h-8 rounded-full font-semibold text-sm ${currentStep >= step
                ? 'bg-purple-500 text-white'
                : 'bg-gray-200 text-gray-500'
                } ${step < currentStep
                  ? 'hover:bg-purple-600 cursor-pointer'
                  : step >= currentStep
                    ? 'cursor-not-allowed'
                    : ''
                }`}
            >
              {step}
            </button>
            {step < 2 && (
              <div className={`w-16 sm:w-24 h-1 rounded-full ${currentStep > step ? 'bg-purple-500' : 'bg-gray-200'
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

        <h1 className="text-2xl sm:text-3xl font-bold text-black mb-2 text-center">
          Create Your Account
        </h1>
        <p className="text-sm sm:text-base text-gray-600 mb-6 sm:mb-8 text-center">
          Already have an account?{' '}
          <a href="/login" className="text-purple-500 font-semibold hover:underline">
            Login
          </a>
        </p>
        <div className="space-y-6">
          <UsernameClaim
            onSubmit={handleStepOne}
            buttonText="Create My Free Elevate Social"
            initialValue={formData.username}
            layout="col"
            variant="small"
          />
        </div>

        <p className="text-xs text-gray-500 mt-4 sm:mt-6 text-center leading-relaxed">
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
        {/* Success message */}
        <div className="bg-green-100 border border-green-200 rounded-lg p-3 mb-6 flex items-center gap-2">
          <span className="text-green-600">🎉</span>
          <span className="text-green-700 text-sm">{formData.username} is available</span>
        </div>

        <form onSubmit={stepTwoForm.handleSubmit(handleStepTwo)} className="space-y-6">

          <div className="space-y-4">
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">Email</label>
              <input
                {...stepTwoForm.register('email')}
                type="email"
                placeholder="Enter your email address"
                className="w-full px-3 h-11 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none text-sm"
              />
              {stepTwoForm.formState.errors.email && (
                <p className="text-red-500 text-sm">{stepTwoForm.formState.errors.email.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">Password</label>
              <div className="relative">
                <input
                  {...stepTwoForm.register('password')}
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Enter your password"
                  className="w-full px-3 h-11 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none text-sm"
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
              <p className="text-xs text-gray-500">Password should be 8+ characters.</p>
              {stepTwoForm.formState.errors.password && (
                <p className="text-red-500 text-sm">{stepTwoForm.formState.errors.password.message}</p>
              )}
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-purple-500 hover:bg-purple-600 disabled:bg-purple-300 text-white font-medium h-11 rounded-lg text-sm flex items-center justify-center"
          >
            {isLoading ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
            ) : (
              'Sign Up'
            )}
          </button>
        </form>

        <p className="text-xs text-gray-500 mt-4 sm:mt-6 text-center leading-relaxed">
          By signing up, you agree to our{' '}
          <a href="/terms" className="underline">Terms of Service</a> and{' '}
          <a href="/privacy" className="underline">Privacy Policy</a>.
          This site is protected by reCAPTCHA and the Google Terms of Service and Privacy Policy apply.
        </p>
      </div>
    )
  }

  // Step 3: Loading/Completion
  if (currentStep === 3) {
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
          Setting up your account...
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