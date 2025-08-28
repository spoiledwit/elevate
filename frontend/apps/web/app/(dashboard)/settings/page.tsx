import { changePasswordAction } from '@/actions/change-password-action'
import { deleteAccountAction } from '@/actions/delete-account-action'
import { profileAction } from '@/actions/profile-action'
import { SettingsPage } from '@/components/settings/settings-page'
import { getApiClient } from '@/lib/api'
import { authOptions } from '@/lib/auth'
import type { Metadata } from 'next'
import { getServerSession } from 'next-auth'

export const metadata: Metadata = {
  title: 'Settings - Turbo'
}

export default async function Settings() {
  const session = await getServerSession(authOptions)
  const apiClient = await getApiClient(session)

  return (
    <SettingsPage
      currentUser={apiClient.users.usersMeRetrieve()}
      profileAction={profileAction}
      changePasswordAction={changePasswordAction}
      deleteAccountAction={deleteAccountAction}
    />
  )
}