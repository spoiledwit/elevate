export function PricingPlans() {
  const plans = [
    {
      name: "Free Me",
      price: "$0",
      period: "per month",
      billing: "billed yearly",
      buttonStyle: "bg-black text-white",
      popular: false,
      features: [
        "Custom Storefront Builder",
        "Embedded Video + Banner CTAs"
      ]
    },
    {
      name: "Champion",
      price: "$19.99",
      period: "per month",
      billing: "billed yearly",
      buttonStyle: "bg-purple-500 text-white",
      popular: true,
      features: [
        "Custom Storefront Builder",
        "Content Scheduler + Auto-Posting",
        "Canva / Google Drive Integration",
        "AI Content Assistant (Basic)",
        "Embedded Video + Banner CTAs",
        "Link Performance Insights"
      ]
    },
    {
      name: "Elite Pro",
      price: "$29.99",
      period: "per month",
      billing: "billed yearly",
      buttonStyle: "bg-black text-white hover:bg-gray-800",
      popular: false,
      features: [
        "Custom Storefront Builder",
        "Content Scheduler + Auto-Posting",
        "Canva / Google Drive Integration",
        "AI Content Assistant (Basic)",
        "Comment Trigger + DM Automation",
        "Custom GPT Library Access",
        "Embedded Video + Banner CTAs",
        "Link Performance Insights",
        "Link Heatmap"
      ]
    }
  ]

  return (
    <section className="pb-20 px-8">
      <div className="max-w-6xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {plans.map((plan, index) => (
            <div key={plan.name} className="relative">
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 z-10">
                  <span className="bg-purple-500 text-white px-4 py-1 rounded-full text-sm font-medium">
                    Popular
                  </span>
                </div>
              )}

              <div className={`bg-white rounded-3xl border border-gray-600 p-8 h-full flex flex-col`}>
                <div className="mb-6">
                  <h3 className="text-2xl font-bold text-black mb-4">{plan.name}</h3>

                  <div className="flex items-baseline mb-2">
                    <span className="text-5xl font-bold text-black">{plan.price}</span>
                    <span className="ml-2 text-gray-600">{plan.period}</span>
                  </div>

                  <p className="text-gray-600 text-sm">{plan.billing}</p>
                </div>

                <button className={`w-full py-3 rounded-lg font-semibold text-lg mb-8 ${plan.buttonStyle}`}>
                  Get Started
                </button>

                <div className="flex-1">
                  <h4 className="text-lg font-semibold text-black mb-6">Includes</h4>

                  <ul className="space-y-4">
                    {plan.features.map((feature, featureIndex) => (
                      <li key={featureIndex} className="flex items-start gap-3">
                        <svg
                          className={`w-5 h-5 ${plan.popular ? 'text-purple-900' : 'text-gray-500'} mt-0.5 flex-shrink-0`}
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path
                            fillRule="evenodd"
                            d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                            clipRule="evenodd"
                          />
                        </svg>
                        <span className={`text-sm ${plan.popular ? 'text-purple-900' : 'text-gray-700'} leading-relaxed`}>
                          {feature}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}