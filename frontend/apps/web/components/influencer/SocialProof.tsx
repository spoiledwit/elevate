import React from "react";
import Container from "../common/Container";
import { Star } from "lucide-react";

const SocialProof = () => {
  const testimonials = [
    {
      stars: 5,
      quote: "Plugged in on Monday. Site live Tuesday. First $150 on Friday.",
      name: "Sarah M.",
      role: "Digital Marketing Consultant",
      avatar: "/p1.jpg",
    },
    {
      stars: 5,
      quote:
        "Automation + coaching removed the guesswork. Recurring revenue stacked fast.",
      name: "Daniel K.",
      role: "Online Business Owner",
      avatar: "/p2.jpg",
    },
    {
      stars: 5,
      quote: "Finally a system that's simple, supportive, and sustainable.",
      name: "Mia R.",
      role: "Purpose-driven Entrepreneur",
      avatar: "/p3.jpg",
    },
  ];

  const stats = [
    {
      value: "500+",
      label: "Active Members",
    },
    {
      value: "$2.1M+",
      label: "Member Earnings",
    },
    {
      value: "24/7",
      label: "Support Available",
    },
    {
      value: "4.9/5",
      label: "Member Rating",
    },
  ];

  return (
    <Container>
      {/* Header */}
      <div className="text-center mb-16">
        <h2 className="text-4xl md:text-5xl font-bold mb-4">
          Real People. <span className="text-brand">Real Results.</span>
        </h2>
        <p className="text-gray-600 text-base max-w-2xl mx-auto">
          Join thousands who have transformed their income and impact with the
          Elevate system.
        </p>
      </div>

      {/* Testimonials */}
      <div className="grid md:grid-cols-3 gap-6 mb-16">
        {testimonials.map((testimonial, index) => (
          <div
            key={index}
            className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100"
          >
            {/* Stars */}
            <div className="flex gap-1 mb-4">
              {[...Array(testimonial.stars)].map((_, i) => (
                <Star key={i} className="w-4 h-4 fill-brand text-brand" />
              ))}
            </div>

            {/* Quote */}
            <p className="text-gray-800 text-sm leading-relaxed mb-6">
              "{testimonial.quote}"
            </p>

            {/* Author */}
            <div className="flex items-center gap-3">
              <img
                src={testimonial.avatar}
                alt={testimonial.name}
                className="w-10 h-10 rounded-full object-cover"
              />
              <div>
                <p className="text-sm font-semibold text-gray-900">
                  {testimonial.name}
                </p>
                <p className="text-xs text-gray-600">{testimonial.role}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
        {stats.map((stat, index) => (
          <div key={index} className="text-center">
            <p className="text-3xl md:text-4xl font-bold text-brand mb-2">
              {stat.value}
            </p>
            <p className="text-sm text-gray-600">{stat.label}</p>
          </div>
        ))}
      </div>
    </Container>
  );
};

export default SocialProof;
