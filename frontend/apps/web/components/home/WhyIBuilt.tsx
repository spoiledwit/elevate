import React from "react";
import Container from "../common/Container";
import { Check } from "lucide-react";

const WhyIBuilt = () => {
  return (
    <Container>
      <div className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="text-center mb-16">
            <p className="text-indigo-600 font-semibold mb-4 flex items-center justify-center gap-2">
              <span className="text-xl">💡</span>
              WHY I BUILT THIS
            </p>
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900">
              After co-founding{" "}
              <span className="text-indigo-600">award-winning systems</span>,
              scaling with <span className="text-indigo-600">GoHighLevel</span>,
              and working behind the scenes...
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
                People don't need more tools. They need the right
                tools—simplified and duplicatable.
              </p>
            </div>

            {/* Step 2 */}
            <div className="bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-2xl p-6 text-white">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-6 h-6 rounded-full border-2 border-white flex items-center justify-center">
                  <Check className="w-4 h-4" />
                </div>
                <p className="font-semibold">STEP 2</p>
              </div>
              <h3 className="text-xl font-bold mb-3">
                Elevate.Social was created
              </h3>
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
            <div className="bg-gradient-to-br from-indigo-600 to-purple-600 rounded-2xl p-6 text-white">
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
          <div className="relative max-w-4xl mx-auto">
            <div className="relative">
              {/* Main circular image placeholder */}
              <div className="w-full aspect-video bg-gradient-to-br from-purple-100 to-indigo-100 rounded-3xl overflow-hidden relative">
                {/* Centered person image - you can replace this with actual image */}
                <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-80 h-80 bg-gradient-to-br from-gray-300 to-gray-400 rounded-full">
                  {/* Placeholder for person image */}
                </div>

                {/* Floating elements */}
                {/* MRR Card - Top Left */}
                <div className="absolute top-12 left-12 bg-white rounded-xl shadow-lg p-4 w-32">
                  <p className="text-xs text-gray-600 mb-1">MRR</p>
                  <p className="text-2xl font-bold text-indigo-600">$24,997</p>
                </div>

                {/* Revenue Graph - Bottom Right */}
                <div className="absolute bottom-12 right-12 bg-white rounded-xl shadow-lg p-4 w-36">
                  <p className="text-xl font-bold text-gray-900 mb-2">
                    $10,254
                  </p>
                  <div className="h-12 flex items-end gap-1">
                    <div className="flex-1 bg-indigo-200 h-6 rounded-sm" />
                    <div className="flex-1 bg-indigo-300 h-8 rounded-sm" />
                    <div className="flex-1 bg-indigo-400 h-10 rounded-sm" />
                    <div className="flex-1 bg-indigo-500 h-12 rounded-sm" />
                    <div className="flex-1 bg-indigo-600 h-10 rounded-sm" />
                  </div>
                </div>

                {/* Social Media Icons */}
                {/* Facebook - Left */}
                <div className="absolute bottom-24 left-24 w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center shadow-lg">
                  <span className="text-white text-2xl">f</span>
                </div>

                {/* Instagram - Right */}
                <div className="absolute top-1/2 right-16 w-12 h-12 bg-gradient-to-br from-purple-500 via-pink-500 to-orange-500 rounded-full flex items-center justify-center shadow-lg">
                  <svg
                    className="w-6 h-6 text-white"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <rect
                      x="2"
                      y="2"
                      width="20"
                      height="20"
                      rx="5"
                      ry="5"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    />
                    <circle
                      cx="12"
                      cy="12"
                      r="4"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    />
                    <circle cx="17.5" cy="6.5" r="1.5" fill="currentColor" />
                  </svg>
                </div>

                {/* Target Icon - Bottom Left */}
                <div className="absolute bottom-16 left-32 w-10 h-10 bg-purple-600 rounded-full flex items-center justify-center shadow-lg">
                  <div className="w-3 h-3 rounded-full border-2 border-white" />
                </div>

                {/* GoHighLevel Icon - Top */}
                <div className="absolute top-8 right-1/3 w-12 h-12 bg-indigo-600 rounded-lg flex items-center justify-center shadow-lg transform rotate-12">
                  <span className="text-white font-bold text-xs">GHL</span>
                </div>

                {/* Additional Icon - Top Right */}
                <div className="absolute top-12 right-20 w-10 h-10 bg-purple-500 rounded-full flex items-center justify-center shadow-lg">
                  <span className="text-white text-xs">⚙️</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Container>
  );
};

export default WhyIBuilt;
