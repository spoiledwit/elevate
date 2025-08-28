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
    <section className="pb-12 sm:pb-16 lg:pb-20">
      {features.map((feature, index) => (
        <div key={feature.id} className={`py-8 sm:py-12 lg:py-16 ${index === 0 ? 'pt-0' : ''}`}>
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
            {feature.title && (
              <h2 className="text-2xl sm:text-3xl lg:text-4xl xl:text-[40px] font-bold text-center mb-8 sm:mb-12 lg:mb-16 text-black">
                {feature.title}
              </h2>
            )}

            <div className={`grid grid-cols-1 lg:grid-cols-2 gap-8 sm:gap-10 lg:gap-12 items-center ${feature.imagePosition === 'left' ? 'lg:flex-row-reverse' : ''
              }`}>
              {feature.imagePosition === 'right' ? (
                <>
                  <div className="text-center lg:text-left order-2 lg:order-1">
                    <div className="w-12 h-12 sm:w-14 sm:h-14 lg:w-16 lg:h-16 mb-4 sm:mb-6 mx-auto lg:mx-0">
                      <img src={feature.icon} alt="" className="w-full h-full object-contain" />
                    </div>
                    <h3 className="text-xl sm:text-2xl lg:text-3xl font-bold text-black mb-3 sm:mb-4">
                      {feature.subtitle}
                    </h3>
                    <p className="text-black text-sm sm:text-base lg:text-lg font-medium leading-relaxed max-w-2xl mx-auto lg:mx-0">
                      {feature.description}
                    </p>
                  </div>
                  <div className="relative order-1 lg:order-2">
                    <img
                      src={feature.image}
                      alt={feature.subtitle}
                      className="w-full h-64 sm:h-80 lg:h-[28rem] object-contain mx-auto"
                    />
                  </div>
                </>
              ) : (
                <>
                  <div className="relative order-1">
                    <img
                      src={feature.image}
                      alt={feature.subtitle}
                      className="w-full h-64 sm:h-80 lg:h-[28rem] object-contain mx-auto"
                    />
                  </div>
                  <div className="text-center lg:text-left order-2">
                    <div className="w-12 h-12 sm:w-14 sm:h-14 lg:w-16 lg:h-16 mb-4 sm:mb-6 mx-auto lg:mx-0">
                      <img src={feature.icon} alt="" className="w-full h-full object-contain" />
                    </div>
                    <h3 className="text-xl sm:text-2xl lg:text-3xl font-bold text-black mb-3 sm:mb-4">
                      {feature.subtitle}
                    </h3>
                    <p className="text-black text-sm sm:text-base lg:text-lg font-medium leading-relaxed max-w-2xl mx-auto lg:mx-0">
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