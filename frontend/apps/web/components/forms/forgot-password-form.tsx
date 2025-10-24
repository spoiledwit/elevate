'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import type { z } from 'zod'
import { forgotPasswordSchema } from '@/lib/validation'
import { zodResolver } from '@hookform/resolvers/zod'
import { forgotPasswordAction } from '@/actions/forgot-password-action'

type ForgotSchema = z.infer<typeof forgotPasswordSchema>

export function ForgotPasswordForm() {
    const [success, setSuccess] = useState(false)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const { register, handleSubmit, formState } = useForm<ForgotSchema>({ resolver: zodResolver(forgotPasswordSchema) })

    const onSubmit = handleSubmit(async (data) => {
        setIsSubmitting(true)
        try {
            const res = await forgotPasswordAction({ username: data.username })
            setSuccess(!!res)
        } finally {
            setIsSubmitting(false)
        }
    })

    if (success) {
        return (
            <div className="w-full max-w-md">
                <h1 className="text-2xl font-bold mb-2">Check your inbox</h1>
                <p className="text-gray-600">If an account with that username or email exists, we sent password reset instructions.</p>
            </div>
        )
    }

    return (
        <div className="w-full max-w-md">
            <h1 className="text-3xl font-bold text-black mb-2">Forgot password</h1>
            <p className="text-gray-600 mb-8">Enter your username or email and we'll send instructions to reset your password.</p>

            <form onSubmit={onSubmit} className="space-y-6">
                <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">Username or Email</label>
                    <input
                        {...register('username')}
                        type="text"
                        placeholder="username or email"
                        className="w-full px-3 h-11 border border-gray-300 rounded-lg focus:ring-2 focus:border-transparent outline-none text-sm"
                        onFocus={(e) => e.target.style.boxShadow = `0 0 0 2px #bea45666`}
                        onBlur={(e) => e.target.style.boxShadow = ''}
                    />
                    {formState.errors.username && (
                        <p className="text-red-500 text-sm">{formState.errors.username.message}</p>
                    )}
                </div>

                <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full text-white font-medium h-11 rounded-lg text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    style={{ backgroundColor: '#bea456' }}
                    onMouseEnter={(e) => !isSubmitting && (e.currentTarget.style.backgroundColor = '#af9442ff')}
                    onMouseLeave={(e) => !isSubmitting && (e.currentTarget.style.backgroundColor = '#bea456')}
                >
                    {isSubmitting ? 'Sending...' : 'Send reset link'}
                </button>
            </form>
        </div>
    )
}
