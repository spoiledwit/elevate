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
    <section className="relative py-20 px-8 bg-black overflow-hidden"
      style={{
        backgroundImage: `url(${gridSvg.src})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center'
      }}>
      {/* Background pattern with stars */}
      <div className="absolute inset-0">
        <div className="grid grid-cols-8 gap-8 h-full opacity-20">
          {Array.from({ length: 64 }).map((_, index) => (
            <div key={index} className="flex items-center justify-center">
              <img 
                src={starImage.src} 
                alt="" 
                className="w-6 h-6 opacity-30" 
              />
            </div>
          ))}
        </div>
      </div>

      {/* Main content */}
      <div className="relative z-10 max-w-4xl mx-auto text-center">
        {/* Large purple star in center */}
        <div className="mb-8">
          <img 
            src={starImage.src} 
            alt="" 
            className="w-16 h-16 mx-auto opacity-80" 
          />
        </div>

        <h2 className="text-4xl md:text-5xl font-bold text-white mb-8 leading-tight">
          Content That Sounds Like You.
        </h2>

        <p className="text-white text-lg mb-12 max-w-3xl mx-auto leading-relaxed">
          Our built-in GPT content assistant is trained to create content that sounds like you and converts, eliminating writing block forever.
        </p>

        {/* Feature tags */}
        <div className="flex flex-wrap justify-center gap-4 max-w-4xl mx-auto">
          {features.map((feature, index) => (
            <span
              key={index}
              className="text-black px-6 py-3 rounded-full text-sm font-medium whitespace-nowrap"
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