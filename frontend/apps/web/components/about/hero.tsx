import sparkle from '../../assets/about/sparkle.svg'
import smile from '../../assets/about/smile.svg'
import { CreatorsShowcase } from '../landing/creators-showcase'
import Link from 'next/link'

export function AboutHero() {
  return (
    <section className="relative overflow-hidden pt-20 sm:pt-24 lg:pt-32 pb-12 sm:pb-16 bg-gradient-to-b from-white to-gray-50">
      {/* Purple blur decorative elements */}
      <div className="absolute top-0 right-0 w-48 h-48 sm:w-64 sm:h-64 lg:w-[450px] lg:h-[450px] rounded-full blur-3xl opacity-25" style={{ backgroundColor: '#bea45680' }}></div>
      <div className="absolute bottom-0 left-0 w-48 h-48 sm:w-64 sm:h-64 lg:w-[450px] lg:h-[450px] rounded-full blur-3xl opacity-20" style={{ backgroundColor: '#bea45666' }}></div>

      {/* Background decorative elements */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10 pt-4 sm:pt-6 lg:pt-8">
        {/* Main heading with sparkle icon */}
        <div className="flex flex-col sm:flex-row items-start justify-center mb-8 sm:mb-10 lg:mb-12">
          <img
            src={sparkle.src}
            alt=""
            className="w-12 h-12 sm:w-14 sm:h-14 lg:w-16 lg:h-16 mt-1 sm:mt-2 mb-4 sm:mb-0 sm:mr-[-40px] flex-shrink-0 mx-auto sm:mx-0"
          />
          <h1 className="text-2xl sm:text-3xl lg:text-4xl xl:text-[40px] font-bold leading-tight text-black max-w-4xl px-4 sm:px-0">
            To create the{' '}
            <span style={{ color: '#bea456' }}>all-in-one platform</span>{' '}
            I always{' '}
            <span style={{ color: '#bea456' }}>needed</span>{' '}
            and wished for my{' '}
            <span style={{ color: '#bea456' }}>clients</span>, I built{' '}
            Elevate Social.{' '}
            <img
              src={smile.src}
              alt=""
              className="w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12 inline-block ml-1 sm:ml-2"
            />
          </h1>
        </div>

        {/* CTA Button */}
        <Link
          href={"/get-started"}
          className="text-white px-6 sm:px-8 py-3 sm:py-4 rounded-lg font-semibold text-base sm:text-lg w-full sm:w-auto max-w-sm mx-auto"
          style={{ backgroundColor: '#bea456' }}>
          Get Started for Free
        </Link>
      </div>

      {/* Add spacing before CreatorsShowcase */}
      <div className="mt-12 sm:mt-16 lg:mt-20">
        <CreatorsShowcase />
      </div>
    </section>
  )
}