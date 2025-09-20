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
    const { register, handleSubmit, formState } = useForm<ForgotSchema>({ resolver: zodResolver(forgotPasswordSchema) })

    const onSubmit = handleSubmit(async (data) => {
        const res = await forgotPasswordAction({ username: data.username })
        setSuccess(!!res)
    })

    if (success) {
        return (
            <div className="w-full max-w-md">
                <h1 className="text-2xl font-bold mb-2">Check your inbox</h1>
                <p className="text-gray-600">If an account with that username exists, we sent password reset instructions.</p>
            </div>
        )
    }

    return (
        <div className="w-full max-w-md">
            <h1 className="text-3xl font-bold text-black mb-2">Forgot password</h1>
            <p className="text-gray-600 mb-8">Enter your username and we'll send instructions to reset your password.</p>

            <form onSubmit={onSubmit} className="space-y-6">
                <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">Username</label>
                    <input
                        {...register('username')}
                        type="text"
                        placeholder="yourusername"
                        className="w-full px-3 h-11 border border-gray-300 rounded-lg focus:ring-2 focus:border-transparent outline-none text-sm"
                        onFocus={(e) => e.target.style.boxShadow = `0 0 0 2px #714efe66`}
                        onBlur={(e) => e.target.style.boxShadow = ''}
                    />
                    {formState.errors.username && (
                        <p className="text-red-500 text-sm">{formState.errors.username.message}</p>
                    )}
                </div>

                <button type="submit" className="w-full text-white font-medium h-11 rounded-lg text-sm transition-colors" style={{backgroundColor: '#714efe'}} onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#5f3fd6'} onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#714efe'}>Send reset link</button>
            </form>
        </div>
    )
}
