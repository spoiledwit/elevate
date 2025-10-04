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

          </div>

          <div className="flex justify-center lg:justify-end lg:ml-auto lg:mr-20">
            <div>
              <nav className="space-y-2 sm:space-y-3">
                <Link href="/" className="block text-white font-semibold hover:text-gray-300 text-sm sm:text-base">
                  Home
                </Link>
                <Link href="/about" className="block text-white font-semibold hover:text-gray-300 text-sm sm:text-base">
                  About Us
                </Link>
                <Link href="/login" className="block text-white font-semibold hover:text-gray-300 text-sm sm:text-base">
                  Login
                </Link>
                <Link href="/get-started" className="block text-white font-semibold hover:text-gray-300 text-sm sm:text-base">
                  Get Started
                </Link>
              </nav>
            </div>
          </div>
        </div>

        <div className="pt-6 sm:pt-8 flex flex-col sm:flex-row justify-between items-center gap-4 border-t border-gray-700">
          <p className="text-white text-xs sm:text-sm order-2 sm:order-1">
            © 2025 Elevate. All rights reserved.
          </p>

          <div className="flex gap-4 order-1 sm:order-2">
            <Link href="/terms" className="text-white text-xs sm:text-sm hover:text-gray-300 transition-colors">
              Terms & Conditions
            </Link>
            <Link href="/privacy" className="text-white text-xs sm:text-sm hover:text-gray-300 transition-colors">
              Privacy Policy
            </Link>
          </div>
        </div>
      </div>
    </footer>
  )
}