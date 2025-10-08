import React from "react";
import Container from "../common/Container";
import Image from "next/image";

const Community = () => {
  return (
    <Container className="bg-gradient-to-b from-[#F5F3EF] via-[#FFFFFF] to-[#F8F6F3]">
      {/* Top Section */}
      <div className="text-center mb-12">
        {/* ELEVATE Logo */}
        <h1 className="text-6xl md:text-7xl font-black text-black mb-8 tracking-tight">
          ELEVATE
        </h1>

        {/* Progress Dots */}
        <div className="flex justify-center gap-3 mb-8">
          {[...Array(10)].map((_, i) => (
            <div key={i} className="w-16 h-16 bg-gray-200 rounded-md" />
          ))}
        </div>

        {/* YOU'RE INVITED */}
        <p className="text-brand text-sm font-semibold mb-6 tracking-wide">
          YOU'RE INVITED
        </p>

        {/* Main Heading */}
        <h2 className="text-4xl md:text-5xl font-bold mb-6 max-w-2xl mx-auto">
          Where <span className="text-brand">Built-for-You</span> Meets{" "}
          <span className="text-brand">Done-for-them</span>
        </h2>
        {/* Subheading */}
        <p className="text-xl font-semibold mb-2">
          The Ultimate{" "}
          <span className="text-brand">
            all-in-one social & affiliate marketing
          </span>
        </p>
        <p className="text-xl font-semibold">
          System - Plug In, Profit, and{" "}
          <span className="text-brand">Elevate</span> -
        </p>
      </div>

      {/* Bottom Section - Modules and Image */}
      <div className="grid lg:grid-cols-2 gap-12 items-start mt-16">
        {/* Left Side - Modules */}
        <div>
          <p className="text-brand text-xs font-semibold mb-4 tracking-wide">
            WHAT'S INSIDE
          </p>
          <div className="flex flex-wrap gap-4">
            {/* Module 1 */}
            <div className="bg-brand rounded-xl p-6 w-full sm:w-auto sm:min-w-[200px] flex flex-col items-center justify-center">
              <p className="text-white text-sm font-semibold mb-2">Module 1</p>
              <p className="text-indigo-100 text-xs">Content Promo</p>
              <p className="text-indigo-100 text-xs">Funnel</p>
              <p className="text-indigo-100 text-xs">Membership</p>
            </div>

            {/* Module 2 */}
            <div className="bg-brand rounded-xl p-6 w-full sm:w-auto sm:min-w-[200px] flex flex-col items-center justify-center">
              <p className="text-white text-sm font-semibold mb-2">Module 2</p>
              <p className="text-indigo-100 text-xs">Content Promo</p>
              <p className="text-indigo-100 text-xs">Funnel</p>
              <p className="text-indigo-100 text-xs">Membership</p>
            </div>

            {/* Module 3 */}
            <div className="bg-brand rounded-xl p-6 w-full sm:w-auto sm:min-w-[200px] flex flex-col items-center justify-center">
              <p className="text-white text-sm font-semibold mb-2">Module 3</p>
              <p className="text-indigo-100 text-xs">Content Promo</p>
              <p className="text-indigo-100 text-xs">Funnel</p>
              <p className="text-indigo-100 text-xs">Membership</p>
            </div>
          </div>
        </div>

        {/* Right Side - Image */}
        <div className="flex justify-center lg:justify-end">
          <div className="relative">
            <Image
              src="/gif.gif"
              alt="Platform Preview"
              width={500}
              height={500}
              className="rounded-lg"
              unoptimized
            />
          </div>
        </div>
      </div>
    </Container>
  );
};

export default Community;
