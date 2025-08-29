import 'next-auth'

declare module 'next-auth' {
  interface User {
    id: number
    username: string
    access?: string
    refresh?: string
    access_token?: string
    refresh_token?: string
    backend_user?: {
      id: number
      username: string
      email: string
      first_name: string
      last_name: string
    }
  }

  interface Session {
    refreshToken: string
    accessToken: string
    user: User
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    username?: string
    access?: string
    refresh?: string
    backend_user?: {
      id: number
      username: string
      email: string
      first_name: string
      last_name: string
    }
  }
}
