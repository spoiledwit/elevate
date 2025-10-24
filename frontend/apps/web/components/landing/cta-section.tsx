import yellowman from '@/assets/yellowman.png'

export function CTASection() {
  return (
    <section className="relative overflow-hidden" style={{ backgroundColor: '#bea456' }}>
      <div className="max-w-8xl px-4 sm:px-6 lg:px-14 mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 sm:gap-10 lg:gap-12 items-center min-h-[400px] sm:min-h-[450px] lg:min-h-[500px]">
          <div className="text-white py-10 sm:py-16 lg:py-20 px-4 sm:px-6 lg:px-8 text-center lg:text-left">
            <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold mb-4 sm:mb-6 leading-tight">
              Your brand deserves better than a static link.
            </h2>

            <p className="text-white text-base sm:text-lg mb-6 sm:mb-8 leading-relaxed">
              Start showing up with strategy, automation, and the tools that actually help you grow.
            </p>

            <div className="space-y-3 sm:space-y-4">
              <button className="bg-black text-white px-6 sm:px-8 py-3 sm:py-4 rounded-lg font-semibold text-sm sm:text-base lg:text-lg w-full sm:w-auto">
                Create My Free Elevate Social
              </button>


            </div>
          </div>

          <div className="flex justify-center lg:justify-end items-end h-full order-first lg:order-last">
            <img
              src={yellowman.src}
              alt="Person working on laptop"
              className="w-full max-w-xs sm:max-w-sm lg:max-w-lg h-[300px] sm:h-[400px] lg:h-[500px] object-cover object-top"
            />
          </div>
        </div>
      </div>
    </section>
  )
}