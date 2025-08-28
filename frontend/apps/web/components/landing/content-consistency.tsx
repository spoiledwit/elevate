import img from "@/assets/ken1.png";

export function ContentConsistency() {
  return (
    <section className="py-12 sm:py-16 lg:py-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 sm:gap-10 lg:gap-12 items-center">
          <div className="text-center lg:text-left">
            <h2 className="text-2xl sm:text-3xl lg:text-4xl xl:text-[40px] font-bold text-black mb-4 sm:mb-6 leading-tight">
              Content without consistency doesn't convert.
            </h2>

            <p className="text-black text-base sm:text-lg lg:text-xl font-medium max-w-2xl mx-auto lg:mx-0">
              Most creators struggle to show up consistently — not because they lack content, but because they're stuck bouncing between apps, platforms, and tools that don't talk to each other. Now you can create, schedule, link, automate, and track — all in one place.
            </p>
          </div>

          <div className="relative order-first lg:order-last">
            <img
              src={img.src}
              alt="Content creators collaborating"
              className="w-full object-cover rounded-2xl"
            />
          </div>
        </div>
      </div>
    </section>
  )
}