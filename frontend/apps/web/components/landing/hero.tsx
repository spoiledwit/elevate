'use client'

import { UsernameClaim } from './username-claim'
import heroImage from '@/assets/hero.png'

export function Hero() {
  return (
    <section className="relative overflow-hidden pt-20 sm:pt-24 lg:pt-32 pb-8 sm:pb-12 lg:pb-16" data-hero-section>
      <div className="absolute top-0 right-0 w-48 h-48 sm:w-64 sm:h-64 lg:w-96 lg:h-96 rounded-full blur-3xl opacity-30" style={{backgroundColor: '#714efe66'}}></div>
      <div className="absolute bottom-0 left-0 w-48 h-48 sm:w-64 sm:h-64 lg:w-96 lg:h-96 rounded-full blur-3xl opacity-20" style={{backgroundColor: '#714efe80'}}></div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10 mb-8 sm:mb-12 lg:mb-16">
        <div className="mb-6 sm:mb-8">
          <span className="inline-block px-3 py-1.5 sm:px-4 sm:py-2 rounded-full text-xs sm:text-sm font-semibold mb-4" style={{backgroundColor: '#714efe1a', color: '#714efe'}}>
            ✨ EVERYTHING YOU NEED IN ONE PLACE
          </span>
          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-black leading-tight relative">
            <span className="bg-clip-text text-transparent" style={{backgroundImage: 'linear-gradient(to right, #1f2937, #714efe, #1f2937)'}}>
              The Smartest Way
            </span>
            <br />
            <span className="relative inline-block">
              <span className="text-black">to Show Up</span>
              <span className="ml-2 sm:ml-3 relative" style={{color: '#714efe'}}>
                Online
                <svg className="absolute -bottom-1 sm:-bottom-2 left-0 w-full" height="8" viewBox="0 0 150 12" fill="none">
                  <path d="M2 8C40 3 110 3 148 8" stroke="url(#gradient)" strokeWidth="3" strokeLinecap="round"/>
                  <defs>
                    <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="#714efe" />
                      <stop offset="50%" stopColor="#5f3fd6" />
                      <stop offset="100%" stopColor="#714efe" />
                    </linearGradient>
                  </defs>
                </svg>
              </span>
            </span>
          </h1>
        </div>

        <p className="text-gray-600 text-base sm:text-lg lg:text-xl mb-8 sm:mb-10 lg:mb-12 max-w-3xl mx-auto px-2">
          All-in-one dashboard for content creators and digital marketers.
          Schedule your content, build your brand hub, trigger automated DMs,
          and generate AI-powered content — all from one powerful,
          personalized platform.
        </p>

        <UsernameClaim />
      </div>
      
      <div className="w-full relative z-10">
        <div className="relative">
          <img
            src={heroImage.src}
            alt="Elevate Social Dashboard"
            className="w-full h-auto object-cover select-none pointer-events-none"
            draggable="false"
            onContextMenu={(e) => e.preventDefault()}
          />
          <div className="absolute inset-0 bg-transparent select-none pointer-events-auto"></div>
        </div>
      </div>
    </section>
  )
}