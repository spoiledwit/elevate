import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { Navbar } from "@/components/landing/navbar";
import { Hero } from "@/components/landing/hero";
import { CreatorsShowcase } from "@/components/landing/creators-showcase";
import { ContentConsistency } from "@/components/landing/content-consistency";
import { FeaturesStack } from "@/components/landing/features-stack";
import { HowItWorks } from "@/components/landing/how-it-works";
import { ContentSection } from "@/components/landing/content-section";
import { PricingPlans } from "@/components/landing/pricing-plans";
import { Testimonials } from "@/components/landing/testimonials";
import { CTASection } from "@/components/landing/cta-section";
import { FAQ } from "@/components/landing/faq";
import { Footer } from "@/components/landing/footer";
import { FloatingUsernameClaim } from "@/components/landing/floating-username-claim";
import { getPlansAction } from "@/actions";

export default async function Home() {
  // Check hostname and redirect accordingly
  const headersList = await headers();
  const host = headersList.get("host") || "";

  // Redirect twc subdomain to login
  if (host.includes("twc.elevate.social")) {
    redirect("/login");
  }

  // Redirect main elevate.social to start page
  if (host.includes("elevate.social")) {
    redirect("https://start.elevate.social");
  }

  // For local development or other domains, redirect to login
  redirect("/login");
}
