'use client';

import { useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Camera, Search } from 'lucide-react';
import VisualSearchModal from './VisualSearchModal';
import { Tilt } from './motion/Tilt';
import { Reveal } from './motion/Reveal';
import { ShaderBackground, hexToShaderColor } from './ui/rds-silk';
import { useLanguage } from '@/providers/languageContext';
import { useTheme } from '@/providers/themeContext';
import { resolveShades } from '@/lib/colorPresets';

/* Dark → light ramp the silk shader mixes through. Deep shades keep the white
   headline readable; 400 supplies the light sheen that gives the fabric look. */
const HERO_SHADER_SHADES = ['950', '800', '600', '400'] as const;

export interface HeroItem {
  _id: string;
  image: string;
  link: string;
  title?: string;
  subtitle?: string;
  price?: string;
}

function useTypewriterPlaceholder(
  lines: string[],
  typingSpeed = 70,
  pauseAfterComplete = 2200
) {
  const [text, setText] = useState('');

  useEffect(() => {
    let lineIndex = 0;
    let charIndex = 0;
    let timeoutId: ReturnType<typeof setTimeout>;

    const typeNext = () => {
      const currentLine = lines[lineIndex];

      if (charIndex < currentLine.length) {
        charIndex += 1;
        setText(currentLine.slice(0, charIndex));
        timeoutId = setTimeout(typeNext, typingSpeed);
        return;
      }

      timeoutId = setTimeout(() => {
        lineIndex = (lineIndex + 1) % lines.length;
        charIndex = 0;
        setText('');
        timeoutId = setTimeout(typeNext, typingSpeed);
      }, pauseAfterComplete);
    };

    typeNext();
    return () => clearTimeout(timeoutId);
  }, [lines, typingSpeed, pauseAfterComplete]);

  return text;
}

/* Gemini-style AI sparkle badge shown inside the search bar */
function AiSparkIcon({ size = 26 }: { size?: number }) {
  return (
    <span
      className="flex items-center justify-center rounded-lg bg-gradient-to-br from-primary-500 to-primary-700 text-white shadow-soft-sm shrink-0"
      style={{ width: size, height: size }}
    >
      <svg
        viewBox="0 0 24 24"
        fill="currentColor"
        style={{ width: size * 0.65, height: size * 0.65 }}
      >
        <path d="M12 2a.75.75 0 0 1 .75.75c0 4.14 3.36 7.5 7.5 7.5a.75.75 0 0 1 0 1.5c-4.14 0-7.5 3.36-7.5 7.5a.75.75 0 0 1-1.5 0c0-4.14-3.36-7.5-7.5-7.5a.75.75 0 0 1 0-1.5c4.14 0 7.5-3.36 7.5-7.5A.75.75 0 0 1 12 2z" />
      </svg>
    </span>
  );
}

function CollageImage({
  item,
  fallback,
  alt,
  className,
}: {
  item?: HeroItem;
  fallback: string;
  alt: string;
  className?: string;
}) {
  const content = (
    <>
      <Image
        src={item?.image || fallback}
        alt={alt}
        fill
        className="object-cover group-hover:scale-105 transition-transform duration-700"
      />
    </>
  );

  const innerClasses = "relative group h-full w-full rounded-2xl overflow-hidden shadow-depth-3 block";

  if (item?.link) {
    return (
      <Tilt rotationFactor={6} className={`h-full w-full ${className || ''}`}>
        <a href={item.link} target="_blank" rel="noopener noreferrer" className={innerClasses}>
          {content}
        </a>
      </Tilt>
    );
  }
  return (
    <Tilt rotationFactor={6} className={`h-full w-full ${className || ''}`}>
      <div className={innerClasses}>{content}</div>
    </Tilt>
  );
}

