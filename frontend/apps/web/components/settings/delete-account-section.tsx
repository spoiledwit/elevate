'use client'

import type {
  DeleteAccountFormSchema,
  deleteAccountAction
} from '@/actions/delete-account-action'
import { deleteAccountFormSchema } from '@/lib/validation'
import { SubmitField } from '@frontend/ui/forms/submit-field'
import { TextField } from '@frontend/ui/forms/text-field'
import { AlertTriangle } from 'lucide-react'
import { zodResolver } from '@hookform/resolvers/zod'
import { signOut, useSession } from 'next-auth/react'
import { useEffect } from 'react'
import { useForm } from 'react-hook-form'

export function DeleteAccountSection({
  onSubmitHandler
}: { onSubmitHandler: typeof deleteAccountAction }) {
  const session = useSession()

  const { formState, handleSubmit, register, reset, setValue } =
    useForm<DeleteAccountFormSchema>({
      resolver: zodResolver(deleteAccountFormSchema)
    })

  useEffect(() => {
    if (session.data?.user.username) {
      setValue('usernameCurrent', session.data?.user.username)
    }
  }, [setValue, session.data?.user.username])

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
        <AlertTriangle className="h-5 w-5 text-destructive" />
        <div className="text-sm">
          <p className="font-medium text-destructive">Warning: This action is irreversible!</p>
          <p className="text-muted-foreground">
            Once you delete your account, all your data will be permanently removed and cannot be recovered.
          </p>
        </div>
      </div>

      <form
        method="post"
        onSubmit={handleSubmit(async (data) => {
          const res = await onSubmitHandler(data)

          if (res) {
            reset()
            signOut()
          }
        })}
      >
        <div className="space-y-4">
          <TextField
            type="text"
            register={register('username')}
            label={`Type "${session.data?.user.username}" to confirm deletion`}
            formState={formState}
            placeholder={session.data?.user.username}
          />

          <SubmitField 
            isLoading={formState.isLoading}
            className="bg-destructive hover:bg-destructive/90 text-destructive-foreground"
          >
            Delete account permanently
          </SubmitField>
        </div>
      </form>
    </div>
  )
}