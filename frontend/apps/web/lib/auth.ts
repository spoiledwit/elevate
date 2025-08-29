import { ApiError } from '@frontend/types/api'
import type { AuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import GoogleProvider from 'next-auth/providers/google'
import { getApiClient } from './api'

function decodeToken(token: string): {
  token_type: string
  exp: number
  iat: number
  jti: string
  user_id: number
  username?: string
} {
  return JSON.parse(atob(token.split('.')[1]))
}

const authOptions: AuthOptions = {
  session: {
    strategy: 'jwt'
  },
  pages: {
    signIn: '/login'
  },
  callbacks: {
    async signIn({ user, account }) {
      if (account?.provider === 'google') {
        try {
          // Send Google token to Django backend for verification
          const response = await fetch(`${process.env.API_URL || 'http://localhost:8000'}/api/auth/google/`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              credential: account.id_token
            })
          })

          if (response.ok) {
            const data = await response.json()
            // Store JWT tokens in user object to pass to jwt callback
            user.access_token = data.access
            user.refresh_token = data.refresh
            user.backend_user = data.user
            return true
          } else {
            console.error('Google OAuth backend verification failed')
            return false
          }
        } catch (error) {
          console.error('Google OAuth error:', error)
          return false
        }
      }
      return true
    },
    session: async ({ session, token }) => {
      if (token.access && token.refresh) {
        const access = decodeToken(token.access)
        const refresh = decodeToken(token.refresh)

        if (Date.now() / 1000 > access.exp && Date.now() / 1000 > refresh.exp) {
          return Promise.reject({
            error: new Error('Refresh token expired')
          })
        }

        session.user = {
          id: access.user_id,
          username: access.username || token.username || token.backend_user?.username as string,
        }

        session.refreshToken = token.refresh
        session.accessToken = token.access
      }

      return session
    },
    jwt: async ({ token, user, account }) => {
      // Handle Google OAuth
      if (account?.provider === 'google' && user?.access_token) {
        token.access = user.access_token
        token.refresh = user.refresh_token
        token.backend_user = user.backend_user
        token.username = user.backend_user?.username || user.backend_user?.email
        return token
      }

      // Handle credentials login
      if (user?.username && user?.access) {
        return { ...token, ...user }
      }

      // Refresh token if needed
      if (token.access && Date.now() / 1000 > decodeToken(token.access).exp) {
        try {
          const apiClient = await getApiClient()
          const res = await apiClient.token.tokenRefreshCreate({
            access: token.access,
            refresh: token.refresh as string
          })
          token.access = res.access
        } catch (error) {
          console.error('Token refresh failed:', error)
          // Return token without access/refresh to force re-login
          return { ...token, access: undefined, refresh: undefined }
        }
      }

      return token
    }
  },
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        username: {
          label: 'Email',
          type: 'text'
        },
        password: { label: 'Password', type: 'password' }
      },
      async authorize(credentials) {
        if (credentials === undefined) {
          return null
        }

        try {
          const apiClient = await getApiClient()
          const res = await apiClient.token.tokenCreate({
            username: credentials.username,
            password: credentials.password,
            access: '',
            refresh: ''
          })

          return {
            id: decodeToken(res.access).user_id,
            username: credentials.username,
            access: res.access,
            refresh: res.refresh
          }
        } catch (error) {
          if (error instanceof ApiError) {
            return null
          }
        }

        return null
      }
    }),
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    })
  ]
}

export { authOptions }
