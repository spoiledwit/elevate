'use client'

import Link from 'next/link'
import { useSession } from 'next-auth/react'
import { useState } from 'react'
import lgoblack from "@/assets/logo.png"

export function Navbar() {
  const { data: session, status } = useSession()
  const isLoading = status === 'loading'
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  return (
    <nav className="fixed top-0 left-0 right-0 w-full px-4 sm:px-6 lg:px-20 py-4 lg:py-6 bg-white z-50" style={{ boxShadow: '0 2px 8px 0 rgba(0,0,0,0.08)' }}>
      <div className="flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
          <img
            src={lgoblack.src}
            alt="Elevate Social"
            className='h-8 sm:h-10 lg:h-12'
          />
          <span className='font-bold text-base sm:text-lg'>
            elevate.social
          </span>
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden lg:flex items-center gap-8 text-[16px]">
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

        {/* Desktop Auth Buttons */}
        <div className="hidden lg:flex items-center gap-4 text-[16px]">
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

        {/* Mobile Menu Button */}
        <button
          className="lg:hidden flex items-center justify-center w-8 h-8 text-gray-700"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          aria-label="Toggle mobile menu"
        >
          {isMobileMenuOpen ? (
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          ) : (
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          )}
        </button>
      </div>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="lg:hidden mt-4 pb-4 border-t border-gray-200">
          <div className="flex flex-col space-y-4 pt-4">
            <Link 
              href="/about" 
              className="text-gray-700 hover:text-gray-900 py-2"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              Our Story
            </Link>
            <Link 
              href="/product" 
              className="text-gray-700 hover:text-gray-900 py-2"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              Product
            </Link>
            <Link 
              href="/pricing" 
              className="text-gray-700 hover:text-gray-900 py-2"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              Pricing
            </Link>
            <Link 
              href="/blog" 
              className="text-gray-700 hover:text-gray-900 py-2"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              Blog
            </Link>
            
            <div className="pt-4 border-t border-gray-200 space-y-3">
              {isLoading ? (
                <div className="w-full h-10 bg-gray-100 animate-pulse rounded-lg"></div>
              ) : session ? (
                <Link
                  href="/dashboard"
                  className="block bg-purple-600 font-semibold text-white px-6 py-2.5 rounded-lg text-center hover:bg-purple-700 transition-colors"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Dashboard
                </Link>
              ) : (
                <>
                  <Link 
                    href="/login" 
                    className="block text-gray-700 hover:text-gray-900 py-2"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    Login
                  </Link>
                  <Link
                    href="/get-started"
                    className="block bg-purple-600 font-semibold text-white px-6 py-2.5 rounded-lg text-center hover:bg-purple-700 transition-colors"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    Get Started
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </nav>
  )
}