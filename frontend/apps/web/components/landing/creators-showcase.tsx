'use client'

import { useEffect, useRef } from 'react'
import creator1 from '@/assets/creators/Creators-1.png'
import creator2 from '@/assets/creators/Creators-2.png'
import creator3 from '@/assets/creators/Creators-3.png'
import creator4 from '@/assets/creators/Creators-4.png'
import creator5 from '@/assets/creators/Creators-5.png'
import creator6 from '@/assets/creators/Creators-6.png'

export function CreatorsShowcase() {
  const scrollRef = useRef<HTMLDivElement>(null)

  const creators = [
    { img: creator1, alt: 'Creator 1' },
    { img: creator2, alt: 'Creator 2' },
    { img: creator3, alt: 'Creator 3' },
    { img: creator4, alt: 'Creator 4' },
    { img: creator5, alt: 'Creator 5' },
    { img: creator6, alt: 'Creator 6' }
  ]

  useEffect(() => {
    const scrollElement = scrollRef.current
    if (!scrollElement) return

    let scrollAmount = 0
    const speed = 1 // pixels per frame
    const imageWidth = 48 * 4 + 32 // 48*4 for w-48 + 32 for gap-8 (8*4)
    const totalWidth = imageWidth * creators.length

    const scroll = () => {
      scrollAmount -= speed
      if (Math.abs(scrollAmount) >= totalWidth) {
        scrollAmount = 0
      }
      scrollElement.style.transform = `translateX(${scrollAmount}px)`
      requestAnimationFrame(scroll)
    }

    const animation = requestAnimationFrame(scroll)
    return () => cancelAnimationFrame(animation)
  }, [creators.length])

  // Create enough copies to fill the screen and more
  const repeatedCreators = Array(20).fill(creators).flat()

  return (
    <div className="relative w-full overflow-hidden py-8">
      <div 
        ref={scrollRef}
        className="flex gap-8"
        style={{ width: 'fit-content' }}
      >
        {repeatedCreators.map((creator, index) => (
          <img
            key={index}
            src={creator.img.src}
            alt={creator.alt}
            className="h-48 w-48 rounded-lg object-cover flex-shrink-0"
          />
        ))}
      </div>
    </div>
  )
}