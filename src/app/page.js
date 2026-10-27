import Explore from "@/components/mind/Explore";
import Mind from "@/components/mind/Mind";
import Connect from "@/components/story/Connect";
import Footer from "@/components/story/Footer";
import { getHomeContent } from "@/lib/content";
import { optSrc, optSrcSet } from "@/lib/content/images";
import { personJsonLd } from "@/lib/seo/jsonld";

// The regions are a creative map of the site, not anatomy. Directions are in
// the brain's own space (measured from the mesh: +z front, -z back, +y up);
// the camera looks at its right side, so the front faces left on screen.
const REGIONS = [
  { id: "journey", name: "Journey", color: "#5fd0b8", dir: [0.6, -0.05, 0.85] },
  { id: "ventures", name: "Ventures", color: "#f2c46b", dir: [0.55, 0.3, -0.85] },
  { id: "discipline", name: "Discipline", color: "#ff5d6c", dir: [0.85, -0.55, 0.05] },
  { id: "exploration", name: "Exploration", color: "#7fb2ff", dir: [0.5, 0.55, 0.6] },
  { id: "expression", name: "Expression", color: "#e07bff", dir: [0.7, -0.35, -0.55] },
  { id: "ideas", name: "Ideas", color: "#a98cff", dir: [0.5, 0.75, -0.45] },
];

const PHOTOS = {
  journey: { src: "/assets/mind/journey.jpg", focus: [0.55, 0.5], alt: "A road winding up a desert mountain at sunrise." },
  ventures: { src: "/assets/mind/ventures.jpg", focus: [0.6, 0.5], alt: "Glass towers seen from below at dusk, lit from within." },
  discipline: { src: "/assets/mind/discipline.jpg", focus: [0.62, 0.45], alt: "A boxing coach demonstrating on a heavy bag, a historic black-and-white photograph." },
  exploration: { src: "/assets/mind/exploration.jpg", focus: [0.6, 0.5], alt: "Sea cliffs catching the last sun above a wide, calm sea." },
  expression: { src: "/assets/mind/expression.jpg", focus: [0.55, 0.5], alt: "The keys of an old typewriter in low warm light." },
  ideas: { src: "/assets/mind/ideas.jpg", focus: [0.55, 0.5], alt: "The Cosmic Cliffs of the Carina Nebula, seen by the Webb telescope." },
  close: { src: "/assets/mind/close.jpg", focus: [0.5, 0.55], alt: "A lake below dark hills, the sky glowing after sunset." },
};

