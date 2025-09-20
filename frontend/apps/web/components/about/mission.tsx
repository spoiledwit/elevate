import img4 from '../../assets/about/founder/img4.jpeg'
import img5 from '../../assets/about/founder/img5.jpeg'

export function AboutMission() {
  return (
    <section className="py-12 sm:py-16 lg:py-24 px-4 sm:px-6 lg:px-8 bg-gray-50">
      <div className="max-w-6xl mx-auto">
        {/* Section header */}
        <div className="text-center mb-10 sm:mb-12 lg:mb-16">
          <span className="font-semibold text-xs sm:text-sm uppercase tracking-wider" style={{color: '#714efe'}}>THE SOLUTION</span>
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-black mt-3 sm:mt-4">Building What Was Needed</h2>
        </div>

        {/* First section */}
        <div className="mb-12 sm:mb-16 lg:mb-20">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 sm:gap-10 lg:gap-12 items-center">
            <div className="text-center lg:text-left order-2 lg:order-1">
              <h3 className="text-xl sm:text-2xl lg:text-3xl font-semibold text-black leading-relaxed mb-4 sm:mb-6">
                I was tired of using <span style={{color: '#714efe'}}>10+ tools</span> and{' '}
                <span style={{color: '#714efe'}}>50 browser tabs</span> just to run my business and help my clients scale.
              </h3>
              <p className="text-base sm:text-lg text-gray-700 leading-relaxed">
                So, I teamed up with industry experts, pulled insights from thousands of clients (and their clients), and created the platform I wished I had from the beginning, Elevate Social.
              </p>
            </div>
            <div className="order-1 lg:order-2">
              <img
                src={img4.src}
                alt="Working on platform"
                className="rounded-2xl shadow-lg w-full h-[250px] sm:h-[300px] lg:h-[400px] object-cover mx-auto"
              />
            </div>
          </div>
        </div>

        {/* Second section */}
        <div className="mb-12 sm:mb-16 lg:mb-20">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 sm:gap-10 lg:gap-12 items-center">
            <div className="order-1 lg:order-1">
              <img
                src={img5.src}
                alt="Building together"
                className="rounded-2xl shadow-lg w-full h-[250px] sm:h-[300px] lg:h-[400px] object-cover mx-auto"
              />
            </div>
            <div className="order-2 lg:order-2 text-center lg:text-left">
              <p className="text-lg sm:text-xl lg:text-2xl text-gray-800 leading-relaxed mb-4 sm:mb-6">
                Everyone deserves an easy path to build, grow, and earn—<span className="font-bold">your way, your brand, your impact</span>.
              </p>
              <p className="text-base sm:text-lg text-gray-700 leading-relaxed">
                With Elevate Social, you get everything you need (and nothing you don't) to create, edit, design, post, schedule, list, grow, and earn—all from one login.
              </p>
            </div>
          </div>
        </div>

        {/* Third section - Affiliate */}
        <div className="bg-white rounded-2xl p-6 sm:p-8 lg:p-12 shadow-sm">
          <div className="max-w-4xl mx-auto text-center">
            <div className="mb-4 sm:mb-6">
              <span className="inline-block px-3 sm:px-4 py-1.5 sm:py-2 rounded-full text-xs sm:text-sm font-semibold" style={{backgroundColor: '#714efe1a', color: '#714efe'}}>
                WIN-WIN OPPORTUNITY
              </span>
            </div>
            <h3 className="text-xl sm:text-2xl lg:text-3xl font-bold text-black mb-4 sm:mb-6">
              Plus, you can tap into our affiliate program to earn{' '}
              <span style={{color: '#714efe'}}>recurring income every month</span>{' '}
              when people sign up through your link.
            </h3>
            <p className="text-base sm:text-lg lg:text-xl text-gray-700">
              It's a true win-win—helping you and your customers succeed, together.
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}