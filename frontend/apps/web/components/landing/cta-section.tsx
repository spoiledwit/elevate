import yellowman from '@/assets/yellowman.png'

export function CTASection() {
  return (
    <section className="bg-purple-500 relative overflow-hidden">
      <div className="max-w-8xl px-14 mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center min-h-[500px]">
          <div className="text-white py-20 px-8">
            <h2 className="text-4xl md:text-5xl font-bold mb-6 leading-tight">
              Your brand deserves better than a static link.
            </h2>

            <p className="text-white text-lg mb-8 leading-relaxed">
              Start showing up with strategy, automation, and the tools that actually help you grow.
            </p>

            <div className="space-y-4">
              <button className="bg-black text-white px-8 py-4 rounded-lg font-semibold text-lg">
                Create My Free Elevate Social
              </button>

              <p className="text-white text-lg">
                Upgrade to Pro – <span className="font-semibold">$34.99/month</span>
              </p>
            </div>
          </div>

          <div className="flex justify-center lg:justify-end items-end h-full">
            <img
              src={yellowman.src}
              alt="Person working on laptop"
              className="w-full max-w-lg h-[500px] object-cover object-top"
            />
          </div>
        </div>
      </div>
    </section>
  )
}