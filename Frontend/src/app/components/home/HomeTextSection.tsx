/**
 * The admin's home page text (Admin → Home Page Settings), shown just before
 * the FAQs. The HTML stays plain — its typography lives in the `.home-text`
 * class in globals.css, so pasted markup picks up the theme without any
 * inline styles.
 */
export default function HomeTextSection({ html }: { html: string }) {
  return (
    <section className="relative overflow-hidden rounded-[20px] border border-gray-200/90 bg-white shadow-soft">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-20 -top-24 h-64 w-64 rounded-full bg-primary-100/60 blur-3xl"
      />
      <div
        className="home-text relative px-5 py-7 sm:px-8 sm:py-9 lg:px-10 lg:py-10"
        dangerouslySetInnerHTML={{ __html: html }}
      />
    </section>
  );
}
