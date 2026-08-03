'use client';

import { useEffect, useState } from 'react'
import FashionCard from '../components/FashionCard'
import FAQSection from '../components/FAQSection'
import { Reveal } from '../components/motion/Reveal'
import { useLanguage } from '@/providers/languageContext'

type Blog = {
  _id: string;
  title: string;
  subHeading?: string;
  category: string;
  author: string;
  heroImage: string;
  thumbnail?: string;
};

export default function MagazinePage() {
  const { t } = useLanguage();
  const magazineFAQs = [
    { question: t('magazinePage.faq1Q'), answer: t('magazinePage.faq1A') },
    { question: t('magazinePage.faq2Q'), answer: t('magazinePage.faq2A') },
    { question: t('magazinePage.faq3Q'), answer: t('magazinePage.faq3A') },
    { question: t('magazinePage.faq4Q'), answer: t('magazinePage.faq4A') },
  ];
  const [blogs, setBlogs] = useState<Blog[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    setSearchQuery(params.get("search") || "")

    const fetchBlogs = async () => {
      try {
        const blogsRes = await fetch('/api/blog?summary=true')
        const blogsData = await blogsRes.json()
        if (Array.isArray(blogsData)) setBlogs(blogsData)
      } catch (error) {
        console.error(error)
      } finally {
        setLoading(false)
      }
    }
    fetchBlogs()
  }, [])

  const filteredBlogs = blogs.filter((blog) => {
    const query = searchQuery.trim().toLowerCase()
    if (!query) return true
    return (
      blog.title.toLowerCase().includes(query) ||
      blog.category.toLowerCase().includes(query)
    )
  })

  // Group blogs by category
  const groupedBlogs = filteredBlogs.reduce((acc, blog) => {
    if (!acc[blog.category]) acc[blog.category] = [];
    acc[blog.category].push(blog);
    return acc;
  }, {} as Record<string, Blog[]>);

  // Categories that actually contain blogs matching search query
  const categories = Array.from(
    new Set(filteredBlogs.map((blog) => blog.category).filter(Boolean))
  ).sort((a, b) => a.localeCompare(b));

  return (
    <div className="min-h-screen bg-[#f3f4f6] section-pattern-1 text-gray-800 font-sans">

      {/* Page Header */}
      <div className="max-w-content mx-auto px-4 sm:px-8 lg:px-10 pt-12 pb-4">
        <Reveal>
        <p className="text-[11px] uppercase tracking-[0.2em] font-bold text-primary-600 mb-2">
          {t('magazinePage.eyebrow')}
        </p>
        <h1 className="text-display font-display text-gray-900 mb-1">
          {t('magazinePage.heading')}
        </h1>
        </Reveal>
        <div className="mt-6 mb-4 max-w-xl">
          <input
            type="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t('magazinePage.searchPlaceholder')}
            className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm outline-none focus:border-gray-400 focus:ring-2 focus:ring-gray-200"
          />
        </div>
        <p className="text-gray-500 text-sm md:text-base font-light max-w-xl">
          {t('magazinePage.subtitle')}
        </p>
      </div>

      {/* Divider */}
      <div className="max-w-content mx-auto px-4 sm:px-8 lg:px-10">
        <hr className="border-gray-200 mb-8" />
      </div>

      <div className="max-w-content mx-auto">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-32 gap-4">
            <div className="w-10 h-10 border-4 border-gray-200 border-t-gray-700 rounded-full animate-spin" />
            <p className="text-gray-400 text-sm tracking-wide">{t('magazinePage.loadingContent')}</p>
          </div>
        ) : (
          categories.map((category, index) => {
            const categoryBlogs = groupedBlogs[category] || [];

            return (
              <section
                key={category}
                className={`pb-12 md:pb-16 ${index === 0 ? 'pt-0' : 'pt-4'}`}
              >
                {/* Category header */}
                <div className="px-4 sm:px-8 lg:px-10 flex items-end justify-between mb-6">
                  <h2 className="text-h2 font-display text-gray-900">
                    {category}
                  </h2>
                </div>

                {/* Horizontal scroll strip */}
                <div
                  className="overflow-x-auto pb-4"
                  style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                >
                  <div className="flex gap-5 px-4 sm:px-8 lg:px-10">
                    {categoryBlogs.map((blog) => (
                      <FashionCard
                        key={blog._id}
                        id={blog._id}
                        title={blog.title}
                        subHeading={blog.subHeading}
                        author={blog.author}
                        image={blog.thumbnail || blog.heroImage}
                        category={category}
                      />
                    ))}
                  </div>
                </div>

                {/* Category divider */}
                {index < categories.length - 1 && (
                  <div className="px-4 sm:px-8 lg:px-10 mt-8">
                    <hr className="border-gray-200" />
                  </div>
                )}
              </section>
            );
          })
        )}

        {!loading && filteredBlogs.length === 0 && (
          <div className="flex justify-center pt-20 pb-32">
            <p className="text-gray-400 text-base italic">{t('magazinePage.noPostsYet')}</p>
          </div>
        )}
      </div>

      {/* FAQs */}
      {!loading && (
        <FAQSection faqs={magazineFAQs} title={t('magazinePage.faqTitle')} />
      )}
    </div>
  )
}
