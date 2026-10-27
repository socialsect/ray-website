import Explore from "@/components/mind/Explore";
import Mind from "@/components/mind/Mind";
import { getHomeContent } from "@/lib/content";
import { optSrc, optSrcSet } from "@/lib/content/images";
import { personJsonLd } from "@/lib/seo/jsonld";

// The regions are a creative map of the site, not anatomy. Directions are in
// the scan's own space (+z front, -z back, +y up, +x the side facing us).
const REGIONS = [
  { id: "journey", name: "Journey", color: "#0f8b7c", dir: [0.6, -0.05, 0.85] },
  { id: "ventures", name: "Ventures", color: "#c98a0e", dir: [0.55, 0.3, -0.85] },
  { id: "discipline", name: "Discipline", color: "#d12a3a", dir: [0.85, -0.55, 0.05] },
  { id: "exploration", name: "Exploration", color: "#2563eb", dir: [0.5, 0.55, 0.6] },
  { id: "expression", name: "Expression", color: "#c0389f", dir: [0.7, -0.35, -0.55] },
  { id: "ideas", name: "Ideas", color: "#ff7a1f", dir: [0.5, 0.75, -0.45] },
];

const PHOTOS = {
  journey: { src: "/assets/mind/journey.jpg", caption: "Jebel Jais, United Arab Emirates, at sunrise", alt: "A road winding up a desert mountain at sunrise." },
  ventures: { src: "/assets/mind/ventures.jpg", caption: "Highlight Towers, Munich", alt: "Glass towers seen from below at dusk, lit from within." },
  discipline: { src: "/assets/mind/discipline.jpg", caption: "A boxing coach at the heavy bag, from a historic archive", alt: "A boxing coach demonstrating on a heavy bag, a historic black-and-white photograph." },
  exploration: { src: "/assets/mind/exploration.jpg", caption: "Olkhon Island, Lake Baikal, at sunset", alt: "Sea cliffs catching the last sun above a wide, calm lake." },
  expression: { src: "/assets/mind/expression.jpg", caption: "The keys of an old typewriter", alt: "The keys of an old typewriter in low warm light." },
  ideas: { src: "/assets/mind/ideas.jpg", caption: "The Cosmic Cliffs of the Carina Nebula, seen by Webb", alt: "Gas and dust clouds of the Carina Nebula glowing gold against blue." },
};

const CREDITS = [
  { title: "Brain AS (3D model of the human brain)", creator: "Agnieszka Starostecka", license: "CC BY 4.0", licenseUrl: "https://creativecommons.org/licenses/by/4.0/", page: "https://commons.wikimedia.org/wiki/File:Brain_AS.stl" },
  { title: "Sunrise on the Jebel Jais Mountain", creator: "Clintonrebeiro", license: "CC BY-SA 4.0", licenseUrl: "https://creativecommons.org/licenses/by-sa/4.0/", page: "https://commons.wikimedia.org/wiki/File:Sunrise_on_the_Jebel_Jais_Mountain_on_a_Chilly_Winter_Morning.jpg" },
  { title: "Highlight Towers Munich", creator: "Martin Falbisoner", license: "CC BY-SA 4.0", licenseUrl: "https://creativecommons.org/licenses/by-sa/4.0/", page: "https://commons.wikimedia.org/wiki/File:Highlight_Towers_Munich,_February_2017_-01.jpg" },
  { title: "Penn State Boxing Coach Demonstrates on Heavy Punching Bag", creator: "US Army Signal Corps (Hennepin County Library)", license: "Public domain", licenseUrl: "https://creativecommons.org/publicdomain/mark/1.0/", page: "https://commons.wikimedia.org/wiki/File:Penn_State_Boxing_Coach_Demonstrates_on_Heavy_Punching_Bag_-_DPLA_-_2ed616aeb7f078509e1eec4ac4f6167e.jpg" },
  { title: "Olkhon Island, cliffs at sunset, Lake Baikal", creator: "Vyacheslav Argenberg", license: "CC BY 4.0", licenseUrl: "https://creativecommons.org/licenses/by/4.0/", page: "https://commons.wikimedia.org/wiki/File:Olkhon_Island,_Capes,_cliffs_at_sunset,_Lake_Baikal,_Russia.jpg" },
  { title: "Old typewriter analog keyboard closeup", creator: "Shixart1985", license: "CC BY 2.0", licenseUrl: "https://creativecommons.org/licenses/by/2.0/", page: "https://commons.wikimedia.org/wiki/File:Old_typewriter_analog_keyboard_closeup.jpg" },
  { title: "Cosmic Cliffs in the Carina Nebula", creator: "NASA, ESA, CSA, STScI", license: "Public domain", licenseUrl: "https://creativecommons.org/publicdomain/mark/1.0/", page: "https://commons.wikimedia.org/wiki/File:NASA%E2%80%99s_Webb_Reveals_Cosmic_Cliffs,_Glittering_Landscape_of_Star_Birth.jpg" },
];

