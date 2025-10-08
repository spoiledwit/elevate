import React from "react";
import Container from "../common/Container";

const Recipe = () => {
  const steps = [
    {
      number: "1",
      title: "Purchase",
      description:
        "Setup your BFY affiliate business: custom duplicatable affiliate website live Week 1. Migration available",
    },
    {
      number: "2",
      title: "Plug In",
      description:
        "your affiliates get their own social storefront loaded with your freebies, offers, and automated email nurture sequences.",
    },
    {
      number: "3",
      title: "Prosper",
      description:
        "Earn $30 per custom affiliate social storefront. Watch your monthly recurring income compound as your community grows and sells and scales.",
    },
  ];

  return (
    <Container>
      {/* Header */}
      <h2 className="text-3xl md:text-4xl font-bold text-black mb-12">
        Your Simple 1-2-3 Path to Prosper
      </h2>

      {/* Steps Grid */}
      <div className="grid md:grid-cols-3 gap-6">
        {steps.map((step, index) => (
          <div
            key={index}
            className="bg-[#F5F3EF] rounded-2xl p-6 border border-gray-200"
          >
            {/* Step Number and Title */}
            <div className="mb-4">
              <span className="text-brand font-bold text-sm">
                {step.number}) {step.title}
              </span>
            </div>

            {/* Description */}
            <p className="text-gray-700 text-sm leading-relaxed">
              {step.description}
            </p>
          </div>
        ))}
      </div>
    </Container>
  );
};

export default Recipe;
