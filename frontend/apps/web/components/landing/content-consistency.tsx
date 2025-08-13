import img from "@/assets/ken1.png";

export function ContentConsistency() {
  return (
    <section className="py-20 px-8">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div>
            <h2 className="text-[40px] font-bold text-black mb-6 leading-tight">
              Content without consistency doesn't convert.
            </h2>

            <p className="text-black text-xl font-medium">
              Most creators struggle to show up consistently — not because they lack content, but because they're stuck bouncing between apps, platforms, and tools that don't talk to each other. Now you can create, schedule, link, automate, and track — all in one place.
            </p>
          </div>

          <div className="relative">
            <img
              src={img.src}
              alt="Content creators collaborating"
              className="w-full  object-cover rounded-2xl"
            />
          </div>
        </div>
      </div>
    </section>
  )
}