import Link from 'next/link'
import lgoblack from "@/assets/logo.png"

export function ComingSoon() {
    return (
        <div className="min-h-screen flex flex-col bg-white">
            {/* Navbar */}
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
                </div>
            </nav>

            {/* Main Content */}
            <main className="relative flex-1 overflow-hidden pt-20 sm:pt-24 lg:pt-32 pb-8 sm:pb-12 lg:pb-16 flex items-center justify-center">
                {/* Background Elements */}
                <div className="absolute top-0 right-0 w-48 h-48 sm:w-64 sm:h-64 lg:w-96 lg:h-96 bg-purple-200 rounded-full blur-3xl opacity-30"></div>
                <div className="absolute bottom-0 left-0 w-48 h-48 sm:w-64 sm:h-64 lg:w-96 lg:h-96 bg-purple-300 rounded-full blur-3xl opacity-20"></div>
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-32 h-32 sm:w-48 sm:h-48 lg:w-64 lg:h-64 bg-purple-100 rounded-full blur-3xl opacity-25"></div>

                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
                    <div className="mb-6 sm:mb-8">
                        <span className="inline-block px-3 py-1.5 sm:px-4 sm:py-2 bg-purple-100 text-purple-600 rounded-full text-xs sm:text-sm font-semibold mb-6 sm:mb-8">
                            ✨ SOMETHING AMAZING IS COMING
                        </span>

                        <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-black leading-tight relative mb-6 sm:mb-8">
                            <span className="bg-gradient-to-r from-gray-900 via-purple-800 to-gray-900 bg-clip-text text-transparent">
                                Coming Soon
                            </span>
                            <br />
                            <span className="relative inline-block">
                                <span className="text-black">Stay</span>
                                <span className="text-purple-500 ml-2 sm:ml-3 relative">
                                    Tuned
                                    <svg className="absolute -bottom-1 sm:-bottom-2 left-0 w-full" height="8" viewBox="0 0 150 12" fill="none">
                                        <path d="M2 8C40 3 110 3 148 8" stroke="url(#gradient)" strokeWidth="3" strokeLinecap="round" />
                                        <defs>
                                            <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                                                <stop offset="0%" stopColor="#a855f7" />
                                                <stop offset="50%" stopColor="#7c3aed" />
                                                <stop offset="100%" stopColor="#a855f7" />
                                            </linearGradient>
                                        </defs>
                                    </svg>
                                </span>
                            </span>
                        </h1>

                        <p className="text-gray-600 text-base sm:text-lg lg:text-xl mb-8 sm:mb-10 lg:mb-12 max-w-3xl mx-auto px-2">
                            We're working hard to bring you something incredible.
                            Our team is putting the finishing touches on a revolutionary platform
                            that will transform how you manage your digital presence.
                        </p>
                    </div>
                </div>
            </main>

            {/* Footer */}
            <footer className="py-8 px-4 sm:px-6 lg:px-20 border-t border-gray-100 relative z-10">
                <div className="max-w-4xl mx-auto text-center text-gray-600 text-sm">
                    <p>&copy; 2025 Elevate Social. All rights reserved.</p>
                </div>
            </footer>
        </div>
    )
}