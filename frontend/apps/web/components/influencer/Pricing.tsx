import React from "react";
import Container from "../common/Container";
import { Check, Shield } from "lucide-react";

const Pricing = () => {
  const plans = [
    {
      badge: "Most Popular",
      name: "HTP Elevate",
      price: "$997",
      period: "/mo",
      description:
        "customized social storefront, clone sites, voice, and offer; 24/7 support and storefront management",
      features: [
        "Branded website live week 1",
        "custom storefront preloaded with your offers",
        "custom trained ai and prompts for your affiliates",
        "your branded Private community and course access",
        "priority support and edits as needed",
        "$30 per affiliate elevate social store signup",
      ],
      buttonText: "LAUNCH MY BFY AFFILIATE BUSINESS",
      buttonColor: "bg-brand hover:bg-indigo-700",
      highlighted: true,
    },
    {
      name: "Elevate social storefront",
      price: "$97",
      period: "/month",
      description:
        "plug-n-play automation tools including social storefront, AI copilot, and content management system.",
      features: [
        "Social media storefront & pre-loaded content",
        "Auto-DM & comment automation",
        "Content writer, poster, & scheduler",
        "milo AI Copilot assistance",
        "Advanced analytics",
        "Priority support",
      ],
      buttonText: "ADD DFY SYSTEM",
      buttonColor: "bg-brand hover:bg-indigo-700",
      highlighted: false,
    },
    {
      name: "Affiliate Option",
      price: "$0",
      period: "+ $15/mo",
      description:
        "your branded social storefront, share or sell your offers. no automation, AI, or social tools included.",
      features: [
        "$30 per affiliate signup",
        "list your socials, welcome video, and offers",
        "Basic support included",
        "Commission tracking",
        "45 transaction fee from each sale",
        "Monthly commission payouts from referrals",
      ],
      buttonText: "START AS AFFILIATE",
      buttonColor: "bg-brand hover:bg-indigo-700",
      highlighted: false,
    },
  ];

  return (
    <Container>
      {/* Header */}
      <div className="text-center mb-12 px-4">
        <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-black mb-4">
          Choose Your <span className="text-brand">Path to Prosper</span>
        </h2>
        <p className="text-gray-600 text-sm sm:text-base max-w-3xl mx-auto">
          Whether you're ready to dive in completely or want to start earning
          immediately, we have the perfect option for you.
        </p>
      </div>

      {/* Pricing Cards */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
        {plans.map((plan, index) => (
          <div
            key={index}
            className={`bg-white rounded-2xl p-8 shadow-sm border ${
              plan.highlighted
                ? "border-indigo-300 shadow-lg"
                : "border-gray-200"
            } relative`}
          >
            {/* Badge */}
            {plan.badge && (
              <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                <span className="bg-brand text-white text-xs font-semibold px-4 py-1.5 rounded-full">
                  {plan.badge}
                </span>
              </div>
            )}

            {/* Plan Name */}
            <h3 className="text-brand text-lg font-bold mb-4 text-center mt-2">
              {plan.name}
            </h3>

            {/* Price */}
            <div className="text-center mb-4">
              <span className="text-5xl font-bold text-black">
                {plan.price}
              </span>
              <span className="text-gray-600 text-sm ml-1">{plan.period}</span>
            </div>

            {/* Description */}
            <p className="text-gray-700 text-xs text-center mb-6 leading-relaxed min-h-[60px]">
              {plan.description}
            </p>

            {/* Features */}
            <ul className="space-y-3 mb-8">
              {plan.features.map((feature, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <div className="bg-brand rounded-full w-5 h-5 flex items-center justify-center">
                    <Check className="w-3 h-3 text-white flex-shrink-0 mt-0.5" />
                  </div>
                  <span className="text-gray-800 text-xs leading-relaxed">
                    {feature}
                  </span>
                </li>
              ))}
            </ul>

            {/* Button */}
            <button
              className={`w-full ${plan.buttonColor} text-white font-bold text-sm py-4 rounded-full transition-colors duration-200`}
            >
              {plan.buttonText}
            </button>
          </div>
        ))}
      </div>

      {/* Money-Back Guarantee */}
      <div className="bg-white rounded-2xl p-8 shadow-xl border border-gray-200 max-w-2xl mx-auto text-center">
        <div className="flex justify-center mb-4">
          <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
            <Shield className="w-6 h-6 text-red-500" />
          </div>
        </div>
        <h3 className="text-xl font-bold text-black mb-3">
          30-Day Money-Back Guarantee
        </h3>
        <p className="text-gray-600 text-sm leading-relaxed">
          We're confident in the Elevate system. If you're not completely
          satisfied within 30 days, we'll refund your personal investment—no
          questions asked.
        </p>
      </div>
    </Container>
  );
};

export default Pricing;
