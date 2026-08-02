import Image from 'next/image';

const brands = [
  { name: 'BERGDORF GOODMAN', logo: '/brands/bergdorf-goodman.png' },
  { name: 'REVOLVE', logo: '/brands/revolve.png' },
  { name: 'WAYFAIR', logo: '/brands/wayfair.png' },
  { name: 'SEPHORA', logo: '/brands/sephora.png' },
  { name: 'THE BAR', logo: '/brands/the-bar.png' },
  { name: 'Abercrombie & Fitch', logo: '/brands/abercrombie-fitch.png' },
  { name: 'TARGET', logo: '/brands/target.png' },
  { name: 'GUCCI', logo: '/brands/gucci.png' },
  { name: 'dibs.', logo: '/brands/dibs.png' },
  { name: 'TECOVAS', logo: '/brands/tecovas.png' },
  { name: 'ARITZIA', logo: '/brands/aritzia.png' },
  { name: 'ANTHROPOLOGIE', logo: '/brands/anthropologie.png' },
  // Infinite smooth scroll ke liye duplicate kar rahe hain (CSS animation mein loop ke liye)
  // Real mein 2-3 baar repeat kar dena ya length badha dena
];

// Duplicate list for seamless infinite scroll
const duplicatedBrands = [...brands, ...brands, ...brands];

export default function BrandLogosSection() {
  return (
    <section className="py-12 md:py-20 bg-white overflow-hidden">
      <div className="container mx-auto px-6 text-center">
        <h2 className="text-2xl md:text-4xl font-bold tracking-tight mb-10 text-gray-900">
          Search products from iconic and emerging brands
        </h2>

        {/* Marquee / Auto-scrolling circles */}
        <div className="relative">
          <div className="flex animate-marquee whitespace-nowrap">
            {duplicatedBrands.map((brand, index) => (
              <div
                key={`${brand.name}-${index}`}
                className="flex-shrink-0 mx-6 md:mx-10"
              >
                <div className="w-20 h-20 md:w-28 md:h-28 rounded-full overflow-hidden bg-gray-50 border border-gray-200 shadow-sm flex items-center justify-center transition-all duration-300 hover:scale-110 hover:shadow-md">
                  <Image
                    src={brand.logo}
                    alt={`${brand.name} logo`}
                    width={80}
                    height={80}
                    className="object-contain p-3"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}