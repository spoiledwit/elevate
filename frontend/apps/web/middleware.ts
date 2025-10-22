import { withAuth } from 'next-auth/middleware'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export default withAuth(
  async function middleware(req) {
    const { pathname } = req.nextUrl
    const token = req.nextauth.token

    // Only check for protected routes
    if (pathname.startsWith('/dashboard') || pathname.startsWith('/api/') && !pathname.startsWith('/api/auth')) {
      if (!token) {
        // No session, redirect to login
        const url = new URL('/login', req.url)
        return NextResponse.redirect(url)
      }

      // Check for OAuth users needing registration
      if (token.access === 'REQUIRES_REGISTRATION') {
        const url = new URL('/get-started', req.url)
        url.searchParams.set('oauth', 'true')
        return NextResponse.redirect(url)
      }

      // For regular users with valid tokens, verify they exist in database
      if (token.access && token.access !== 'REQUIRES_REGISTRATION') {
        try {
          const verifyResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/auth/verify-user/`, {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${token.access}`,
              'Content-Type': 'application/json',
            },
          })

          if (verifyResponse.status === 404) {
            // User doesn't exist in database - redirect to registration
            const url = new URL('/get-started', req.url)
            url.searchParams.set('oauth', 'true')
            return NextResponse.redirect(url)
          }

          if (!verifyResponse.ok) {
            // Other error - redirect to login
            const url = new URL('/login', req.url)
            url.searchParams.set('error', 'verification_failed')
            return NextResponse.redirect(url)
          }
        } catch (error) {
          console.error('Middleware user verification error:', error)
          // On error, allow through (fail open to avoid blocking legitimate users)
        }
      }
    }

    return NextResponse.next()
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        const { pathname } = req.nextUrl
        
        // Allow access to auth pages without token
        if (pathname.startsWith('/login') || pathname.startsWith('/get-started') || pathname.startsWith('/api/auth')) {
          return true
        }
        
        // For protected routes, require token
        if (pathname.startsWith('/dashboard') || (pathname.startsWith('/api/') && !pathname.startsWith('/api/auth'))) {
          return !!token
        }
        
        // Allow all other routes
        return true
      },
    },
  }
)

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api/auth (NextAuth routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!api/auth|_next/static|_next/image|favicon.ico|public/).*)',
  ],
}