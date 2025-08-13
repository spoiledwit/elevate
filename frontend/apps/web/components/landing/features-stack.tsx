import phoneimg from "@/assets/hand.svg";
import calender from "@/assets/calender.svg";
import insta from "@/assets/insta.png";
import laptop from "@/assets/laptop.png";
import last from "@/assets/last.svg";
import storefrontIcon from "@/assets/feature-stack-icons/storefront.svg";
import schedulerIcon from "@/assets/feature-stack-icons/content-scheduler.svg";
import aiIcon from "@/assets/feature-stack-icons/ai.svg";
import triggerIcon from "@/assets/feature-stack-icons/trigger.svg";
import insightsIcon from "@/assets/feature-stack-icons/insights.svg";

export function FeaturesStack() {
  const features = [
    {
      id: 1,
      title: "What's Inside elevate.social",
      subtitle: "Smart, Customizable Storefront",
      description: "Build a personal, public-facing hub with a unique URL, bio, and social icons to add up to 10 CTA buttons for high conversions. You can also embed a welcome or promo video.",
      image: phoneimg.src,
      icon: storefrontIcon.src,
      imagePosition: "right"
    },
    {
      id: 2,
      title: "",
      subtitle: "Automated Content Scheduler",
      description: "Plan and auto-post content with a visual calendar that integrates with Canva and Google Drive. Supported platforms include TikTok, Instagram, Facebook, and more.",
      image: calender.src,
      icon: schedulerIcon.src,
      imagePosition: "left"
    },
    {
      id: 3,
      title: "",
      subtitle: "AI Content Assistant + GPT Library",
      description: "Get content that sounds like you and converts with a built-in GPT assistant and a library of custom-trained GPTs. This feature also includes voice-to-text content support.",
      image: laptop.src,
      icon: aiIcon.src,
      imagePosition: "right"
    },
    {
      id: 4,
      title: "",
      subtitle: "Comment Triggers + DM Automation",
      description: "Automatically send a custom DM with your link or message when a trigger word is detected in comments on IG, FB, and TikTok.",
      image: insta.src,
      icon: triggerIcon.src,
      imagePosition: "left"
    },
    {
      id: 5,
      title: "",
      subtitle: "Link & Button Performance Insights",
      description: "Track clicks, conversions, and page views to understand what's working. Daily and historical link insights and a heatmap are available on the Pro plan.",
      image: last.src,
      icon: insightsIcon.src,
      imagePosition: "right"
    }
  ]

  return (
    <section className="pb-20">
      {features.map((feature, index) => (
        <div key={feature.id} className={`py-4 ${index === 0 ? 'pt-0' : ''}`}>
          <div className="max-w-5xl mx-auto px-8">
            {feature.title && (
              <h2 className="text-[40px] font-bold text-center mb-16 text-black">
                {feature.title}
              </h2>
            )}

            <div className={`grid grid-cols-1 lg:grid-cols-2 gap-12 items-center ${feature.imagePosition === 'left' ? 'lg:flex-row-reverse' : ''
              }`}>
              {feature.imagePosition === 'right' ? (
                <>
                  <div>
                    <div className="w-16 h-16 mb-6">
                      <img src={feature.icon} alt="" className="w-full h-full object-contain" />
                    </div>
                    <h3 className="text-3xl font-bold text-black mb-4">
                      {feature.subtitle}
                    </h3>
                    <p className="text-black text-lg font-medium leading-relaxed">
                      {feature.description}
                    </p>
                  </div>
                  <div className="relative">
                    <img
                      src={feature.image}
                      alt={feature.subtitle}
                      className="w-full h-[28rem] object-contain"
                    />
                  </div>
                </>
              ) : (
                <>
                  <div className="relative">
                    <img
                      src={feature.image}
                      alt={feature.subtitle}
                      className="w-full h-[28rem] object-contain"
                    />
                  </div>
                  <div>
                    <div className="w-16 h-16 mb-6">
                      <img src={feature.icon} alt="" className="w-full h-full object-contain" />
                    </div>
                    <h3 className="text-3xl font-bold text-black mb-4">
                      {feature.subtitle}
                    </h3>
                    <p className="text-black text-lg font-medium leading-relaxed">
                      {feature.description}
                    </p>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      ))}
    </section>
  )
}