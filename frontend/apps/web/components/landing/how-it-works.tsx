import step1 from '@/assets/steps/step1.svg'
import step2 from '@/assets/steps/step2.svg'
import step3 from '@/assets/steps/step3.svg'

export function HowItWorks() {
  const steps = [
    {
      id: 1,
      stepNumber: "Step 1",
      title: "Set up your Elevate Social page",
      description: "",
      image: step1.src
    },
    {
      id: 2,
      stepNumber: "Step 2",
      title: "Plan and schedule content",
      description: "",
      image: step2.src
    },
    {
      id: 3,
      stepNumber: "Step 3",
      title: "Automate replies and track growth.",
      description: "",
      image: step3.src
    }
  ]

  return (
    <section className="py-12 sm:py-16 lg:py-20 px-4 sm:px-6 lg:px-8 bg-gray-50">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-10 sm:mb-12 lg:mb-16">
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-black mb-4 sm:mb-6">
            How it Works
          </h2>
          <p className="text-base sm:text-lg text-black max-w-lg mx-auto">
            Streamline your workflow with strategy, automation, and tools that help you grow.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
          {steps.map((step) => (
            <div key={step.id} className="bg-white rounded-3xl p-6 sm:p-8 border border-gray-400">
              <div className="mb-4 sm:mb-6">
                <span className="font-semibold text-base sm:text-lg" style={{color: '#714efe'}}>
                  {step.stepNumber}
                </span>
                <h3 className="text-lg sm:text-xl font-bold text-black mt-2 mb-3 sm:mb-4">
                  {step.title}
                </h3>
              </div>

              <div className="flex justify-center mb-4 sm:mb-6">
                <img
                  src={step.image}
                  alt={step.title}
                  className="w-full max-w-xs sm:max-w-sm h-48 sm:h-56 lg:h-64 object-contain"
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}