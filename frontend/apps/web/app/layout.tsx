import { AuthProvider } from '@/providers/auth-provider'
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { twMerge } from 'tailwind-merge'
import { Toaster } from 'sonner'
import { ComingSoon } from '@/components/coming-soon'

import '@frontend/ui/styles/globals.css'

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-sans'
})


export const metadata: Metadata = {
  title: 'Elevate Social'
}


export default function RootLayout({
  children
}: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body
        className={twMerge(
          'bg-gray-50 text-sm text-gray-700 antialiased',
          inter.className
        )}
      >
        <AuthProvider>
          <div className="">
            <div className=""><ComingSoon /></div>
          </div>
          <Toaster
            position="top-right"
            closeButton
            duration={4000}
            theme="light"
            className="toaster group"
            toastOptions={{
              className: 'group toast group-[.toaster]:bg-white group-[.toaster]:text-gray-900 group-[.toaster]:border-gray-200 group-[.toaster]:shadow-lg',
              style: {
                borderRadius: '0.5rem',
                border: '1px solid #e5e7eb',
                boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
              }
            }}
          />
        </AuthProvider>
      </body>
    </html>
  )
}