const CREDITS = {
  brain: { src: "brain", credit: { title: "Brain AS (3D model of the human brain)", creator: "Agnieszka Starostecka", license: "CC BY 4.0", licenseUrl: "https://creativecommons.org/licenses/by/4.0/", page: "https://commons.wikimedia.org/wiki/File:Brain_AS.stl" } },
  journey: { src: "j", credit: { title: "Sunrise on the Jebel Jais Mountain", creator: "Clintonrebeiro", license: "CC BY-SA 4.0", licenseUrl: "https://creativecommons.org/licenses/by-sa/4.0/", page: "https://commons.wikimedia.org/wiki/File:Sunrise_on_the_Jebel_Jais_Mountain_on_a_Chilly_Winter_Morning.jpg" } },
  ventures: { src: "v", credit: { title: "Highlight Towers Munich", creator: "Martin Falbisoner", license: "CC BY-SA 4.0", licenseUrl: "https://creativecommons.org/licenses/by-sa/4.0/", page: "https://commons.wikimedia.org/wiki/File:Highlight_Towers_Munich,_February_2017_-01.jpg" } },
  discipline: { src: "d", credit: { title: "Penn State Boxing Coach Demonstrates on Heavy Punching Bag", creator: "US Army Signal Corps (Hennepin County Library)", license: "Public domain", licenseUrl: "https://creativecommons.org/publicdomain/mark/1.0/", page: "https://commons.wikimedia.org/wiki/File:Penn_State_Boxing_Coach_Demonstrates_on_Heavy_Punching_Bag_-_DPLA_-_2ed616aeb7f078509e1eec4ac4f6167e.jpg" } },
  exploration: { src: "e", credit: { title: "Olkhon Island, cliffs at sunset, Lake Baikal", creator: "Vyacheslav Argenberg", license: "CC BY 4.0", licenseUrl: "https://creativecommons.org/licenses/by/4.0/", page: "https://commons.wikimedia.org/wiki/File:Olkhon_Island,_Capes,_cliffs_at_sunset,_Lake_Baikal,_Russia.jpg" } },
  expression: { src: "x", credit: { title: "Old typewriter analog keyboard closeup", creator: "Shixart1985", license: "CC BY 2.0", licenseUrl: "https://creativecommons.org/licenses/by/2.0/", page: "https://commons.wikimedia.org/wiki/File:Old_typewriter_analog_keyboard_closeup.jpg" } },
  ideas: { src: "i", credit: { title: "Cosmic Cliffs in the Carina Nebula", creator: "NASA, ESA, CSA, STScI", license: "Public domain", licenseUrl: "https://creativecommons.org/publicdomain/mark/1.0/", page: "https://commons.wikimedia.org/wiki/File:NASA%E2%80%99s_Webb_Reveals_Cosmic_Cliffs,_Glittering_Landscape_of_Star_Birth.jpg" } },
  close: { src: "c", credit: { title: "Summer night close to Lake Herland, Osterøy, Norway", creator: "Odd Roar Aalborg", license: "CC BY-SA 4.0", licenseUrl: "https://creativecommons.org/licenses/by-sa/4.0/", page: "https://commons.wikimedia.org/wiki/File:Summer_night_close_to_Lake_Herland_in_Fotlandsv%C3%A5g,_Oster%C3%B8y,_Norway.jpg" } },
};

const FRAMES = [...REGIONS.map((r) => r.id), "close"].map((id) => ({ id, src: PHOTOS[id].src, focus: PHOTOS[id].focus }));

// The chapter's photograph as a plain image: seen without WebGL or script.
function Still({ id }) {
  const p = PHOTOS[id];
  return (
    // eslint-disable-next-line @next/next/no-img-element -- pre-built static WebP
    <img src={optSrc(p.src, 1600)} srcSet={optSrcSet(p.src)} sizes="100vw" alt="" loading="lazy" decoding="async" className="mind-still absolute inset-0 -z-10 h-full w-full object-cover" />
  );
}

