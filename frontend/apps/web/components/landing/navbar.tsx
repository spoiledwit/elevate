'use client'

import Link from 'next/link'
import { useSession } from 'next-auth/react'
import lgoblack from "@/assets/logo.png"

export function Navbar() {
  const { data: session, status } = useSession()
  const isLoading = status === 'loading'

  return (
    <nav className="fixed top-0 left-0 right-0 w-full px-20 py-6 flex items-center justify-between bg-white z-50" style={{ boxShadow: '0 2px 8px 0 rgba(0,0,0,0.08)' }}>
      <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
        <img
          src={lgoblack.src}
          alt="Elevate Social"
          className='h-12'
        />
        <span
          className='font-bold text-lg'
        >
          elevate.social
        </span>
      </Link>

      <div className="flex items-center gap-8 text-[16px]">
        <Link href="/about" className="text-gray-700 hover:text-gray-900">
          Our Story
        </Link>
        <Link href="/product" className="text-gray-700 hover:text-gray-900">
          Product
        </Link>
        <Link href="/pricing" className="text-gray-700 hover:text-gray-900">
          Pricing
        </Link>
        <Link href="/blog" className="text-gray-700 hover:text-gray-900">
          Blog
        </Link>
      </div>

      <div className="flex items-center gap-4 text-[16px]">
        {isLoading ? (
          <div className="w-32 h-10 bg-gray-100 animate-pulse rounded-lg"></div>
        ) : session ? (
          <Link
            href="/dashboard"
            className="bg-purple-600 font-semibold text-white px-6 py-2.5 rounded-lg hover:scale-105 transition-all"
          >
            Dashboard
          </Link>
        ) : (
          <>
            <Link href="/login" className="text-gray-700 hover:text-gray-900">
              Login
            </Link>
            <Link
              href="/get-started"
              className="bg-purple-600 font-semibold text-white px-6 py-2.5 rounded-lg hover:scale-105 transition-all"
            >
              Get Started
            </Link>
          </>
        )}
      </div>
    </nav>
  )
}