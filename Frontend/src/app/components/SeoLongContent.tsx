type SeoLongContentProps = {
  content?: string;
  title?: string;
  className?: string;
};

export default function SeoLongContent({
  content,
  title = "Mehr Informationen",
  className = "",
}: SeoLongContentProps) {
  if (!content?.trim()) return null;

  return (
    <section className={`max-w-content mx-auto px-4 py-8 ${className}`}>
      <div className="bg-white rounded-2xl border border-gray-200 shadow-soft-md p-6 md:p-10">
        {title && (
          <h2 className="text-h3 font-display text-gray-900 mb-4">
            {title}
          </h2>
        )}
        <div
          className="prose prose-sm md:prose-base max-w-none text-gray-700 [&_h2]:text-h2 [&_h2]:font-display [&_h2]:text-gray-900 [&_h3]:text-h3 [&_h3]:font-display [&_h3]:text-gray-900 [&_p]:leading-relaxed [&_ul]:list-disc [&_ul]:pl-6"
          dangerouslySetInnerHTML={{ __html: content }}
        />
      </div>
    </section>
  );
}