const EMAIL = "sales@gosocialsect.com";
const MONUMENT = "Ray’s mind";
const sentence = (s) => s.toLowerCase().replace(/^./, (c) => c.toUpperCase());

// What each chapter's 3D form shows, said in words beside it.
const FORMS = {
  journey: "A road that keeps climbing into the distance.",
  ventures: "A tower, its top floors still being built.",
  discipline: "The ring: four posts, three ropes, one canvas.",
  exploration: "A globe, with India, the US, the UK and the UAE joined by arcs.",
  expression: "An open book, its pages lifting.",
  ideas: "A spiral of thoughts, turning around a bright core.",
};

// A heading whose words rise into place, each from behind its own edge.
function Rise({ text }) {
  return (
    <span aria-hidden="true">
      {text.split(" ").map((w, i) => (
        <span key={i} className="inline-block overflow-hidden pb-[0.12em] align-bottom">
          <span data-char className="inline-block">
            {w}
            {" "}
          </span>
        </span>
      ))}
    </span>
  );
}

// A statement lit word by word as it is read.
function Scrub({ text }) {
  return text.split(" ").map((w, i) => (
    <span key={i} data-w>
      {w}{" "}
    </span>
  ));
}

function Chapter({ index, region, subtitle, body, children }) {
  const p = PHOTOS[region.id];
  // The form takes one side of the screen; the words take the other.
  const even = index % 2 === 0;
  const textSide = even ? "lg:col-start-1" : "lg:col-start-8";
  const formSide = even ? "lg:col-start-8" : "lg:col-start-1";
  return (
    <section id={region.id} data-mind={region.id} aria-labelledby={`${region.id}-title`} className="relative flex min-h-[160svh] items-center overflow-x-clip">
      {/* The chapter's name, set huge, drifts across the page as it is read. */}
      <span
        aria-hidden="true"
        data-drift
        data-word={region.name}
        className="pointer-events-none absolute left-0 top-[18%] whitespace-nowrap font-serif text-[34vw] leading-none tracking-[-0.05em] before:content-[attr(data-word)]"
        style={{ color: region.color, opacity: 0.09 }}
      />
      <div className="relative grid w-full px-5 py-24 md:px-8 lg:min-h-svh lg:grid-cols-12 lg:items-center lg:gap-8 lg:py-0">
        <div data-reveal-group className={`lg:col-span-5 lg:row-start-1 ${textSide}`}>
          {/* On narrow screens the form fills this space before the words arrive. */}
          <div aria-hidden="true" className="h-[52svh] lg:hidden" />
          <h2 id={`${region.id}-title`} aria-label={region.name} className="flex items-center gap-4 font-serif text-[clamp(56px,6.4vw,104px)] leading-[0.92] tracking-[-0.035em]">
            <span className="size-[0.16em] shrink-0 rounded-full" style={{ background: region.color }} aria-hidden="true" />
            <span aria-hidden="true" className="inline-flex overflow-hidden pb-[0.08em]">
              {[...region.name].map((c, i) => (
                <span key={i} data-char className="inline-block">
                  {c}
                </span>
              ))}
            </span>
          </h2>
          <p data-in className="mt-4 max-w-[26ch] font-serif text-[clamp(24px,2vw,30px)] leading-[1.2]">
            {subtitle}
          </p>
          <figure data-in className="mt-8">
            <div data-photo className="aspect-[16/9] overflow-hidden bg-[#eceae6]">
              {/* eslint-disable-next-line @next/next/no-img-element -- pre-built static WebP */}
              <img src={optSrc(p.src, 960)} srcSet={optSrcSet(p.src)} sizes="(min-width: 1024px) 40vw, 100vw" alt={p.alt} loading="lazy" decoding="async" className="h-full w-full object-cover" />
            </div>
            <figcaption className="mt-3 text-[15px] text-ink/70">{p.caption}</figcaption>
          </figure>
          <p data-in className="mt-6 max-w-[46ch] text-[17px] leading-[1.65]">
            {body}
          </p>
          <div data-in>
            <Explore name={region.name}>{children}</Explore>
          </div>
          <p className="mt-8 max-w-[30ch] text-[15px] lg:hidden">{FORMS[region.id]}</p>
        </div>
        <p className={`hidden max-w-[34ch] self-end pb-[9svh] text-[15px] lg:col-span-5 lg:row-start-1 lg:block ${formSide}`}>{FORMS[region.id]}</p>
      </div>
    </section>
  );
}

