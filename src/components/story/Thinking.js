import Heading from "@/components/ui/Heading";

function ExternalArrow() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden="true" className="shrink-0">
      <path d="M4 2h8v8M12 2 2 12" fill="none" stroke="currentColor" strokeWidth="2" />
    </svg>
  );
}

// Ideas: Ray's podcast as the live room, then the shelf of topics the
// essays will fill. Spines carry no links until essays exist.
export default function Thinking({ station, copy, topics, media }) {
  const show = media.find((m) => m.format === "podcast");
  return (
    <section id="thinking" data-section="thinking" aria-labelledby="thinking-title" className="relative py-28 md:py-40">
      <div className="mx-auto max-w-[1440px] px-4 md:px-8">
        <div className="grid gap-8 lg:grid-cols-12">
          <Heading id="thinking-title" className="lg:col-span-8">
            {station.headline}
          </Heading>
          <div data-reveal style={{ "--i": 1 }} className="lg:col-span-6 lg:row-start-2">
            <p className="text-[17px] leading-[1.6] md:text-[19px]">&ldquo;{copy.thinkingBody.text}&rdquo;</p>
          </div>
        </div>

        {show && (
          <article data-reveal style={{ "--i": 2 }} className="mt-16 grid gap-8 bg-thinking px-6 py-10 text-ink md:mt-24 md:px-12 lg:grid-cols-12 lg:gap-8">
            <div className="lg:col-span-5">
              <h3 className="font-display text-[clamp(38px,5.4vw,84px)] font-extrabold uppercase leading-[0.9]">{show.title}</h3>
              <p className="mt-4 text-[17px]">A podcast hosted by {show.host}.</p>
              <p className="mt-4 max-w-[44ch] text-[19px] leading-[1.5]">{show.description}</p>
              <div className="mt-7 flex flex-wrap gap-3">
                {show.links.map((l) => (
                  <a
                    key={l.href}
                    href={l.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex min-h-12 items-center gap-2 bg-paper px-6 text-[17px] font-semibold text-ground transition-transform duration-200 hover:-translate-y-0.5"
                  >
                    {l.label}
                    <ExternalArrow />
                  </a>
                ))}
              </div>
            </div>
            <ol className="grid content-end gap-3 lg:col-span-6 lg:col-start-7">
              {show.episodes.map((e) => (
                <li key={e.title} className="flex items-end justify-between gap-6 bg-raised/60 px-5 py-5">
                  <span className="font-display text-[22px] font-bold uppercase leading-[1.05] md:text-[28px]">{e.title}</span>
                  <span className="shrink-0 text-[14px]">{e.duration}</span>
                </li>
              ))}
            </ol>
          </article>
        )}

        <p className="mt-14 text-[17px] text-ink">What I write and talk about:</p>
        <ul aria-label="Essay topics" className="mt-4 grid gap-2.5 sm:grid-cols-2 lg:grid-cols-4">
          {topics.map((t, i) => (
            <li
              key={t.slug}
              data-reveal
              style={{ "--i": i }}
              className="min-w-0 bg-raised/95 px-5 py-6 font-display text-[28px] font-bold uppercase leading-none transition-colors duration-300 hover:bg-thinking"
            >
              {t.name}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
