import Link from 'next/link'
import logo from "@/assets/logo.png"

export function Footer() {
  return (
    <footer className="w-full bg-[#0D0714] text-white py-12 px-20">
      <div>
        <div className="flex mb-8 gap-24">
          <div className="flex-shrink-0">
            <div className="flex items-center gap-2">
              <img
                src={logo.src}
                alt="Elevate Social"
                className='h-12'
              />
              <span
                className='font-bold text-lg'
              >
                elevate.social
              </span>
            </div>

            <h2 className="text-2xl font-bold mb-4 whitespace-nowrap mt-6">
              The future of content creation is here.
            </h2>

            <p className="text-white text-sm mb-6">
              Discover how Elevate Social can streamline your content creation <br /> and
              marketing efforts in one powerful platform.
            </p>

            <div className="flex gap-3">
              <a href="#" className="text-white hover:text-gray-300">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                </svg>
              </a>
              <a href="#" className="text-white hover:text-gray-300">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                </svg>
              </a>
              <a href="#" className="text-white hover:text-gray-300">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zM5.838 12a6.162 6.162 0 1112.324 0 6.162 6.162 0 01-12.324 0zM12 16a4 4 0 110-8 4 4 0 010 8zm4.965-10.405a1.44 1.44 0 112.881.001 1.44 1.44 0 01-2.881-.001z" />
                </svg>
              </a>
              <a href="#" className="text-white hover:text-gray-300">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                </svg>
              </a>
              <a href="#" className="text-white hover:text-gray-300">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
                </svg>
              </a>
            </div>
          </div>

          <div className="flex gap-24 ml-auto mr-20">
            <div>
              <nav className="space-y-3">
                <Link href="/" className="block text-white font-semibold hover:text-gray-300">
                  Home Page
                </Link>
                <Link href="/about" className="block text-white font-semibold hover:text-gray-300">
                  About Us
                </Link>
                <Link href="/contact" className="block text-white font-semibold hover:text-gray-300">
                  Contact Us
                </Link>
                <Link href="/blog" className="block text-white font-semibold hover:text-gray-300">
                  Blog Posts
                </Link>
                <Link href="/support" className="block text-white font-semibold hover:text-gray-300">
                  Support Center
                </Link>
              </nav>
            </div>

            <div>
              <nav className="space-y-3">
                <Link href="/help" className="block text-white font-semibold hover:text-gray-300">
                  Help Center
                </Link>
                <Link href="/feedback" className="block text-white font-semibold hover:text-gray-300">
                  Feedback Form
                </Link>
                <Link href="/community" className="block text-white font-semibold hover:text-gray-300">
                  Community Forum
                </Link>
                <Link href="/resources" className="block text-white font-semibold hover:text-gray-300">
                  Resource Hub
                </Link>
                <Link href="/guide" className="block text-white font-semibold hover:text-gray-300">
                  User Guide
                </Link>
              </nav>
            </div>
          </div>
        </div>

        <div className="pt-8 flex justify-between items-center">
          <p className="text-white text-sm">
            © 2025 Elevate. All rights reserved.
          </p>

          <div className="flex gap-6">
            <Link href="/privacy" className="text-white hover:text-gray-300 text-sm underline">
              Privacy Policy
            </Link>
            <Link href="/terms" className="text-white hover:text-gray-300 text-sm underline">
              Terms of Service
            </Link>
            <Link href="/cookies" className="text-white hover:text-gray-300 text-sm underline">
              Cookie Settings
            </Link>
          </div>
        </div>
      </div>
    </footer>
  )
}