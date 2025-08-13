import { Navbar } from '@/components/landing/navbar'
import { AboutHero } from '@/components/about/hero'
import { AboutStory } from '@/components/about/story'
import { FounderInsight } from '@/components/about/founder-insight'
import { AboutMission } from '@/components/about/mission'
import { Footer } from '@/components/landing/footer'

export default function About() {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <AboutHero />
      <AboutStory />
      <FounderInsight />
      <AboutMission />
      <Footer />
    </div>
  )
}