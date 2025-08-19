'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useSearchParams, useRouter } from 'next/navigation'
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

  const handleStepTwo = (data: StepTwoData) => {
    setFormData(prev => ({ ...prev, email: data.email, password: data.password }))
    setCurrentStep(3)
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

      if (result === true) {
        setIsLoading(false)
        router.push('/login')
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
    <div className="flex items-center justify-center mb-8">
      <div className="flex items-center gap-4">
        {[1, 2, 3].map((step) => (
          <div key={step} className="flex items-center">
            <button
              onClick={() => goToStep(step)}
              disabled={step >= currentStep}
              className={`flex items-center justify-center w-10 h-8 rounded-full font-semibold  ${currentStep >= step
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
            {step < 3 && (
              <div className={`w-24 h-1 rounded-full  ${currentStep > step ? 'bg-purple-500' : 'bg-gray-200'
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
        <div className="space-y-6">
          <UsernameClaim
            onSubmit={handleStepOne}
            buttonText="Create My Free Elevate Social"
            initialValue={formData.username}
            layout="col"
            variant="small"
          />
        </div>

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
        {/* Success message */}
        <div className="bg-green-100 border border-green-200 rounded-lg p-3 mb-6 flex items-center gap-2">
          <span className="text-green-600">🎉</span>
          <span className="text-green-700 text-sm">{formData.username} is available</span>
        </div>

        <form onSubmit={stepTwoForm.handleSubmit(handleStepTwo)} className="space-y-6">
          <div className="text-center mb-6">
            <button className="w-full flex items-center justify-center gap-3 bg-white border border-gray-300 rounded-lg h-11 px-4 hover:bg-gray-50 text-sm font-medium">
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
                className="w-full px-3 h-11 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none text-sm"
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
                className="w-full px-3 h-11 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none text-sm"
              />
              <p className="text-xs text-gray-500">Password should be 8+ characters.</p>
              {stepTwoForm.formState.errors.password && (
                <p className="text-red-500 text-sm">{stepTwoForm.formState.errors.password.message}</p>
              )}
            </div>
          </div>

          <button
            type="submit"
            className="w-full bg-purple-500 hover:bg-purple-600 text-white font-medium h-11 rounded-lg text-sm"
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
    // Check if at least one social link is filled
    const formValues = stepThreeForm.watch()
    const hasAtLeastOneLink = Object.values(formValues).some(value => value && value.trim() !== '')

    const socialPlatforms = [
      {
        name: 'instagram',
        label: 'Instagram',
        placeholder: 'https://instagram.com/username',
        icon: <svg className="w-4 h-4 text-gray-400" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" /></svg>
      },
      {
        name: 'facebook',
        label: 'Facebook',
        placeholder: 'https://facebook.com/username',
        icon: <svg className="w-4 h-4 text-gray-400" fill="currentColor" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" /></svg>
      },
      {
        name: 'tiktok',
        label: 'TikTok',
        placeholder: 'https://tiktok.com/@username',
        icon: <svg className="w-4 h-4 text-gray-400" fill="currentColor" viewBox="0 0 24 24"><path d="M19.321 5.562a5.124 5.124 0 0 1-.443-.258 6.228 6.228 0 0 1-1.137-.966c-.849-.995-1.189-2.183-1.123-3.538H13.54v11.19c-.061 1.564-1.336 2.813-2.944 2.813-1.608 0-2.914-1.312-2.914-2.914 0-1.602 1.306-2.914 2.914-2.914.302 0 .594.046.87.134V6.57a6.468 6.468 0 0 0-.87-.06c-3.603 0-6.525 2.921-6.525 6.525 0 3.603 2.922 6.525 6.525 6.525s6.525-2.922 6.525-6.525V8.757a9.069 9.069 0 0 0 5.303 1.696v-3.611a5.264 5.264 0 0 1-2.103-.28z" /></svg>
      },
      {
        name: 'pinterest',
        label: 'Pinterest',
        placeholder: 'https://pinterest.com/username',
        icon: <svg className="w-4 h-4 text-gray-400" fill="currentColor" viewBox="0 0 24 24"><path d="M12.017 0C5.396 0 .029 5.367.029 11.987c0 5.079 3.158 9.417 7.618 11.174-.105-.949-.199-2.403.041-3.439.219-.937 1.406-5.957 1.406-5.957s-.359-.72-.359-1.781c0-1.663.967-2.911 2.168-2.911 1.024 0 1.518.769 1.518 1.688 0 1.029-.653 2.567-.992 3.992-.285 1.193.6 2.165 1.775 2.165 2.128 0 3.768-2.245 3.768-5.487 0-2.861-2.063-4.869-5.008-4.869-3.41 0-5.409 2.562-5.409 5.199 0 1.033.394 2.143.889 2.741.099.12.112.225.085.345-.09.375-.293 1.199-.334 1.363-.053.225-.172.271-.402.161-1.499-.698-2.436-2.888-2.436-4.649 0-3.785 2.75-7.262 7.929-7.262 4.163 0 7.398 2.967 7.398 6.931 0 4.136-2.607 7.464-6.227 7.464-1.216 0-2.357-.631-2.75-1.378l-.748 2.853c-.271 1.043-1.002 2.35-1.492 3.146C9.57 23.812 10.763 24.009 12.017 24c6.624 0 11.99-5.367 11.99-11.013C24.007 5.367 18.641.001 12.017.001z" /></svg>
      },
      {
        name: 'youtube',
        label: 'YouTube',
        placeholder: 'https://youtube.com/@username',
        icon: <svg className="w-4 h-4 text-gray-400" fill="currentColor" viewBox="0 0 24 24"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" /></svg>
      },
      {
        name: 'linkedin',
        label: 'LinkedIn',
        placeholder: 'https://linkedin.com/in/username',
        icon: <svg className="w-4 h-4 text-gray-400" fill="currentColor" viewBox="0 0 24 24"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" /></svg>
      }
    ]

    return (
      <div className="w-full max-w-md">
        {renderStepIndicator()}

        <div className="mb-4 px-2">
          <h2 className="text-xl font-bold text-black mb-1">
            Connect Your Socials
          </h2>
          <p className="text-sm text-gray-600">
            Add your social profiles to display on your page (optional)
          </p>
        </div>

        <form onSubmit={stepThreeForm.handleSubmit(handleStepThree)} className="space-y-4">
          <div className="space-y-3 px-2 max-h-60 overflow-y-auto pr-2">
            {socialPlatforms.map((platform) => (
              <div key={platform.name} className="space-y-1">
                <label className="block text-sm font-medium text-gray-700">
                  {platform.label}
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    {platform.icon}
                  </div>
                  <input
                    {...stepThreeForm.register(platform.name as keyof StepThreeData)}
                    type="url"
                    placeholder={platform.placeholder}
                    className="w-full pl-10 pr-3 h-11 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none text-sm"
                  />
                </div>
              </div>
            ))}
          </div>

          <div className="pt-4">
            <button
              type="submit"
              disabled={!hasAtLeastOneLink}
              className={`w-full font-medium h-11 rounded-lg text-sm transition-all ${hasAtLeastOneLink
                ? 'bg-purple-500 hover:bg-purple-600 text-white cursor-pointer'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}
            >
              Complete Setup
            </button>
            <p className="text-xs text-gray-500 text-center mt-2">
              {hasAtLeastOneLink
                ? 'You can always add more platforms later'
                : 'Add at least one social profile to continue'
              }
            </p>
          </div>
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