'use client'

import { useState, useEffect } from 'react'
import { UsernameClaim } from './username-claim'

export function FloatingUsernameClaim() {
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
      className={`fixed bottom-8 left-1/2 transform -translate-x-1/2 z-50 transition-all duration-300 ease-in-out ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-full opacity-0'
        }`}
    >
      <UsernameClaim />
    </div>
  )
}