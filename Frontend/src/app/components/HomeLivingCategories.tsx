// src/components/HomeLivingCategories.tsx  (ya app/components/)

const categories = [
  { name: "Bedroom", icon: "🛏️" },     // ya real SVG path
  { name: "Kitchen", icon: "🍳" },
  { name: "Lamp", icon: "💡" },
  { name: "Home Accessories", icon: "🖼️" },
  { name: "Chest", icon: "🗄️" },       // chest of drawers
  { name: "Closet", icon: "👗" },      // wardrobe
  { name: "Sofa", icon: "🛋️" },        // bed sofa / couch
  { name: "More", icon: "⋯" },
];

export default function HomeLivingCategories() {
  return (
    <section className="py-10 md:py-16 bg-gradient-to-b from-purple-950 to-purple-900 text-white">
      <div className="container mx-auto px-4">
        <h2 className="text-3xl md:text-4xl font-bold text-center mb-10 tracking-wide uppercase">
          HOME LIVING
        </h2>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-6 md:gap-8">
          {categories.map((cat, index) => (
            <div
              key={cat.name}
              className="flex flex-col items-center justify-center bg-purple-800/60 backdrop-blur-sm rounded-2xl p-6 md:p-8 aspect-square hover:bg-purple-700/80 transition-all duration-300 cursor-pointer shadow-lg hover:shadow-xl group"
            >
              {/* Icon – emoji simple hai, real app mein SVG ya lucide-react icons use karo */}
              <div className="text-5xl md:text-7xl mb-4 group-hover:scale-110 transition-transform">
                {cat.icon}
              </div>
              <span className="text-sm md:text-base font-medium text-center">
                {cat.name}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}