export default async function HomePage() {
  const content = await getHomeContent();
  const { copy, quotes, person, book, media, values, timeline } = content;
  const st = Object.fromEntries(content.stations.map((s) => [s.id, s]));
  const show = media.find((m) => m.format === "podcast");
  const R = Object.fromEntries(REGIONS.map((r, i) => [r.id, { region: r, index: i }]));
  const venture = content.ventures.find((v) => v.featured);
  const mail = `mailto:${EMAIL}?subject=${encodeURIComponent("Hello Ray")}`;

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(personJsonLd(person)) }} />
      <Mind regions={REGIONS}>
        <header className="absolute inset-x-0 top-0 z-40">
          <div className="flex h-16 items-center justify-between gap-6 px-5 md:h-20 md:px-8">
            <a href="#top" className="font-serif text-[22px] tracking-[-0.01em]">
              RayMindset
            </a>
            <nav aria-label="Primary">
              <ul className="flex items-center gap-8 text-[17px] font-medium">
                {REGIONS.slice(0, 3).map((r) => (
                  <li key={r.id} className="hidden lg:block">
                    <a href={`#${r.id}`} className="mind-link">
                      {r.name}
                    </a>
                  </li>
                ))}
                <li>
                  <a href="#connect" className="mind-link">
                    Get in touch
                  </a>
                </li>
              </ul>
            </nav>
          </div>
        </header>

        <main id="main">
          {/* The name as a monument; the mind gathers behind it. */}
          <section id="top" data-mind="hero" aria-labelledby="hero-title" className="relative h-[200svh]">
            {/* The opening holds for a screen of scrolling while the reader goes into the mind. */}
            <div className="sticky top-0 h-svh min-h-[620px] overflow-hidden">
            <div className="absolute inset-x-0 top-[22%] md:top-1/2 md:-translate-y-1/2">
              <h1 id="hero-title" data-monument aria-label="Welcome to Ray’s mind" className="mind-monument origin-center px-3 text-center font-serif text-[21.2vw] uppercase leading-[0.86] tracking-[-0.045em]">
                <span className="inline-flex overflow-hidden pb-[0.04em]">
                  {[...MONUMENT].map((c, i) => (
                    <span key={i} className="mind-letter" style={{ "--i": i }}>
                      {c === " " ? " " : c}
                    </span>
                  ))}
                </span>
              </h1>
            </div>
            <div data-hero-fade className="mind-rise absolute inset-x-5 bottom-6 flex flex-col gap-5 md:inset-x-8 md:bottom-8 md:flex-row md:items-end md:justify-between">
              <div className="max-w-[36ch]">
                <p className="text-[19px] font-medium leading-[1.45] md:text-[22px]">{copy.heroSub.text}</p>
                <a href="#intro" className="mind-button mt-5">
                  Step inside
                </a>
              </div>
              <a href="#intro" className="mind-link hidden text-[17px] font-medium md:inline">
                Scroll to enter
              </a>
            </div>
            </div>
          </section>

          {/* Ray in his own words, beside the mind. */}
          <section id="intro" data-mind="intro" aria-labelledby="intro-title" className="relative flex min-h-[120svh] items-center">
            <div data-reveal-group className="grid w-full px-5 py-32 md:px-8 lg:min-h-svh lg:grid-cols-12 lg:items-center lg:gap-8 lg:py-0">
              <div aria-hidden="true" className="h-[46svh] lg:hidden" />
              <p className="hidden max-w-[34ch] self-end pb-[9svh] text-[15px] lg:col-span-5 lg:row-start-1 lg:block">
                The brain behind this page is drawn from an anatomical model of a real human brain, one point at a time.
              </p>
              <div className="lg:col-span-5 lg:col-start-8 lg:row-start-1">
                <h2 id="intro-title" aria-label={sentence(copy.identityHeadline.text)} className="font-serif text-[clamp(36px,3.4vw,52px)] leading-[1.02] tracking-[-0.02em]">
                  <Rise text={sentence(copy.identityHeadline.text)} />
                </h2>
                <p data-scrub className="mt-8 text-[19px] leading-[1.45] md:text-[clamp(21px,1.75vw,26px)] md:leading-[1.38]">
                  <Scrub text={copy.identityBody.text} />
                </p>
                <p data-in className="mt-8 max-w-[44ch] text-[17px] leading-[1.65]">
                  This site is a map of that mind: six regions, each one a part of the story. Hover a region to light it, and step in.
                </p>
              </div>
            </div>
          </section>

          <section id="map" data-mind="map" aria-labelledby="map-title" className="relative min-h-[190svh]">
            <div data-reveal-group className="sticky top-0 flex h-svh flex-col justify-between px-5 pb-8 pt-24 md:px-8 md:pt-28">
              <h2 id="map-title" aria-label="Six regions. One mind." className="max-w-[16ch] font-serif text-[clamp(36px,3.4vw,52px)] leading-[1.02] tracking-[-0.02em]">
                <Rise text="Six regions. One mind." />
              </h2>
              <div>
                <p className="text-[15px]">Hover or tap a region to step inside.</p>
                {/* The same map as a plain list, for keyboards, screen readers and small screens. */}
                <ul className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-[17px] md:hidden">
                  {REGIONS.map((r) => (
                    <li key={r.id}>
                      <a href={`#${r.id}`} className="inline-flex min-h-11 items-center gap-2">
                        <span className="size-2 rounded-full" style={{ background: r.color }} aria-hidden="true" />
                        {r.name}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </section>

          <Chapter index={R.journey.index} region={R.journey.region} subtitle="The path that shaped who I am today." body={copy.originBody.text}>
            <p>&ldquo;{quotes.origin.text}&rdquo;</p>
            <ol className="mt-5 space-y-2">
              {timeline.map((e) => (
                <li key={e.title}>
                  <span className="font-semibold">{e.title}.</span> {e.description}
                </li>
              ))}
            </ol>
          </Chapter>

          <Chapter index={R.ventures.index} region={R.ventures.region} subtitle="Ideas into impact." body={copy.buildingBody.text}>
            <p>
              <span className="font-semibold">Socialsect.</span> {venture.role}. {venture.sector}. India, the US and the UK, now building in the UAE.
            </p>
            <p className="mt-4">What it holds to: {values.join(", ")}.</p>
            <a href={venture.verifiedLinks[0].href} target="_blank" rel="noopener noreferrer" className="mind-link mt-4 inline-block">
              Visit gosocialsect.com
            </a>
          </Chapter>

          <Chapter index={R.discipline.index} region={R.discipline.region} subtitle={sentence(st.discipline.headline)} body={copy.disciplineBody.text}>
            <p>Boxing is a practice, not a title: the fight is the one before the ring.</p>
          </Chapter>

          <Chapter index={R.exploration.index} region={R.exploration.region} subtitle="New places. New perspectives." body={copy.motionBody.text}>
            <p className="font-serif text-[22px]">India, the US, the UK, the UAE</p>
            <p className="mt-2">Where Ray has built Socialsect, and where it is growing next.</p>
          </Chapter>

          <Chapter index={R.expression.index} region={R.expression.region} subtitle={`${book.title}.`} body={`Ray wrote a book. In his words: “${copy.storiesBody.text}”`}>
            <blockquote className="font-serif text-[22px] leading-[1.45]">&ldquo;{quotes.book.text}&rdquo;</blockquote>
            <p className="mt-3">From {book.title}</p>
          </Chapter>

          <Chapter index={R.ideas.index} region={R.ideas.region} subtitle="What's next." body={copy.thinkingBody.text}>
            <p className="font-serif text-[22px]">{show.title}</p>
            <p className="mt-2">{show.description}</p>
            <ul className="mt-3 space-y-1">
              {show.episodes.map((e) => (
                <li key={e.title}>
                  {e.title}, {e.duration}
                </li>
              ))}
            </ul>
            <p className="mt-4 flex flex-wrap gap-6">
              {show.links.map((l) => (
                <a key={l.href} href={l.href} target="_blank" rel="noopener noreferrer" className="mind-link">
                  {l.label}
                </a>
              ))}
            </p>
            <p className="mt-5 font-serif text-[22px]">{sentence(st.unknown.headline)}</p>
          </Chapter>

          <section data-mind="close" aria-labelledby="close-title" className="relative flex min-h-[130svh] items-end pb-[16svh]">
            <div data-reveal-group className="w-full px-5 md:px-8">
              <h2 id="close-title" data-in className="font-serif text-[clamp(40px,6vw,96px)] leading-[0.92] tracking-[-0.035em]">
                Different thoughts.
                <br />
                One mind.
              </h2>
              <p data-in className="mt-8 max-w-[40ch] text-[clamp(19px,1.6vw,22px)] leading-[1.5]">
                &ldquo;{copy.unknownBody.text}&rdquo;
              </p>
            </div>
          </section>

          {/* Ways to reach Ray, set as display rows. */}
          <section id="connect" aria-labelledby="connect-title" className="relative grid bg-[#ff7a1f] pb-20 pt-24 md:pb-24 md:pt-32 lg:grid-cols-12 lg:gap-8">
            <div data-reveal-group className="px-5 md:px-8 lg:col-span-4 lg:pr-0">
              <h2 id="connect-title" data-in className="font-serif text-[clamp(36px,3.4vw,52px)] leading-[1.05] tracking-[-0.01em]">
                {sentence(copy.contactHeadline.text)}
              </h2>
              <p data-in className="mt-5 max-w-[40ch] text-[17px] leading-[1.6]">{copy.contactBody.text}</p>
            </div>
            <ul data-reveal-group className="mt-12 lg:col-span-8 lg:col-start-5 lg:mt-0">
              {[
                { label: "Write to Ray", note: `Email ${EMAIL}`, href: mail },
                { label: "Socialsect", note: `The company Ray founded. ${venture.sector}.`, href: venture.verifiedLinks[0].href, ext: true },
                { label: show.title, note: `Ray's podcast, on ${show.links.map((l) => l.label).join(" and ")}.`, href: show.links[0].href, ext: true },
              ].map((row, i) => (
                <li key={row.label} data-in className={i % 2 ? "bg-[#ff8a38]" : ""}>
                  <a
                    href={row.href}
                    {...(row.ext ? { target: "_blank", rel: "noopener noreferrer" } : {})}
                    className="group flex items-center justify-between gap-6 px-5 py-7 transition-colors duration-300 hover:bg-[#050f16] hover:text-[#ff7a1f] md:px-8 md:py-9"
                  >
                    <span>
                      <span className="block font-serif text-[clamp(34px,4.4vw,72px)] leading-none tracking-[-0.01em]">{row.label}</span>
                      <span className="mt-3 block text-[16px] md:text-[17px]">{row.note}</span>
                    </span>
                    <svg viewBox="0 0 24 24" aria-hidden="true" className="size-[clamp(22px,2.4vw,36px)] shrink-0 transition-transform duration-300 group-hover:-translate-y-1 group-hover:translate-x-1">
                      <path d="M6 18 18 6M8 6h10v10" fill="none" stroke="currentColor" strokeWidth="2" />
                    </svg>
                  </a>
                </li>
              ))}
            </ul>
          </section>
        </main>

        {/* The close: an invitation, the ways in, and the name set across the whole page. */}
        <footer className="relative overflow-hidden bg-[#050f16] text-[#f6f3ec]">
          <div data-reveal-group className="grid gap-14 px-5 pt-24 md:px-8 md:pt-32 lg:grid-cols-12 lg:gap-8">
            <div data-in className="lg:col-span-6">
              <p className="font-serif text-[clamp(48px,5.6vw,96px)] leading-[1] tracking-[-0.01em]">
                Let&apos;s build
                <br />
                what&apos;s next.
              </p>
              <div className="mt-10 flex flex-wrap items-center gap-x-6 gap-y-4">
                <a href={mail} className="mind-button mind-button-inverse">
                  Write to Ray
                </a>
                <a href={mail} className="mind-link text-[17px]">
                  {EMAIL}
                </a>
              </div>
            </div>
            <nav data-in aria-label="Footer" className="grid grid-cols-2 gap-x-8 gap-y-10 text-[17px] sm:grid-cols-3 lg:col-span-6 lg:pt-4">
              <div>
                <p className="text-[15px] text-[#f6f3ec]/60">Explore the mind</p>
                <ul className="mt-4 space-y-2.5">
                  {REGIONS.map((r) => (
                    <li key={r.id}>
                      <a href={`#${r.id}`} className="mind-link inline-flex items-center gap-2.5">
                        <span className="size-2 rounded-full" style={{ background: r.color }} aria-hidden="true" />
                        {r.name}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <p className="text-[15px] text-[#f6f3ec]/60">Ray&apos;s work</p>
                <ul className="mt-4 space-y-2.5">
                  <li>
                    <a href={venture.verifiedLinks[0].href} target="_blank" rel="noopener noreferrer" className="mind-link">
                      Socialsect
                    </a>
                  </li>
                  {show.links.map((l) => (
                    <li key={l.href}>
                      <a href={l.href} target="_blank" rel="noopener noreferrer" className="mind-link">
                        {show.title} on {l.label}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <p className="text-[15px] text-[#f6f3ec]/60">More of this site</p>
                <ul className="mt-4 space-y-2.5">
                  <li>
                    <a href="#top" className="mind-link">Back to the beginning</a>
                  </li>
                  <li>
                    <a href="/museum" className="mind-link">The Mind Museum</a>
                  </li>
                  <li>
                    <a href="/atlas" className="mind-link">The Atlas</a>
                  </li>
                </ul>
              </div>
            </nav>
          </div>
          <div className="mt-24 flex flex-wrap items-start justify-between gap-x-8 gap-y-3 px-5 text-[13px] md:px-8">
            <p>© 2026 {person.canonicalName}</p>
            <details className="max-w-[720px]">
              <summary className="cursor-pointer">Credits for the brain model and photographs</summary>
              <ul className="mt-3 space-y-1.5 pb-4 leading-[1.5]">
                {CREDITS.map((c) => (
                  <li key={c.page}>
                    <a href={c.page} target="_blank" rel="noopener noreferrer" className="mind-link">
                      {c.title}
                    </a>
                    , {c.creator},{" "}
                    <a href={c.licenseUrl} target="_blank" rel="noopener noreferrer" className="mind-link">
                      {c.license}
                    </a>
                  </li>
                ))}
              </ul>
            </details>
          </div>
          {/* The name, whole, across the page: it rises letter by letter as the page ends. */}
          <p aria-hidden="true" data-footer-name className="mind-monument mt-10 flex justify-between overflow-hidden px-3 pb-[0.06em] font-serif text-[17.6vw] uppercase leading-[0.86] text-[#ff7a1f]">
            {[..."Raymindset"].map((c, i) => (
              <span key={i} data-char className="inline-block">
                {c}
              </span>
            ))}
          </p>
        </footer>
      </Mind>
    </>
  );
}
