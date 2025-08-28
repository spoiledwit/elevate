'use client'

import type { UserCurrent } from '@frontend/types/api'
import { ProfileSection } from './profile-section'
import { PasswordSection } from './password-section'
import { DeleteAccountSection } from './delete-account-section'
import { useState } from 'react'

type ActiveTab = 'profile' | 'password' | 'danger'

export function SettingsPage({
  currentUser,
  profileAction,
  changePasswordAction,
  deleteAccountAction
}: {
  currentUser: Promise<UserCurrent>
  profileAction: any
  changePasswordAction: any
  deleteAccountAction: any
}) {
  const [activeTab, setActiveTab] = useState<ActiveTab>('profile')

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Settings</h1>
          <p className="text-gray-600">
            Manage your account settings and preferences.
          </p>
        </div>

        {/* Tab Navigation */}
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('profile')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${activeTab === 'profile'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
            >
              Profile
            </button>
            <button
              onClick={() => setActiveTab('password')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${activeTab === 'password'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
            >
              Password
            </button>
            <button
              onClick={() => setActiveTab('danger')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${activeTab === 'danger'
                ? 'border-red-500 text-red-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
            >
              Danger Zone
            </button>
          </nav>
        </div>

        {/* Tab Content */}
        <div className="bg-white rounded-lg shadow p-6">
          {activeTab === 'profile' && (
            <div>
              <div className="mb-6">
                <h2 className="text-xl font-semibold text-gray-900">Profile Information</h2>
                <p className="text-gray-600 mt-1">
                  Update your account profile information.
                </p>
              </div>
              <ProfileSection
                currentUser={currentUser}
                onSubmitHandler={profileAction}
              />
            </div>
          )}

          {activeTab === 'password' && (
            <div>
              <div className="mb-6">
                <h2 className="text-xl font-semibold text-gray-900">Change Password</h2>
                <p className="text-gray-600 mt-1">
                  Update your account password to keep your account secure.
                </p>
              </div>
              <PasswordSection onSubmitHandler={changePasswordAction} />
            </div>
          )}

          {activeTab === 'danger' && (
            <div>
              <div className="mb-6">
                <h2 className="text-xl font-semibold text-red-600">Danger Zone</h2>
                <p className="text-gray-600 mt-1">
                  Permanently delete your account and all associated data.
                  This action cannot be undone.
                </p>
              </div>
              <DeleteAccountSection onSubmitHandler={deleteAccountAction} />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}