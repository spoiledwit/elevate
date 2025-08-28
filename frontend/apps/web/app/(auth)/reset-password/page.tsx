import logo from '@/assets/logo.png'
import forgotImage from '@/assets/auth/register.png'
import type { Metadata } from 'next'
import { Suspense } from 'react'
import { ResetPasswordForm } from '@/components/forms/reset-password-form'

export const metadata: Metadata = {
    title: 'Reset password - Elevate Social'
}

export default function ResetPassword() {
    return (
        <div className="h-screen flex flex-col overflow-hidden">
            <div className="absolute top-6 left-6 z-10">
                <a href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
                    <img src={logo.src} alt="Elevate Social" className="h-8" />
                    <span className="font-semibold text-gray-700">elevate.social</span>
                </a>
            </div>

            <div className="flex-1 flex w-full justify-between items-center">
                <div className='flex-1 p-8 flex items-center justify-center'>
                    <Suspense fallback={<div>Loading...</div>}>
                        <ResetPasswordForm />
                    </Suspense>
                </div>

                <div className="hidden max-h-screen lg:flex items-center justify-center">
                    <img
                        src={forgotImage.src}
                        alt="Dashboard preview"
                        className='h-screen'
                    />
                </div>
            </div>
        </div>
    )
}
