import Link from 'next/link'
import logo from "@/assets/logo.png"

export function Footer() {
  return (
    <footer className="w-full bg-[#0D0714] text-white py-8 sm:py-10 lg:py-12 px-4 sm:px-6 lg:px-20">
      <div>
        <div className="flex flex-col lg:flex-row mb-6 sm:mb-8 gap-8 sm:gap-12 lg:gap-24">
          <div className="flex-shrink-0">
            <div className="flex items-center gap-2 justify-center lg:justify-start">
              <img
                src={logo.src}
                alt="Elevate Social"
                className='h-10 sm:h-12'
              />
              <span className='font-bold text-base sm:text-lg'>
                elevate.social
              </span>
            </div>

            <h2 className="text-xl sm:text-2xl font-bold mb-3 sm:mb-4 mt-4 sm:mt-6 text-center lg:text-left">
              The future of content creation is here.
            </h2>

            <p className="text-white text-sm mb-4 sm:mb-6 text-center lg:text-left max-w-md mx-auto lg:mx-0">
              Discover how Elevate Social can streamline your content creation and
              marketing efforts in one powerful platform.
            </p>

            <div className="flex gap-3 justify-center lg:justify-start">
              <a href="#" className="text-white hover:text-gray-300">
                <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                </svg>
              </a>
              <a href="#" className="text-white hover:text-gray-300">
                <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                </svg>
              </a>
              <a href="#" className="text-white hover:text-gray-300">
                <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zM5.838 12a6.162 6.162 0 1112.324 0 6.162 6.162 0 01-12.324 0zM12 16a4 4 0 110-8 4 4 0 010 8zm4.965-10.405a1.44 1.44 0 112.881.001 1.44 1.44 0 01-2.881-.001z" />
                </svg>
              </a>
              <a href="#" className="text-white hover:text-gray-300">
                <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                </svg>
              </a>
              <a href="#" className="text-white hover:text-gray-300">
                <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
                </svg>
              </a>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row justify-center lg:justify-end gap-8 sm:gap-12 lg:gap-24 lg:ml-auto lg:mr-20">
            <div>
              <nav className="space-y-2 sm:space-y-3">
                <Link href="/" className="block text-white font-semibold hover:text-gray-300 text-sm sm:text-base">
                  Home Page
                </Link>
                <Link href="/about" className="block text-white font-semibold hover:text-gray-300 text-sm sm:text-base">
                  About Us
                </Link>
                <Link href="/contact" className="block text-white font-semibold hover:text-gray-300 text-sm sm:text-base">
                  Contact Us
                </Link>
                <Link href="/blog" className="block text-white font-semibold hover:text-gray-300 text-sm sm:text-base">
                  Blog Posts
                </Link>
                <Link href="/support" className="block text-white font-semibold hover:text-gray-300 text-sm sm:text-base">
                  Support Center
                </Link>
              </nav>
            </div>

            <div>
              <nav className="space-y-2 sm:space-y-3">
                <Link href="/help" className="block text-white font-semibold hover:text-gray-300 text-sm sm:text-base">
                  Help Center
                </Link>
                <Link href="/feedback" className="block text-white font-semibold hover:text-gray-300 text-sm sm:text-base">
                  Feedback Form
                </Link>
                <Link href="/community" className="block text-white font-semibold hover:text-gray-300 text-sm sm:text-base">
                  Community Forum
                </Link>
                <Link href="/resources" className="block text-white font-semibold hover:text-gray-300 text-sm sm:text-base">
                  Resource Hub
                </Link>
                <Link href="/guide" className="block text-white font-semibold hover:text-gray-300 text-sm sm:text-base">
                  User Guide
                </Link>
              </nav>
            </div>
          </div>
        </div>

        <div className="pt-6 sm:pt-8 flex flex-col sm:flex-row justify-between items-center gap-4 border-t border-gray-700">
          <p className="text-white text-xs sm:text-sm order-2 sm:order-1">
            © 2025 Elevate. All rights reserved.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 sm:gap-6 order-1 sm:order-2">
            <Link href="/privacy" className="text-white hover:text-gray-300 text-xs sm:text-sm underline text-center">
              Privacy Policy
            </Link>
            <Link href="/terms" className="text-white hover:text-gray-300 text-xs sm:text-sm underline text-center">
              Terms of Service
            </Link>
            <Link href="/cookies" className="text-white hover:text-gray-300 text-xs sm:text-sm underline text-center">
              Cookie Settings
            </Link>
          </div>
        </div>
      </div>
    </footer>
  )
}