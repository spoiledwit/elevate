'use client'
import { useState } from 'react'
import { ChevronDown } from 'lucide-react'

const faqs = [
  {
    question: "What is Elevate Social?",
    answer: "Elevate Social is an all-in-one dashboard designed for content creators and digital marketers. It helps users manage their content scheduling, tracking, and linking in one place. With its customizable storefront and integrated tools, Elevate Social simplifies online presence management."
  },
  {
    question: "How does it work?",
    answer: "Elevate Social features a drag-and-drop content scheduler that allows users to plan their posts across multiple platforms. It integrates seamlessly with popular tools like Canva and Google Drive. Additionally, the AI Content Assistant generates captions and hooks to enhance your content strategy."
  },
  {
    question: "What platforms does Elevate Social support?",
    answer: "Elevate Social supports all major social media platforms including Instagram, Twitter, Facebook, LinkedIn, TikTok, YouTube, and more. You can schedule and manage content across multiple platforms from one centralized dashboard."
  },
  {
    question: "Is there a free plan available?",
    answer: "Yes, Elevate Social offers a free plan that includes basic link-in-bio functionality, basic analytics, and limited customization options. You can upgrade to Pro for advanced features and unlimited access."
  },
  {
    question: "How much does the Pro plan cost?",
    answer: "The Pro plan is available for $34.99/month and includes advanced analytics, unlimited customization, AI content assistance, priority support, and integration with premium tools."
  }
]

export function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(0)

  const toggleFAQ = (index: number) => {
    setOpenIndex(openIndex === index ? null : index)
  }

  return (
    <section className="py-12 sm:py-16 lg:py-20 px-4 sm:px-6 lg:px-8 bg-white" data-faq-section>
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-10 sm:mb-12 lg:mb-16">
          <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-black mb-4 sm:mb-6">
            FAQs
          </h2>
          <p className="text-gray-600 text-base sm:text-lg">
            Find answers to your questions about Elevate Social and how it can benefit you.
          </p>
        </div>

        <div className="space-y-3 sm:space-y-4">
          {faqs.map((faq, index) => (
            <div
              key={index}
              className="border border-gray-200 rounded-lg overflow-hidden transition-all duration-300 hover:shadow-md"
            >
              <div
                className="w-full px-4 sm:px-6 py-4 sm:py-6 text-left flex justify-between items-center cursor-pointer hover:bg-gray-50 transition-all duration-200"
                onClick={() => toggleFAQ(index)}
                role="tab"
                aria-expanded={openIndex === index}
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault()
                    toggleFAQ(index)
                  }
                }}
              >
                <span className="text-base sm:text-lg font-semibold text-black pr-4">
                  {faq.question}
                </span>
                <ChevronDown
                  className={`w-4 h-4 sm:w-5 sm:h-5 text-gray-500 transition-all duration-300 ease-in-out flex-shrink-0 ${openIndex === index ? 'rotate-180' : ''
                    }`}
                  style={openIndex === index ? { color: '#bea456' } : {}}
                />
              </div>

              <div
                className={`transition-all duration-300 ease-in-out overflow-hidden ${openIndex === index ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
                  }`}
              >
                <div className="px-4 sm:px-6 pb-4 sm:pb-6 border-t border-gray-200">
                  <div className="pt-3 sm:pt-4 transform transition-transform duration-300 ease-in-out">
                    <p className="text-gray-700 leading-relaxed text-sm sm:text-base">
                      {faq.answer}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}