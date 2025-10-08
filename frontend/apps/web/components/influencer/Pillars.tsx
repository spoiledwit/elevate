import React from "react";
import Container from "../common/Container";

const Pillars = () => {
  const pillars = [
    {
      letter: "A",
      title: "Automation",
      description:
        "Your custom AI Copilot, autoresponders, DFY email campaigns, social scheduler—systems that work for you 24/7.",
    },
    {
      letter: "B",
      title: "Business",
      description:
        "Problem → people → profit. Offers, marketing, branding, and sales made simple and repeatable. Your all-in-one custom affiliate business.",
    },
    {
      letter: "C",
      title: "Community",
      description:
        "Monetize your community in a sustainable way.  We believe in serve and you will be served. We set you and your affiliates up to win, day 1.",
    },
  ];

  return (
    <div className="bg-[#F5F3EF]">
      <Container>
        {/* Header */}
        <h2 className="text-4xl font-bold text-black mb-12">
          The 3 Pillars of Elevate
        </h2>

        {/* 3 Pillar Cards */}
        <div className="grid md:grid-cols-3 gap-6">
          {pillars.map((pillar, index) => (
            <div
              key={index}
              className="bg-white rounded-2xl p-8 shadow-xl border border-gray-200 hover:shadow-md transition-shadow duration-200"
            >
              <h3 className="text-brand font-bold text-lg mb-4">
                {pillar.letter} — {pillar.title}
              </h3>
              <p className="text-gray-900 text-base leading-relaxed">
                {pillar.description}
              </p>
            </div>
          ))}
        </div>
      </Container>
    </div>
  );
};

export default Pillars;
