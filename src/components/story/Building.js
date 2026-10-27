import Heading from "@/components/ui/Heading";
import WorldImage from "@/components/ui/WorldImage";

function ExternalArrow() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden="true" className="shrink-0">
      <path d="M4 2h8v8M12 2 2 12" fill="none" stroke="currentColor" strokeWidth="2" />
    </svg>
  );
}

// The Building line: on the right, the tower rises floor by floor; the lit
// floor is Socialsect.
export default function Building({ station, copy, ventures, values, image }) {
  const featured = ventures.filter((v) => v.featured);
  return (
    <section id="building" data-section="building" aria-labelledby="building-title" className="relative py-28 md:py-44">
      <div className="mx-auto max-w-[1440px] px-4 md:px-8">
        <Heading id="building-title" className="lg:max-w-[74%]">
          {station.headline}
        </Heading>
        <div className="mt-10 lg:flex lg:items-stretch lg:justify-between lg:gap-12">
          <div className="lg:w-[46%]">
          <p data-reveal className="text-[19px] leading-[1.55] md:text-[22px]">&ldquo;{copy.buildingBody.text}&rdquo;</p>

          {featured.map((v) => (
            <article key={v.slug} data-reveal style={{ "--i": 1 }} className="mt-12">
              <div className="ticket-stock bg-building px-8 py-8 text-ink md:px-10">
                <h3 className="font-display text-[clamp(38px,5.4vw,84px)] font-extrabold uppercase leading-none">{v.name}</h3>
                <dl className="mt-6 grid grid-cols-[auto_1fr] gap-x-6 gap-y-2 text-[17px]">
                  <dt className="text-ink/70">Role</dt>
                  <dd className="font-semibold">{v.role}</dd>
                  <dt className="text-ink/70">Field</dt>
                  <dd>{v.sector}</dd>
                  <dt className="text-ink/70">Where</dt>
                  <dd>India, the US, the UK; building in the UAE</dd>
                </dl>
                <p className="mt-5 max-w-[48ch] text-[17px] leading-[1.55]">&ldquo;{v.description}&rdquo;</p>
                {v.verifiedLinks.map((l) => (
                  <a
                    key={l.href}
                    href={l.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-7 inline-flex min-h-12 items-center gap-2 bg-paper px-6 text-[17px] font-semibold text-ground transition-transform duration-200 hover:-translate-y-0.5"
                  >
                    {l.label}
                    <ExternalArrow />
                  </a>
                ))}
              </div>
            </article>
          ))}

          <div data-reveal style={{ "--i": 2 }} className="mt-12">
            <p className="text-[17px] leading-[1.6]">
              What Socialsect holds to, in Ray&apos;s words: the things he would lose clients over before he&apos;d compromise.
            </p>
            <ul className="mt-6 grid gap-2 sm:grid-cols-2">
              {values.map((v) => (
                <li key={v} className="flex items-center gap-4 bg-raised/95 px-5 py-4 font-display text-[22px] font-bold uppercase leading-none">
                  <span className="inline-block size-3 shrink-0 rounded-full bg-building" />
                  {v}
                </li>
              ))}
            </ul>
          </div>
          </div>
        </div>
      </div>

      <WorldImage
        image={image}
        sizes="100vw"
        className="mx-auto mt-24 max-w-[1440px] px-4 md:mt-32 md:px-8"
        imgClassName="aspect-[21/9] md:aspect-[1920/742]"
        captionClassName="text-muted"
      />
    </section>
  );
}
