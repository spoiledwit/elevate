'use client'

import type {
  RegisterFormSchema,
  registerAction
} from '@/actions/register-action'
import { fieldApiError } from '@/lib/forms'
import { registerFormSchema } from '@/lib/validation'
import { FormFooter } from '@frontend/ui/forms/form-footer'
import { FormHeader } from '@frontend/ui/forms/form-header'
import { SubmitField } from '@frontend/ui/forms/submit-field'
import { TextField } from '@frontend/ui/forms/text-field'
import { zodResolver } from '@hookform/resolvers/zod'
import { signIn } from 'next-auth/react'
import { useForm } from 'react-hook-form'
import { GoogleSignInButton } from './google-signin-button'

export function RegisterForm({
  onSubmitHandler
}: { onSubmitHandler: typeof registerAction }) {
  const { formState, handleSubmit, register, setError } =
    useForm<RegisterFormSchema>({
      resolver: zodResolver(registerFormSchema)
    })

  return (
    <>
      <FormHeader
        title="Create new account in Turbo"
        description="Get an access to internal application"
      />

      <form
        method="post"
        onSubmit={handleSubmit(async (data) => {
          const res = await onSubmitHandler(data)

          if (res === true) {
            signIn()
          } else if (typeof res === 'object' && res !== null && 'success' in res && res.success) {
            // Handle success case with client sign-in
            signIn()
          } else if (typeof res === 'object' && res !== null && !('success' in res)) {
            // Handle API error response
            fieldApiError('username', 'username', res, setError)
            fieldApiError('password', 'password', res, setError)
            fieldApiError('password_retype', 'passwordRetype', res, setError)
          }
        })}
      >
        <TextField
          type="text"
          register={register('username')}
          formState={formState}
          label="Username"
          placeholder="Unique username or email"
        />

        <TextField
          type="password"
          register={register('password')}
          formState={formState}
          label="Password"
          placeholder="Your new password"
        />

        <TextField
          type="password"
          register={register('passwordRetype')}
          formState={formState}
          label="Retype password"
          placeholder="Verify password"
        />

        <SubmitField>Sign up</SubmitField>
      </form>

      {/* Divider */}
      <div className="relative my-6">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-gray-300" />
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="bg-white px-2 text-gray-500">Or continue with</span>
        </div>
      </div>

      {/* Google Sign-In Button */}
      <GoogleSignInButton callbackUrl="/dashboard" />

      <FormFooter
        cta="Already have an account?"
        link="/login"
        title="Sign in"
      />
    </>
  )
}
