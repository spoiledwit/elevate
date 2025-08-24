import sparkle from '../../assets/about/sparkle.svg'
import smile from '../../assets/about/smile.svg'
import { CreatorsShowcase } from '../landing/creators-showcase'

export function AboutHero() {
  return (
    <section className="relative overflow-hidden pt-32 pb-16 bg-gradient-to-b from-white to-gray-50">
      {/* Purple blur decorative elements */}
      <div className="absolute top-0 right-0 w-[450px] h-[450px] bg-purple-300 rounded-full blur-3xl opacity-25"></div>
      <div className="absolute bottom-0 left-0 w-[450px] h-[450px] bg-purple-300 rounded-full blur-3xl opacity-20"></div>

      {/* Background decorative elements */}
      <div className="max-w-6xl mx-auto px-8 text-center relative z-10 pt-8">
        {/* Main heading with sparkle icon */}
        <div className="flex items-start justify-center mb-12">
          <img
            src={sparkle.src}
            alt=""
            className="w-16 h-16 mt-2 mr-[-40px] flex-shrink-0"
          />
          <h1 className="text-3xl md:text-[40px] font-bold leading-tight text-black max-w-4xl">
            To create the{' '}
            <span className="text-purple-500">all-in-one platform</span>{' '}
            I always{' '}
            <span className="text-purple-500">needed</span>{' '}
            and wished for my{' '}
            <span className="text-purple-500">clients</span>, I built{' '}
            Elevate Social.{' '}
            <img
              src={smile.src}
              alt=""
              className="w-10 h-10 md:w-12 md:h-12 inline-block ml-2"
            />
          </h1>
        </div>

        {/* CTA Button */}
        <button className="bg-purple-500  text-white px-8 py-4 rounded-lg font-semibold text-lg">
          Get Started for Free
        </button>
      </div>
      <br />
      <br />
      <CreatorsShowcase />
    </section>
  )
}