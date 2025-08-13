'use client'

import { useState, useEffect } from 'react'
import logo from "@/assets/logo.png"

export function FloatingUsernameClaim() {
  const [username, setUsername] = useState('')
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      const heroSection = document.querySelector('[data-hero-section]')
      const faqSection = document.querySelector('[data-faq-section]')
      
      if (heroSection && faqSection) {
        const heroRect = heroSection.getBoundingClientRect()
        const faqRect = faqSection.getBoundingClientRect()
        
        // Show when hero is scrolled past, but hide when FAQ section comes into view
        const heroScrolledPast = heroRect.bottom < window.innerHeight * 0.1
        const faqInView = faqRect.top < window.innerHeight
        
        setIsVisible(heroScrolledPast && !faqInView)
      }
    }

    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <div 
      className={`fixed bottom-8 left-1/2 transform -translate-x-1/2 z-50 transition-all duration-300 ease-in-out ${
        isVisible ? 'translate-y-0 opacity-100' : 'translate-y-full opacity-0'
      }`}
    >
      <div className="flex items-stretch justify-center gap-3 max-w-xl mx-auto">
        <div className="flex items-center gap-2 flex-1 bg-white rounded-lg px-4 h-14 shadow-lg overflow-hidden">
          <img
            src={logo.src}
            alt="elevate.social"
            className="h-8 flex-shrink-0"
          />
          <span className="font-semibold text-lg flex-shrink-0">elevate.social</span>
          <span className="text-purple-500 font-semibold text-lg flex-shrink-0">/</span>
          <input
            type="text"
            placeholder="username"
            value={username}
            onChange={(e) => setUsername(e.target.value.replace(/\s/g, ''))}
            className="min-w-0 flex-1 outline-none text-purple-500 text-lg placeholder-purple-300 font-medium"
          />
        </div>

        <button className="bg-purple-500 hover:bg-purple-600 text-white px-6 h-14 rounded-lg font-semibold whitespace-nowrap text-[18px] transition-colors shadow-lg">
          Claim your username
        </button>
      </div>
    </div>
  )
}