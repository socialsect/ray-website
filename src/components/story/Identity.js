import { optSrc, optSrcSet } from "@/lib/content/images";
import { lineColors } from "@/components/scenes/network";
import Heading from "@/components/ui/Heading";

// The person behind the map: Ray's own photograph and his own introduction.
export default function Identity({ copy, person, quotes }) {
  const portrait = person.portrait;
  return (
    <section
      id="identity"
      tabIndex={-1}
      data-section="identity"
      aria-labelledby="identity-title"
      className="relative scroll-mt-16 py-28 outline-none md:py-40"
    >
      <div id="main" className="mx-auto grid max-w-[1440px] gap-10 px-4 md:px-8 lg:grid-cols-12 lg:gap-8">
        <Heading id="identity-title" className="lg:col-span-8">
          {copy.identityHeadline.text}
        </Heading>

        {portrait && (
          <figure data-reveal style={{ "--i": 1 }} className="lg:col-span-7 lg:row-start-2">
            <div className="relative overflow-hidden bg-raised">
              {/* eslint-disable-next-line @next/next/no-img-element -- pre-built static WebP */}
              <img
                src={optSrc(portrait.src, 1600)}
                srcSet={optSrcSet(portrait.src)}
                width={portrait.width}
                height={portrait.height}
                alt={portrait.alt}
                loading="lazy"
                decoding="async"
                sizes="(min-width: 1024px) 58vw, 100vw"
                className="aspect-[4/3] w-full object-cover transition-transform duration-[1600ms] ease-out-expo hover:scale-[1.03]"
              />
            </div>
          </figure>
        )}

        <div data-reveal style={{ "--i": 2 }} className="flex flex-col lg:col-span-5 lg:row-start-2">
          <div className="scallop-bottom bg-paper px-7 pb-12 pt-10 text-ground md:px-10 md:pb-14 md:pt-12">
            <p className="text-[19px] leading-[1.6] md:text-[22px]">{copy.identityBody.text}</p>
            <p className="mt-6 text-[17px] leading-[1.6]">&ldquo;{quotes.jobTitle.text}&rdquo;</p>
            <p className="mt-8 font-display text-[28px] font-bold uppercase leading-none">{person.preferredName}</p>
            <p className="mt-1 text-[14px] text-ground/75">{person.canonicalName}, founder of Socialsect</p>
          </div>
          <div className="mt-3 flex flex-wrap items-center gap-x-6 gap-y-3 bg-raised px-7 py-5 md:px-10">
            <span className="text-[14px] text-ink">Four lines leave from here</span>
            {["building", "discipline", "exploration", "thinking"].map((l) => (
              <span key={l} className="flex items-center gap-2 text-[14px] capitalize text-ink">
                <span className="inline-block h-1.5 w-6 rounded-full" style={{ background: lineColors[l] }} />
                {l}
              </span>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
