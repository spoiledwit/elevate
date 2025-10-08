import React from "react";
import { Navbar } from "@/components/landing/navbar";
import Hero from "@/components/influencer/Hero";
import IncomeModel from "@/components/influencer/IncomeModel";
import Welcome from "@/components/influencer/Welcome";
import Pricing from "@/components/influencer/Pricing";
import { Footer } from "@/components/landing/footer";
import ProblemSol from "@/components/influencer/ProblemSol";
import WhyIBuilt from "@/components/influencer/WhyIBuilt";
import Pillars from "@/components/influencer/Pillars";
import WhatYouGet from "@/components/influencer/WhatYouGet";
import Community from "@/components/influencer/Community";
import SocialProof from "@/components/influencer/SocialProof";
import BFYvsDFY from "@/components/influencer/BFYvsDFY";
import FAQs from "@/components/influencer/FAQs";
import ProvenSystem from "@/components/influencer/ProvenSystem";
import Recipe from "@/components/influencer/Recipe";

const Influencer = () => {
  return (
    <div className="bg-white">
      <Navbar />
      <Hero />
      <IncomeModel />
      <Welcome />
      <ProblemSol />
      <WhyIBuilt />
      <ProvenSystem />
      <Pillars />
      <WhatYouGet />
      <Community />
      <SocialProof />
      <Recipe />
      <BFYvsDFY />
      <Pricing />
      <FAQs />
      <Footer />
    </div>
  );
};

export default Influencer;
