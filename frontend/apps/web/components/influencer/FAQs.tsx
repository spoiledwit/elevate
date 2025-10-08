"use client";

import React, { useState } from "react";
import Container from "../common/Container";
import { Plus, Minus } from "lucide-react";

const FAQs = () => {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const faqs = [
    {
      question: "How fast can I launch?",
      answer:
        "Most members personalize and go live Day 1. Your branded website, email campaigns, and social storefront are pre-built and ready to customize.",
    },
    {
      question: "Is income guaranteed?",
      answer:
        "While we provide all the tools and systems for success, income depends on your effort and implementation. Many members see results within the first week.",
    },
    {
      question: "Do I need tech skills?",
      answer:
        "No technical skills required! Everything is pre-built and ready to use. We provide step-by-step guidance and 24/7 support to help you every step of the way.",
    },
    {
      question: "How do webinars work?",
      answer:
        "We host regular training webinars and workshops to help you maximize your results. All sessions are recorded so you can watch at your convenience.",
    },
    {
      question: "What's the payout structure?",
      answer:
        "You earn commissions on every sale and affiliate signup. Payouts are processed monthly, with full transparency through your dashboard analytics.",
    },
    {
      question: "What support do I get?",
      answer:
        "You get 24/7 live support, access to our private community, regular training webinars, and personalized assistance with your storefront and campaigns.",
    },
  ];

  const toggleFAQ = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <div className="bg-gradient-to-b from-[#F9FAFB] to-[#FFFFFF]">
      <Container>
        {/* Header */}
        <div className="text-center mb-12">
          <h2 className="text-4xl md:text-5xl font-bold text-black mb-4">
            Questions, <span className="text-brand">Answered.</span>
          </h2>
          <p className="text-gray-600 text-base">
            Everything you need to know about joining the Elevate social.
          </p>
        </div>

        {/* FAQ Accordion */}
        <div className="space-y-4">
          {faqs.map((faq, index) => (
            <div
              key={index}
              className="border border-gray-200 rounded-lg overflow-hidden"
            >
              {/* Question Header */}
              <button
                onClick={() => toggleFAQ(index)}
                className="w-full flex items-center justify-between p-5 text-left hover:bg-gray-50 transition-colors duration-200"
              >
                <span className="text-brand font-semibold text-base">
                  {faq.question}
                </span>
                <div className="flex-shrink-0 ml-4">
                  {openIndex === index ? (
                    <Minus className="w-5 h-5 text-brand" />
                  ) : (
                    <Plus className="w-5 h-5 text-brand" />
                  )}
                </div>
              </button>

              {/* Answer Content */}
              {openIndex === index && (
                <div className="px-5 pb-5 pt-2">
                  <p className="text-gray-700 text-sm leading-relaxed">
                    {faq.answer}
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Contact Support */}
        <div className="text-center mt-12">
          <p className="text-gray-600 text-sm mb-3">Still have questions?</p>
          <a
            href="#contact"
            className="text-brand font-semibold text-sm hover:text-indigo-700 transition-colors duration-200"
          >
            Contact our support team
          </a>
        </div>
      </Container>
    </div>
  );
};

export default FAQs;
