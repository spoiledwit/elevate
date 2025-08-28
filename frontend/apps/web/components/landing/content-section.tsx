import starImage from '@/assets/star.png'
import gridSvg from '@/assets/grid.svg'

export function ContentSection() {
  const features = [
    "Social captions",
    "Reels hooks", 
    "Affiliate DMs",
    "Email subject lines",
    "Banner CTAs",
    "Searchable GPT library",
    "Voice-to-text content support"
  ]

  return (
    <section className="relative py-12 sm:py-16 lg:py-20 px-4 sm:px-6 lg:px-8 bg-black overflow-hidden"
      style={{
        backgroundImage: `url(${gridSvg.src})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center'
      }}>
      {/* Background pattern with stars */}
      <div className="absolute inset-0">
        <div className="hidden sm:grid sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-4 sm:gap-6 lg:gap-8 h-full opacity-20">
          {Array.from({ length: 64 }).map((_, index) => (
            <div key={index} className="flex items-center justify-center">
              <img 
                src={starImage.src} 
                alt="" 
                className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6 opacity-30" 
              />
            </div>
          ))}
        </div>
      </div>

      {/* Main content */}
      <div className="relative z-10 max-w-4xl mx-auto text-center">
        {/* Large purple star in center */}
        <div className="mb-6 sm:mb-8">
          <img 
            src={starImage.src} 
            alt="" 
            className="w-12 h-12 sm:w-14 sm:h-14 lg:w-16 lg:h-16 mx-auto opacity-80" 
          />
        </div>

        <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-6 sm:mb-8 leading-tight">
          Content That Sounds Like You.
        </h2>

        <p className="text-white text-sm sm:text-base lg:text-lg mb-8 sm:mb-10 lg:mb-12 max-w-3xl mx-auto leading-relaxed px-4 sm:px-0">
          Our built-in GPT content assistant is trained to create content that sounds like you and converts, eliminating writing block forever.
        </p>

        {/* Feature tags */}
        <div className="flex flex-wrap justify-center gap-2 sm:gap-3 lg:gap-4 max-w-4xl mx-auto">
          {features.map((feature, index) => (
            <span
              key={index}
              className="text-black px-3 py-2 sm:px-4 sm:py-2.5 lg:px-6 lg:py-3 rounded-full text-xs sm:text-sm font-medium"
              style={{
                background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)'
              }}
            >
              {feature}
            </span>
          ))}
        </div>
      </div>
    </section>
  )
}