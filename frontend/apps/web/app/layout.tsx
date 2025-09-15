import { AuthProvider } from '@/providers/auth-provider'
import type { Metadata } from 'next'
import { Poppins } from 'next/font/google'
import { twMerge } from 'tailwind-merge'
import { Toaster } from 'sonner'
import { ComingSoon } from '@/components/coming-soon'

import '@frontend/ui/styles/globals.css'

const poppins = Poppins({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-poppins'
})



export const metadata: Metadata = {
  title: 'Elevate Social',
  description: 'Elevate your social media presence with our comprehensive social media management platform.',
  icons: {
    icon: [
      { url: '/favicon.ico' },
      { url: '/icon.ico', type: 'image/x-icon' },
    ],
    shortcut: [{ url: '/favicon.ico' }],
    apple: [{ url: '/favicon.ico' }],
  },
}


export default function RootLayout({
  children
}: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/favicon.ico" sizes="any" />
      </head>
      <body
        className={twMerge(
          'bg-gray-50 text-sm text-gray-700 antialiased',
          poppins.className
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
