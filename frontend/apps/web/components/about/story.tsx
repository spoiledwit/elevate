import graphic from '../../assets/about/graphic.png'

export function AboutStory() {
  return (
    <section className="py-12 sm:py-16 lg:py-24 px-4 sm:px-6 lg:px-8 bg-gray-50">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 sm:gap-12 lg:gap-16 items-center">
          {/* Text Content */}
          <div className="order-2 lg:order-1 text-center lg:text-left">
            <div className="mb-4 sm:mb-6">
              <span className="font-semibold text-xs sm:text-sm uppercase tracking-wider" style={{ color: '#bea456' }}>THE JOURNEY</span>
            </div>
            <p className="text-lg sm:text-xl lg:text-2xl xl:text-3xl font-semibold text-black leading-relaxed">
              After 2-3 years of mind mapping, testing, and building digital business systems for myself and thousands of clients—including top creators with huge audiences—I saw a clear pattern: <span style={{ color: '#bea456' }}>most people just want a simple, proven way to succeed online, without overwhelm.</span>
            </p>
          </div>

          {/* Image */}
          <div className="order-1 lg:order-2 flex justify-center lg:justify-end">
            <div className="bg-blue-100 rounded-3xl p-4 sm:p-6 lg:p-8 relative overflow-hidden w-full max-w-sm sm:max-w-md lg:max-w-lg">
              <img
                src={graphic.src}
                alt="Digital business illustration"
                className="w-full h-auto"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}