function Chapter({ index, region, subtitle, body, children }) {
  return (
    <section id={region.id} data-mind={region.id} data-mind-chapter aria-labelledby={`${region.id}-title`} className="relative flex min-h-[150svh] items-center overflow-hidden">
      <Still id={region.id} />
      <div className="mx-auto w-full max-w-[1440px] px-5 py-32 md:px-10">
        <div className="max-w-[520px]">
          <p data-in className="font-serif text-[18px] text-ink/70">{String(index + 1).padStart(2, "0")}</p>
          <h2 id={`${region.id}-title`} data-in className="mt-3 font-serif text-[clamp(52px,6.4vw,104px)] leading-[0.95] tracking-[-0.015em] text-ink">
            {region.name}
          </h2>
          <p data-in className="mt-6 max-w-[22ch] font-serif text-[clamp(22px,2vw,30px)] leading-[1.25] text-ink/90">
            {subtitle}
          </p>
          <p data-in className="mt-6 max-w-[46ch] text-[16px] leading-[1.7] text-ink/75">
            {body}
          </p>
          <Explore name={region.name} color={region.color}>
            {children}
          </Explore>
        </div>
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

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(personJsonLd(person)) }} />
      <Mind regions={REGIONS} frames={FRAMES}>
        <header className="fixed inset-x-0 top-0 z-40">
          <div className="mx-auto flex h-16 max-w-[1440px] items-center justify-between gap-6 px-5 md:h-20 md:px-10">
            <a href="#top" className="text-[14px] font-semibold uppercase tracking-[0.32em] text-ink">
              RayMindset
            </a>
            <nav aria-label="Primary" className="flex items-center gap-6">
              <ul className="hidden items-center gap-6 text-[13px] text-ink/75 lg:flex">
                <li>
                  <a href="#top" className="transition-colors duration-200 hover:text-ink">
                    Home
                  </a>
                </li>
                {REGIONS.map((r) => (
                  <li key={r.id}>
                    <a href={`#${r.id}`} className="transition-colors duration-200 hover:text-ink">
                      {r.name}
                    </a>
                  </li>
                ))}
              </ul>
              <a href="#connect" className="rounded-full border border-ink/35 px-4 py-2 text-[13px] text-ink transition-colors duration-200 hover:bg-ink hover:text-ground lg:hidden">
                Get in touch
              </a>
            </nav>
          </div>
        </header>

        <main id="main">
          <section id="top" data-mind="hero" aria-labelledby="hero-title" className="relative flex min-h-svh items-end pb-[12svh] lg:items-center lg:pb-0">
            <div className="mx-auto w-full max-w-[1440px] px-5 md:px-10">
              <div className="mind-hero-in max-w-[600px]">
                <h1 id="hero-title" className="font-serif text-[clamp(44px,5.8vw,92px)] uppercase leading-[1] tracking-[0.01em] text-ink">
                  Welcome to
                  <br />
                  Ray&apos;s mind.
                </h1>
                <p className="mt-6 max-w-[34ch] text-[17px] leading-[1.6] text-ink/80 md:text-[19px]">
                  An evolving universe of ideas, experiences, ventures and possibilities.
                </p>
                <a href="#map" className="mt-12 inline-flex items-center gap-3 text-[13px] text-ink/75 transition-colors hover:text-ink">
                  <span className="grid size-9 place-items-center rounded-full border border-ink/35">
                    <span className="mind-scroll-dot block size-1 rounded-full bg-ink" />
                  </span>
                  Scroll to explore
                </a>
              </div>
            </div>
          </section>

          <section id="map" data-mind="map" aria-labelledby="map-title" className="relative flex min-h-[170svh] items-end pb-[24svh]">
            <div className="mx-auto w-full max-w-[1440px] px-5 md:px-10">
              <h2 id="map-title" className="sr-only">
                The regions of Ray&apos;s mind
              </h2>
              <p className="flex items-center gap-3 text-[13px] text-ink/75">
                <span className="grid size-9 place-items-center rounded-full border border-ink/35">
                  <span className="block size-1 rounded-full bg-ink" />
                </span>
                Hover a region to explore
              </p>
              {/* The same map as a plain list, for keyboards, screen readers and small screens. */}
              <ul className="mt-6 flex flex-wrap gap-x-5 gap-y-2 text-[14px] md:hidden">
                {REGIONS.map((r) => (
                  <li key={r.id}>
                    <a href={`#${r.id}`} style={{ color: r.color }}>
                      {r.name}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </section>

          <Chapter
            index={R.journey.index}
            region={R.journey.region}
            subtitle="The path that shaped who I am today."
            body={copy.originBody.text}
          >
            <p>&ldquo;{quotes.origin.text}&rdquo;</p>
            <ol className="mt-5 space-y-2">
              {timeline.map((e) => (
                <li key={e.title}>
                  <span className="text-ink">{e.title}.</span> {e.description}
                </li>
              ))}
            </ol>
          </Chapter>

          <Chapter index={R.ventures.index} region={R.ventures.region} subtitle="Ideas into impact." body={copy.buildingBody.text}>
            <p>
              <span className="text-ink">Socialsect.</span> {venture.role}. {venture.sector}. India, the US and the UK, now building in the UAE.
            </p>
            <p className="mt-4">What it holds to: {values.join(" · ")}.</p>
            <a href={venture.verifiedLinks[0].href} target="_blank" rel="noopener noreferrer" className="mt-4 inline-block border-b border-current pb-0.5 text-ink">
              Visit gosocialsect.com
            </a>
          </Chapter>

          <Chapter index={R.discipline.index} region={R.discipline.region} subtitle={st.discipline.headline.toLowerCase().replace(/^./, (c) => c.toUpperCase())} body={copy.disciplineBody.text}>
            <p>Boxing is a practice, not a title: the fight is the one before the ring.</p>
          </Chapter>

          <Chapter index={R.exploration.index} region={R.exploration.region} subtitle="New places. New perspectives." body={copy.motionBody.text}>
            <p className="font-serif text-[26px] text-ink">India · US · UK · UAE</p>
            <p className="mt-2">Where Ray has built Socialsect, and where it is growing next.</p>
          </Chapter>

          <Chapter index={R.expression.index} region={R.expression.region} subtitle={`${book.title}.`} body={`Ray wrote a book. In his words: “${copy.storiesBody.text}”`}>
            <blockquote className="font-serif text-[22px] leading-[1.45] text-ink">&ldquo;{quotes.book.text}&rdquo;</blockquote>
            <p className="mt-3 text-ink/60">From {book.title}</p>
          </Chapter>

          <Chapter index={R.ideas.index} region={R.ideas.region} subtitle="What's next." body={copy.thinkingBody.text}>
            <p className="font-serif text-[26px] text-ink">{show.title}</p>
            <p className="mt-2">{show.description}</p>
            <ul className="mt-3 space-y-1">
              {show.episodes.map((e) => (
                <li key={e.title}>
                  {e.title} <span className="text-ink/55">· {e.duration}</span>
                </li>
              ))}
            </ul>
            <p className="mt-4 flex gap-6">
              {show.links.map((l) => (
                <a key={l.href} href={l.href} target="_blank" rel="noopener noreferrer" className="border-b border-current pb-0.5 text-ink">
                  {l.label}
                </a>
              ))}
            </p>
            <p className="mt-5 font-serif text-[20px] text-ink">{st.unknown.headline.toLowerCase().replace(/^./, (c) => c.toUpperCase())}</p>
          </Chapter>

          <section data-mind="close" aria-labelledby="close-title" className="relative flex min-h-svh items-end overflow-hidden pb-[14svh]">
            <Still id="close" />
            <div className="mx-auto grid w-full max-w-[1440px] items-end gap-10 px-5 md:grid-cols-3 md:px-10">
              <h2 id="close-title" className="font-serif text-[clamp(36px,3.6vw,56px)] leading-[1.1] text-ink">
                Different thoughts.
                <br />
                One mind.
              </h2>
              <a href="#top" className="flex flex-col items-center gap-3 text-[13px] text-ink/70 hover:text-ink">
                <span className="block h-16 w-px bg-ink/40" />
                Back to top
              </a>
              <a href="#connect" className="group md:justify-self-end">
                <span className="text-[18px] text-ink">Let&apos;s build what&apos;s next.</span>
                <span className="mt-3 flex items-center gap-3 text-ink/70 group-hover:text-ink">
                  <span className="block h-px w-24 bg-current transition-[width] duration-300 group-hover:w-32" />
                  <svg viewBox="0 0 16 16" aria-hidden="true" className="size-4">
                    <path d="M2 8h11M9 4l4 4-4 4" fill="none" stroke="currentColor" strokeWidth="1.4" />
                  </svg>
                </span>
              </a>
            </div>
          </section>

          <div className="relative bg-ground">
            <Connect copy={copy} categories={content.contactCategories} links={content.contactLinks} />
          </div>
        </main>
        <div className="relative bg-ground pb-10">
          <Footer person={person} images={CREDITS} links={content.contactLinks} />
        </div>
      </Mind>
    </>
  );
}
