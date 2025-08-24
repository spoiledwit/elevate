import img4 from '../../assets/about/founder/img4.jpeg'
import img5 from '../../assets/about/founder/img5.jpeg'

export function AboutMission() {
  return (
    <section className="py-24 px-8 bg-gray-50">
      <div className="max-w-6xl mx-auto">
        {/* Section header */}
        <div className="text-center mb-16">
          <span className="text-purple-500 font-semibold text-sm uppercase tracking-wider">THE SOLUTION</span>
          <h2 className="text-3xl md:text-4xl font-bold text-black mt-4">Building What Was Needed</h2>
        </div>

        {/* First section */}
        <div className="mb-20">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h3 className="text-2xl md:text-3xl font-semibold text-black leading-relaxed mb-6">
                I was tired of using <span className="text-purple-500">10+ tools</span> and{' '}
                <span className="text-purple-500">50 browser tabs</span> just to run my business and help my clients scale.
              </h3>
              <p className="text-lg text-gray-700 leading-relaxed">
                So, I teamed up with industry experts, pulled insights from thousands of clients (and their clients), and created the platform I wished I had from the beginning, Elevate Social.
              </p>
            </div>
            <div>
              <img
                src={img4.src}
                alt="Working on platform"
                className="rounded-2xl shadow-lg w-full h-[400px] object-cover"
              />
            </div>
          </div>
        </div>

        {/* Second section */}
        <div className="mb-20">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="order-2 lg:order-1">
              <img
                src={img5.src}
                alt="Building together"
                className="rounded-2xl shadow-lg w-full h-[400px] object-cover"
              />
            </div>
            <div className="order-1 lg:order-2">
              <p className="text-xl md:text-2xl text-gray-800 leading-relaxed mb-6">
                Everyone deserves an easy path to build, grow, and earn—<span className="font-bold">your way, your brand, your impact</span>.
              </p>
              <p className="text-lg text-gray-700 leading-relaxed">
                With Elevate Social, you get everything you need (and nothing you don't) to create, edit, design, post, schedule, list, grow, and earn—all from one login.
              </p>
            </div>
          </div>
        </div>

        {/* Third section - Affiliate */}
        <div className="bg-white rounded-2xl p-12 shadow-sm">
          <div className="max-w-4xl mx-auto text-center">
            <div className="mb-6">
              <span className="inline-block px-4 py-2 bg-purple-100 text-purple-600 rounded-full text-sm font-semibold">
                WIN-WIN OPPORTUNITY
              </span>
            </div>
            <h3 className="text-2xl md:text-3xl font-bold text-black mb-6">
              Plus, you can tap into our affiliate program to earn{' '}
              <span className="text-purple-500">recurring income every month</span>{' '}
              when people sign up through your link.
            </h3>
            <p className="text-xl text-gray-700">
              It's a true win-win—helping you and your customers succeed, together.
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}