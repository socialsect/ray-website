import Heading from "@/components/ui/Heading";
import Quote from "@/components/ui/Quote";

// Stories: in the world, a suitcase lies open and its pages rise; here, the
// book's tag carries Ray's own words about it. No cover is drawn.
export default function Stories({ station, copy, book, quote }) {
  return (
    <section id="stories" data-section="stories" aria-labelledby="stories-title" className="relative py-28 md:py-44">
      <div className="mx-auto max-w-[1440px] px-4 md:px-8 lg:flex lg:items-stretch lg:justify-between lg:gap-12">
        <div data-reveal className="luggage-tag bg-paper py-12 pl-20 pr-10 text-ground md:py-16 md:pl-24 md:pr-14 lg:w-[52%]">
          <Heading id="stories-title">{station.headline}</Heading>
          <p className="mt-6 max-w-[52ch] text-[17px] leading-[1.6] md:text-[19px]">
            Ray wrote a book called <em>{book.title}</em>. In his words: &ldquo;{copy.storiesBody.text}&rdquo;
          </p>
          <Quote quote={quote} attribution={`From ${book.title}`} tone="ground" className="mt-8 max-w-[44ch]" />
        </div>
      </div>
    </section>
  );
}
