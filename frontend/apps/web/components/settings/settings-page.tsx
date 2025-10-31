'use client'

import type { UserCurrent } from '@frontend/types/api'
import { ProfileSection } from './profile-section'
import { PasswordSection } from './password-section'
import { DeleteAccountSection } from './delete-account-section'
import { StripeConnectSection } from './stripe-connect-section'
import { CanvaIntegrationSection } from './canva-integration-section'
import { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'

type ActiveTab = 'profile' | 'password' | 'payments' | 'canva' | 'danger'

function SettingsContent({
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
  const searchParams = useSearchParams()
  const tabParam = searchParams.get('tab') as ActiveTab | null
  const [activeTab, setActiveTab] = useState<ActiveTab>(tabParam || 'profile')

  // Update active tab if URL param changes
  useEffect(() => {
    if (tabParam && ['profile', 'password', 'payments', 'canva', 'danger'].includes(tabParam)) {
      setActiveTab(tabParam)
    }
  }, [tabParam])

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
              onClick={() => setActiveTab('payments')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${activeTab === 'payments'
                ? 'border-green-500 text-green-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
            >
              Payments
            </button>
            <button
              onClick={() => setActiveTab('canva')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${activeTab === 'canva'
                ? 'border-purple-500 text-purple-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
            >
              Canva
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

          {activeTab === 'payments' && (
            <div>
              <div className="mb-6">
                <h2 className="text-xl font-semibold text-brand-600">Payment Settings</h2>
                <p className="text-gray-600 mt-1">
                  Connect your Stripe account to receive payments from customers.
                </p>
              </div>
              <StripeConnectSection />
            </div>
          )}

          {activeTab === 'canva' && (
            <div>
              <div className="mb-6">
                <h2 className="text-xl font-semibold text-purple-600">Canva Integration</h2>
                <p className="text-gray-600 mt-1">
                  Connect your Canva account to create stunning designs directly from Elevate.
                </p>
              </div>
              <CanvaIntegrationSection />
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
  return (
    <Suspense fallback={
      <div className="container mx-auto p-6 max-w-4xl">
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold">Settings</h1>
            <p className="text-gray-600">Loading settings...</p>
          </div>
        </div>
      </div>
    }>
      <SettingsContent
        currentUser={currentUser}
        profileAction={profileAction}
        changePasswordAction={changePasswordAction}
        deleteAccountAction={deleteAccountAction}
      />
    </Suspense>
  )
}