import React from "react";
import Container from "../common/Container";

const WhatYouGet = () => {
  const features = [
    {
      title: "DFY Duplicatable Website + Storefront",
      description:
        "Ready for affiliates to plug in and promote your freebie and offers.\nCustom email autoresponders set up for you so your affiliates can nurture leads with ease.",
    },
    {
      title: "Content & Scripts",
      description:
        "Graphics and prompts so even beginners can post with confidence... all tailored to your voice and offer.",
    },
    {
      title: "AI-Powered Tools",
      description:
        "Automated posting that removes the guesswork. Affiliates can sell with ease and finally escape content-burnout.",
    },
    {
      title: "One Central Hub",
      description:
        "Everything affiliates need—and nothing they don't. Your own built-for-you affiliate business removing the guesswork for affiliates, and giving you quicker wins.",
    },
    {
      title: "Community Support",
      description:
        "Built for leaders who want their people to win. No more bouncing around platforms, piecing tools and assets together to start promoting.",
    },
    {
      title: "White-Glove Solutions",
      description:
        "Custom frameworks for high-impact influencers. We customize everything and set it up for you. Migratation also available.",
    },
  ];

  return (
    <Container className="bg-[#F5F3EF]">
      {/* Header */}
      <h2 className="text-4xl font-bold text-black mb-12">
        What You Get With Elevate.Social
      </h2>

      {/* Feature Cards Grid - 3 Columns x 2 Rows */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {features.map((feature, index) => (
          <div
            key={index}
            className="bg-white rounded-2xl p-8 shadow-xl border border-gray-200 hover:shadow-md transition-shadow duration-200"
          >
            <h3 className="text-brand font-bold text-lg mb-4">
              {feature.title}
            </h3>
            <p className="text-gray-800 text-base leading-relaxed whitespace-pre-line">
              {feature.description}
            </p>
          </div>
        ))}
      </div>
    </Container>
  );
};

export default WhatYouGet;
