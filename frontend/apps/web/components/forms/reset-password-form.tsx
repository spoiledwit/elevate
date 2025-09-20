'use client'

import { useForm } from 'react-hook-form'
import { useSearchParams } from 'next/navigation'
import { useState, useEffect } from 'react'
import type { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { resetPasswordSchema } from '@/lib/validation'
import { resetPasswordAction } from '@/actions/reset-password-action'

type ResetSchema = z.infer<typeof resetPasswordSchema>

export function ResetPasswordForm() {
    const search = useSearchParams()
    const uid = search.get('uid') || ''
    const token = search.get('token') || ''
    const [success, setSuccess] = useState(false)

    const { register, handleSubmit, formState, setValue } = useForm<ResetSchema>({ resolver: zodResolver(resetPasswordSchema) })

    useEffect(() => {
        if (uid) setValue('uid', uid)
        if (token) setValue('token', token)
    }, [uid, token, setValue])

    const onSubmit = handleSubmit(async (data) => {
        const res = await resetPasswordAction({ uid: data.uid, token: data.token, password: data.password, password_retype: data.passwordRetype })
        setSuccess(!!res)
    })

    if (success) {
        return (
            <div className="w-full max-w-md">
                <h1 className="text-2xl font-bold mb-2">Password reset</h1>
                <p className="text-gray-600">Your password has been reset. You can now sign in with your new password.</p>
            </div>
        )
    }

    return (
        <div className="w-full max-w-md">
            <h1 className="text-3xl font-bold text-black mb-2">Reset password</h1>
            <p className="text-gray-600 mb-8">Set a new password for your account.</p>

            <form onSubmit={onSubmit} className="space-y-6">
                <input type="hidden" {...register('uid')} />
                <input type="hidden" {...register('token')} />

                <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">New password</label>
                    <input
                        {...register('password')}
                        type="password"
                        placeholder="Enter new password"
                        className="w-full px-3 h-11 border border-gray-300 rounded-lg focus:ring-2 focus:border-transparent outline-none text-sm"
                        onFocus={(e) => e.target.style.boxShadow = `0 0 0 2px #714efe66`}
                        onBlur={(e) => e.target.style.boxShadow = ''}
                    />
                    {formState.errors.password && (
                        <p className="text-red-500 text-sm">{formState.errors.password.message}</p>
                    )}
                </div>

                <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">Confirm password</label>
                    <input
                        {...register('passwordRetype')}
                        type="password"
                        placeholder="Confirm new password"
                        className="w-full px-3 h-11 border border-gray-300 rounded-lg focus:ring-2 focus:border-transparent outline-none text-sm"
                        onFocus={(e) => e.target.style.boxShadow = `0 0 0 2px #714efe66`}
                        onBlur={(e) => e.target.style.boxShadow = ''}
                    />
                    {formState.errors.passwordRetype && (
                        <p className="text-red-500 text-sm">{formState.errors.passwordRetype.message}</p>
                    )}
                </div>

                <button type="submit" className="w-full text-white font-medium h-11 rounded-lg text-sm transition-colors" style={{backgroundColor: '#714efe'}} onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#5f3fd6'} onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#714efe'}>Reset password</button>
            </form>
        </div>
    )
}
