import React from "react";
import Container from "../common/Container";
import { Check } from "lucide-react";

const WhyIBuilt = () => {
  return (
    <Container className="bg-gradient-to-b from-[#F5F3EF] via-[#FFFFFF] to-[#F8F6F3]">
      <div className="text-center mb-16">
        <p className="text-brand font-semibold mb-4 flex items-center justify-center gap-2">
          <span className="text-xl">💡</span>
          WHY I BUILT THIS
        </p>
        <h2 className="text-5xl font-semibold text-center">
          After co-founding{" "}
          <span className="text-brand">award-winning systems</span>, scaling
          with <span className="text-brand">GoHighLevel</span>, and working
          behind the scenes...
        </h2>
      </div>

      {/* 4 Cards */}
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
        {/* Step 1 */}
        <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl p-6 text-white">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-6 h-6 rounded-full border-2 border-white flex items-center justify-center">
              <Check className="w-4 h-4" />
            </div>
            <p className="font-semibold">STEP 1</p>
          </div>
          <h3 className="text-xl font-bold mb-3">
            I saw the same issue over and over again:
          </h3>
          <p className="text-purple-100">
            People don't need more tools. They need the right tools—simplified
            and duplicatable.
          </p>
        </div>

        {/* Step 2 */}
        <div className="bg-gradient-to-br from-indigo-500 to-brand rounded-2xl p-6 text-white">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-6 h-6 rounded-full border-2 border-white flex items-center justify-center">
              <Check className="w-4 h-4" />
            </div>
            <p className="font-semibold">STEP 2</p>
          </div>
          <h3 className="text-xl font-bold mb-3">Elevate.Social was created</h3>
          <p className="text-indigo-100">
            To solve the problem of confusion, overwhelm, and scattered
            resources.
          </p>
        </div>

        {/* Step 3 */}
        <div className="bg-gradient-to-br from-purple-600 to-purple-700 rounded-2xl p-6 text-white">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-6 h-6 rounded-full border-2 border-white flex items-center justify-center">
              <Check className="w-4 h-4" />
            </div>
            <p className="font-semibold">STEP 3</p>
          </div>
          <h3 className="text-xl font-bold mb-3">Simple & duplicatable</h3>
          <p className="text-purple-100">
            Anyone can follow the system. All-in-one → no duct-taping tools
            together.
          </p>
        </div>

        {/* Step 4 */}
        <div className="bg-gradient-to-br from-brand to-purple-600 rounded-2xl p-6 text-white">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-6 h-6 rounded-full border-2 border-white flex items-center justify-center">
              <Check className="w-4 h-4" />
            </div>
            <p className="font-semibold">STEP 4</p>
          </div>
          <h3 className="text-xl font-bold mb-3">Built for Real Leaders</h3>
          <p className="text-indigo-100">
            Friction-free because when the path is clear, momentum builds.
          </p>
        </div>
      </div>

      {/* Bottom Image Section */}
      <div className="relative max-w-md mx-auto">
        <img src="/hero.png" alt="" />
      </div>
    </Container>
  );
};

export default WhyIBuilt;