export default function HomeHero({ items }: { items: HeroItem[] }) {
  const router = useRouter();
  const { t, tList } = useLanguage();
  const { theme, customHex } = useTheme();
  const [query, setQuery] = useState('');
  const [showVisualSearch, setShowVisualSearch] = useState(false);
  const searchLines = tList<string>('homeHero.searchLines');
  const animatedPlaceholder = useTypewriterPlaceholder(searchLines);

  // Follows the admin-configured primary color, so the hero restyles itself
  // whenever the theme changes (no WebGL rebuild — only the palette uniform).
  const shaderColors = useMemo(() => {
    const shades = resolveShades(theme, customHex);
    return HERO_SHADER_SHADES.map((shade) => hexToShaderColor(shades[shade]));
  }, [theme, customHex]);

  const handleSearch = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!query.trim()) return;
    router.push(`/${query.toLowerCase().trim().replace(/\s+/g, '-')}`);
    setQuery('');
  };

  return (
    <section className="relative w-full -mt-[var(--header-height)] bg-gradient-to-br from-primary-600 via-primary-700 to-primary-900">
      {/* Animated silk background. The gradient above stays as the fallback for
          browsers/devices without WebGL. */}
      <ShaderBackground
        colors={shaderColors}
        className="absolute inset-0 h-full w-full pointer-events-none"
      />
      {/* Legibility scrim — darkest on the headline side, barely there over the collage. */}
      <div
        aria-hidden="true"
        className="absolute inset-0 pointer-events-none bg-gradient-to-r from-black/25 via-black/10 to-black/5"
      />

      <div className="relative z-10 max-w-content mx-auto px-4 pt-[calc(var(--header-height)+2.5rem)] pb-16 md:pb-28">
        <div className="relative grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center">

          {/* LEFT: headline + AI search */}
          <div>
            <Reveal>
              <h1 className="text-3xl md:text-display font-display text-white">
                {t('homeHero.headline')}
              </h1>
              <p className="mt-3 text-white/90 text-base md:text-lg">
                {t('homeHero.subheadline')}
              </p>
            </Reveal>

            {/* AI search bar */}
            <form
              onSubmit={handleSearch}
              className="mt-7 flex items-center glass-panel-dark rounded-full shadow-depth-4 pl-4 pr-2 py-2"
            >
              <AiSparkIcon />
              <div className="relative flex-1 min-w-0 ml-3">
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  className="w-full bg-transparent border-none py-2 pr-2 text-sm md:text-base text-white caret-white outline-none focus:ring-0"
                  aria-label={t('homeHero.searchAriaLabel')}
                />
                {!query && (
                  <span className="pointer-events-none absolute left-0 top-1/2 -translate-y-1/2 text-sm md:text-base text-white truncate max-w-full">
                    {animatedPlaceholder}
                    <span className="animate-pulse">|</span>
                  </span>
                )}
              </div>
              <div className="relative shrink-0">
                <button
                  type="button"
                  onClick={() => setShowVisualSearch(true)}
                  className="group flex h-11 w-11 items-center justify-center rounded-full bg-primary-50 text-primary-600 ring-1 ring-primary-100 shadow-soft-sm transition-all duration-200 hover:bg-primary-600 hover:text-white hover:ring-primary-600 hover:shadow-soft-md hover:scale-105 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2"
                  title={t('homeHero.visualSearchTitle')}
                  aria-label={t('homeHero.visualSearchTitle')}
                >
                  <Camera size={20} className="transition-transform duration-200 group-hover:scale-110" />
                </button>

                {/* Elegant guiding arrow springing from the camera icon out to the collage (desktop only) */}
                <svg
                  viewBox="0 0 120 140"
                  aria-hidden="true"
                  className="pointer-events-none hidden lg:block absolute z-20 bottom-12 left-1/2 -translate-x-3 w-[100px]"
                >
                  <defs>
                    {/* White arrow with a soft primary highlight that sweeps along it */}
                    <linearGradient id="heroArrowGradient" x1="0" y1="1" x2="1" y2="0">
                      <stop offset="0%" stopColor="#ffffff" />
                      <stop offset="38%" stopColor="#ffffff" />
                      <stop offset="50%" stopColor="var(--primary-400)" />
                      <stop offset="62%" stopColor="#ffffff" />
                      <stop offset="100%" stopColor="#ffffff" />
                      <animateTransform
                        attributeName="gradientTransform"
                        type="translate"
                        values="-1 0; 1 0; -1 0"
                        dur="3.4s"
                        begin="1.1s"
                        repeatCount="indefinite"
                        calcMode="spline"
                        keySplines="0.45 0 0.55 1; 0.45 0 0.55 1"
                      />
                    </linearGradient>
                    {/* Soft glow to lift the arrow off the background */}
                    <filter id="heroArrowGlow" x="-30%" y="-30%" width="160%" height="160%">
                      <feDropShadow dx="0" dy="1.5" stdDeviation="1.6" floodColor="#000000" floodOpacity="0.2" />
                    </filter>
                  </defs>

                  <g filter="url(#heroArrowGlow)">
                    {/* Compact swoosh — rises from the camera and levels out in the gap before the collage */}
                    <path
                      d="M12 130 C -8 94, 8 66, 44 57 C 66 51, 82 50, 94 51"
                      fill="none"
                      stroke="url(#heroArrowGradient)"
                      strokeWidth="4.5"
                      strokeLinecap="round"
                      pathLength={1}
                      strokeDasharray={1}
                      strokeDashoffset={1}
                    >
                      <animate
                        attributeName="stroke-dashoffset"
                        from="1"
                        to="0"
                        dur="0.95s"
                        begin="0.25s"
                        calcMode="spline"
                        keySplines="0.33 0 0.15 1"
                        fill="freeze"
                      />
                    </path>

                    {/* Clean filled arrowhead pointing right toward the collage */}
                    <path
                      d="M112 51 L 90 40 L 92 63 Z"
                      fill="url(#heroArrowGradient)"
                      opacity={0}
                    >
                      <animate
                        attributeName="opacity"
                        from="0"
                        to="1"
                        dur="0.4s"
                        begin="1.05s"
                        calcMode="spline"
                        keySplines="0.33 0 0.15 1"
                        fill="freeze"
                      />
                    </path>
                  </g>
                </svg>
              </div>
              {/* <button
                type="submit"
                className="ml-1 h-10 w-10 md:h-12 md:w-auto md:min-w-[160px] md:px-9 md:py-3 rounded-full bg-primary-600 hover:bg-primary-700 text-white flex items-center justify-center gap-2 transition shrink-0"
              >
                <Search size={18} />
                <span className="hidden md:inline text-sm font-semibold">Suchen</span>
              </button> */}
            </form>
          </div>

          {/* RIGHT: visual-search collage from the hero images */}
          <Reveal delay={0.1} y={24}>
            <div className="grid grid-cols-2 gap-3 h-[280px] md:h-[340px]">
              <div className="grid grid-rows-2 gap-3">
                <CollageImage item={items[0]} fallback="/hero/sofa.jpg" alt={t('homeHero.collageAlt1')} />
                <CollageImage item={items[1]} fallback="/hero/table.jpg" alt={t('homeHero.collageAlt2')} />
              </div>
              <CollageImage item={items[2]} fallback="/hero/chair.jpg" alt={t('homeHero.collageAlt3')} />
            </div>

            {/* Short feature teaser — plain text, no box */}
            <p className="mt-4 text-sm md:text-base text-white/95 flex flex-wrap items-center gap-x-2 gap-y-1">
              <span className="font-bold text-white">{t('homeHero.teaserBadge')}</span>
              {t('homeHero.teaserText')}
              <button
                onClick={() => setShowVisualSearch(true)}
                className="font-semibold text-white underline underline-offset-2 hover:text-white/80 whitespace-nowrap"
              >
                {t('homeHero.teaserCta')}
              </button>
            </p>
          </Reveal>

        </div>
      </div>

      <VisualSearchModal open={showVisualSearch} onClose={() => setShowVisualSearch(false)} />
    </section>
  );
}
