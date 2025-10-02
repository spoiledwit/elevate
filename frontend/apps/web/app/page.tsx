import { redirect } from 'next/navigation'
import { Navbar } from '@/components/landing/navbar'
import { Hero } from '@/components/landing/hero'
import { CreatorsShowcase } from '@/components/landing/creators-showcase'
import { ContentConsistency } from '@/components/landing/content-consistency'
import { FeaturesStack } from '@/components/landing/features-stack'
import { HowItWorks } from '@/components/landing/how-it-works'
import { ContentSection } from '@/components/landing/content-section'
import { PricingPlans } from '@/components/landing/pricing-plans'
import { Testimonials } from '@/components/landing/testimonials'
import { CTASection } from '@/components/landing/cta-section'
import { FAQ } from '@/components/landing/faq'
import { Footer } from '@/components/landing/footer'
import { FloatingUsernameClaim } from '@/components/landing/floating-username-claim'
import { getPlansAction } from '@/actions'

export default async function Home() {
  redirect('/login')
  // Fetch plans data on the server
  const plansData = await getPlansAction()
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <Hero />
      <CreatorsShowcase />
      <ContentConsistency />
      <FeaturesStack />
      <PricingPlans plansData={plansData} />
      <Testimonials />
      <ContentSection />
      <HowItWorks />
      <CTASection />
      <FAQ />
      <Footer />
      <FloatingUsernameClaim />
    </div>
  )
}