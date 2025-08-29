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
    <div className="h-screen flex flex-col overflow-hidden">
      {/* Top left logo */}
      <div className="absolute top-6 left-6 z-10">
        <a href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
          <img src={logo.src} alt="Elevate Social" className="h-8" />
          <span className="font-semibold text-gray-700">elevate.social</span>
        </a>
      </div>

      <div className="flex-1 flex w-full justify-between items-center">
        {/* Left side - Form */}
        <div className='flex-1 p-8 flex items-center justify-center'>
          <Suspense fallback={
            <div className="w-full max-w-md animate-pulse">
              <div className="h-8 bg-gray-200 rounded w-48 mb-2"></div>
              <div className="h-5 bg-gray-200 rounded w-64 mb-8"></div>
              <div className="space-y-4">
                <div className="h-11 bg-gray-200 rounded"></div>
                <div className="h-11 bg-gray-200 rounded"></div>
                <div className="h-11 bg-purple-200 rounded"></div>
              </div>
            </div>
          }>
            <MultiStepRegisterForm onSubmitHandler={registerAction} />
          </Suspense>
        </div>

        {/* Right side - Image */}
        <div className="hidden max-h-screen lg:flex items-center justify-center">
          <img
            src={registerImage.src}
            alt="Dashboard preview"
            className='h-screen'
          />
        </div>
      </div>
    </div>
  )
}
