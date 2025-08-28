import { registerAction } from '@/actions/register-action'
import { MultiStepRegisterForm } from '@/components/forms/multi-step-register-form'
import registerImage from '@/assets/auth/register.png'
import logo from "@/assets/logo.png"
import type { Metadata } from 'next'
import { Suspense } from 'react'

export const metadata: Metadata = {
  title: 'Get Started - Elevate Social'
}

export default function GetStarted() {
  return (
    <div className="min-h-screen flex flex-col lg:h-screen lg:overflow-hidden bg-white">
      {/* Top left logo */}
      <div className="absolute top-4 left-4 sm:top-6 sm:left-6 z-10">
        <a href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
          <img src={logo.src} alt="Elevate Social" className="h-6 sm:h-8" />
          <span className="font-semibold text-gray-700 text-sm sm:text-base">elevate.social</span>
        </a>
      </div>

      <div className="flex-1 flex flex-col lg:flex-row w-full">
        {/* Left side - Form */}
        <div className='flex-1 p-4 sm:p-6 lg:p-8 flex items-center justify-center min-h-screen lg:min-h-0'>
          <div className="w-full max-w-md pt-12 sm:pt-16 lg:pt-0">
            <Suspense fallback={<div className="text-center">Loading...</div>}>
              <MultiStepRegisterForm onSubmitHandler={registerAction} />
            </Suspense>
          </div>
        </div>

        {/* Right side - Image */}
        <div className="hidden lg:flex lg:flex-1 items-center justify-center max-h-screen">
          <img
            src={registerImage.src}
            alt="Dashboard preview"
            className='h-full w-full object-cover max-h-screen'
          />
        </div>
      </div>
    </div>
  )
}
