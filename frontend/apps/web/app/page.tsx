import { Navbar } from "@/components/landing/navbar";
import Hero from "@/components/home/Hero";
import IncomeModel from "@/components/home/IncomeModel";
import Welcome from "@/components/home/Welcome";
import Pricing from "@/components/home/Pricing";
import { Footer } from "@/components/landing/footer";
import ProblemSol from "@/components/home/ProblemSol";
import WhyIBuilt from "@/components/home/WhyIBuilt";
import { redirect } from "next/navigation";

export default function Home() {
  redirect("/login");
  return (
    <div className="min-h-screen">
      <Navbar />
      <Hero />
      <IncomeModel />
      <Welcome />
      <ProblemSol />
      <WhyIBuilt />
      <Pricing />
      <Footer />
    </div>
  );
}
