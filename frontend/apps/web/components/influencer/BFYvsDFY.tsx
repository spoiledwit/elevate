import React from "react";
import Container from "../common/Container";

const BFYvsDFY = () => {
  const doneForYouIssues = [
    "Sets unrealistic 'set-and-forget' expectations",
    "Leaves you confused when things need adjustment",
    "No understanding of how to scale or improve",
    "Limited support when you need help most",
  ];

  const builtForYouBenefits = [
    "Branded affiliate website live on Day 1",
    "Pre-loaded email campaigns that convert",
    "pre-loaded Social storefront & custom content scheduler",
    "24/7 live support",
  ];

  return (
    <Container>
      {/* Header */}
      <div className="text-center mb-12">
        <h2 className="text-4xl md:text-5xl font-bold text-black mb-4">
          Why <span className="text-brand">Built-For-You</span> Beats
          Done-For-You
        </h2>
        <p className="text-gray-600 text-base max-w-3xl mx-auto">
          We don't just hand you tools and disappear. We build with you, teach
          you, and support you every step.
        </p>
      </div>

      {/* Comparison Section */}
      <div className="grid lg:grid-cols-2 gap-8 mb-12">
        {/* Done-For-You - Left Side (Issues) */}
        <div className="bg-white rounded-2xl p-8 border-2 border-red-200 relative">
          <div className="absolute top-0 -translate-y-1/2 left-10 inline-block bg-red-500 text-white text-xs font-semibold px-4 py-2 rounded-full mb-6">
            ❌ Done-For-You
          </div>
          <ul className="space-y-4">
            {doneForYouIssues.map((issue, index) => (
              <li key={index} className="flex items-start gap-3">
                <span className="text-red-500 mt-1 flex-shrink-0">●</span>
                <span className="text-gray-800 text-sm leading-relaxed">
                  {issue}
                </span>
              </li>
            ))}
          </ul>
        </div>

        {/* Built-For-You - Right Side (Benefits) */}
        <div className="bg-brand rounded-2xl p-8 text-white relative shadow-xl">
          <div className="absolute top-0 -translate-y-1/2 left-10 inline-block bg-white text-brand text-xs font-semibold px-4 py-2 rounded-full mb-6">
            ✅ Built-For-You
          </div>
          <ul className="space-y-4">
            {builtForYouBenefits.map((benefit, index) => (
              <li key={index} className="flex items-start gap-3">
                <span className="text-white mt-1 flex-shrink-0">●</span>
                <span className="text-white text-sm leading-relaxed">
                  {benefit}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* The BFY Advantage - Bottom Box */}
      <div className="bg-white rounded-2xl p-8 border border-gray-200 max-w-2xl mx-auto shadow-xl">
        <h3 className="text-2xl font-bold text-brand text-center mb-4">
          The BFY Advantage
        </h3>
        <p className="text-gray-700 text-sm leading-relaxed text-center max-w-4xl mx-auto">
          Think of it like a recipe: we prep the ingredients, set the kitchen,
          and cook alongside you. The result? A business you understand, can
          repeat, and can confidently scale... and bring impact to your
          affiliates like never before.
        </p>
      </div>
    </Container>
  );
};

export default BFYvsDFY;
