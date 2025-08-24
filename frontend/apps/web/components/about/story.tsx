import graphic from '../../assets/about/graphic.png'

export function AboutStory() {
  return (
    <section className="py-24 px-8 bg-gray-50">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          {/* Text Content */}
          <div className="order-2 lg:order-1">
            <div className="mb-6">
              <span className="text-purple-500 font-semibold text-sm uppercase tracking-wider">THE JOURNEY</span>
            </div>
            <p className="text-2xl md:text-3xl font-semibold text-black leading-relaxed">
              After 2-3 years of mind mapping, testing, and building digital business systems for myself and thousands of clients—including top creators with huge audiences—I saw a clear pattern: <span className="text-purple-500">most people just want a simple, proven way to succeed online, without overwhelm.</span>
            </p>
          </div>

          {/* Image */}
          <div className="order-1 lg:order-2 flex justify-center lg:justify-end">
            <div className="bg-blue-100 rounded-3xl p-8 relative overflow-hidden">
              <img
                src={graphic.src}
                alt="Digital business illustration"
                className="w-full h-auto max-w-md"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}