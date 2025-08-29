'use server'

import { getApiClient } from '@/lib/api'

export interface CompleteGoogleRegistrationData {
  username: string
  google_token: string
  google_data: {
    email: string
    name: string
    given_name: string
    family_name: string
    picture?: string
  }
}

export async function completeGoogleRegistration(data: CompleteGoogleRegistrationData) {
  try {
    const apiClient = await getApiClient()
    
    const response = await fetch(`${process.env.API_URL || 'http://localhost:8000'}/api/auth/google/complete-registration/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        username: data.username,
        google_token: data.google_token,
        google_data: data.google_data
      })
    })

    const result = await response.json()

    if (response.ok) {
      return {
        success: true,
        data: result
      }
    } else {
      return {
        success: false,
        error: result.error || 'Registration failed'
      }
    }
  } catch (error) {
    console.error('Complete Google registration error:', error)
    return {
      success: false,
      error: 'Registration failed. Please try again.'
    }
  }
}