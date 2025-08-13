'use client'
import { useState, useEffect } from 'react'
import img1 from '@/assets/about/founder/img1.jpeg'
import img2 from '@/assets/about/founder/img2.jpg'
import img3 from '@/assets/about/founder/img3.jpg'

const founderImages = [img1, img2, img3]

export function FounderInsight() {
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const [isTransitioning, setIsTransitioning] = useState(false)

  useEffect(() => {
    const interval = setInterval(() => {
      setIsTransitioning(true)
      setTimeout(() => {
        setCurrentImageIndex((prevIndex) => (prevIndex + 1) % founderImages.length)
        setIsTransitioning(false)
      }, 300)
    }, 4000)

    return () => clearInterval(interval)
  }, [])

  return (
    <section className="py-24 px-8 bg-white">
      <div className="max-w-7xl mx-auto">
        <div className="relative">
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            {/* Founder Images Carousel */}
            <div className="relative">
              <div className="relative w-full max-w-lg mx-auto">
                {/* Main image container with smooth transitions */}
                <div className="relative rounded-2xl overflow-hidden shadow-2xl h-[500px]">
                  {/* Image stack with smooth transitions */}
                  {founderImages.map((image, index) => (
                    <div
                      key={index}
                      className={`absolute inset-0 transition-all duration-1000 ease-in-out ${
                        index === currentImageIndex 
                          ? 'opacity-100 scale-100' 
                          : 'opacity-0 scale-105'
                      }`}
                    >
                      <img
                        src={image.src}
                        alt="Founder"
                        className="w-full h-full object-cover"
                      />
                      {/* Subtle overlay for depth */}
                      <div className={`absolute inset-0 bg-gradient-to-t from-black/10 to-transparent transition-opacity duration-500 ${
                        index === currentImageIndex ? 'opacity-100' : 'opacity-0'
                      }`}></div>
                    </div>
                  ))}
                </div>
                
                {/* Image indicators with smooth transitions */}
                <div className="flex justify-center gap-3 mt-6">
                  {founderImages.map((_, index) => (
                    <button
                      key={index}
                      onClick={() => {
                        setIsTransitioning(true)
                        setTimeout(() => {
                          setCurrentImageIndex(index)
                          setIsTransitioning(false)
                        }, 150)
                      }}
                      className="relative group"
                      aria-label={`Go to image ${index + 1}`}
                    >
                      <div className={`h-2 rounded-full transition-all duration-500 ease-out ${
                        index === currentImageIndex 
                          ? 'w-12 bg-purple-500' 
                          : 'w-2 bg-gray-300 group-hover:bg-gray-400'
                      }`}></div>
                      {/* Progress bar for active indicator */}
                      {index === currentImageIndex && (
                        <div className="absolute inset-0 h-2 rounded-full overflow-hidden">
                          <div className="h-full bg-purple-600 animate-progress-bar"></div>
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Text Content */}
            <div className="relative">
              <div className="relative z-10">
                <div className="mb-6">
                  <span className="text-purple-500 font-semibold text-sm uppercase tracking-wider">THE REALIZATION</span>
                </div>
                
                <p className="text-2xl md:text-3xl font-semibold text-black leading-relaxed">
                  Despite offering nearly <span className="text-purple-500">done-for-you</span> solutions, I noticed many beginners still felt lost and overloaded by all the options.
                </p>
                
                <p className="text-xl md:text-2xl text-gray-700 mt-6 leading-relaxed">
                  Even with everything set up, they craved something <span className="font-bold text-purple-500">even easier</span>.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}