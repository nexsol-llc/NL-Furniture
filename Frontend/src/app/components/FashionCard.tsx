'use client'

import { useRouter } from 'next/navigation'
import PlaceholderImage from './PlaceholderImage'

export default function FashionCard({
  id,
  title,
  subHeading,
  author,
  image,
  category,
}: {
  id: string | number
  title: string
  subHeading?: string
  author: string
  image?: string
  category?: string
}) {
  const router = useRouter()

  const imageSrc = image || null

  return (
    <div
      onClick={() => router.push(`/blog/${id}`)}
      className="group cursor-pointer flex-shrink-0"
      style={{ width: '260px' }}
    >
      {/* Image */}
      <div
        className="relative w-full rounded-2xl overflow-hidden bg-gray-100"
        style={{ height: '320px' }}
      >
        <PlaceholderImage
          src={imageSrc}
          alt={title}
          fill
          className="object-cover group-hover:scale-105 transition-transform duration-500"
          sizes="260px"
        />
        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      </div>

      {/* Text */}
      <div className="mt-4 px-1">
        {category && (
          <p className="text-[10px] uppercase font-bold tracking-[0.18em] text-primary-500 mb-1.5">
            {category}
          </p>
        )}
        <h3 className="text-[15px] text-gray-900 font-semibold leading-snug line-clamp-3 mb-2 group-hover:text-primary-500 transition-colors">
          {title}
        </h3>
        {subHeading && (
          <p className="text-xs text-gray-500 leading-relaxed line-clamp-2 mb-2">
            {subHeading}
          </p>
        )}
        {/* <p className="text-[11px] uppercase tracking-wider text-gray-400 font-medium">
          Von {author}
        </p> */}
      </div>
    </div>
  )
}
