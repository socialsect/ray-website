import { Cormorant_Garamond } from "next/font/google";
import Discover from "@/components/doors/Discover";
import Doors from "@/components/doors/Doors";
import { chapters } from "@/components/doors/world";
import { getHomeContent } from "@/lib/content";
import { optSrc, optSrcSet } from "@/lib/content/images";
import { personJsonLd } from "@/lib/seo/jsonld";

const display = Cormorant_Garamond({ subsets: ["latin"], weight: ["500", "600"], display: "swap", variable: "--font-display-serif" });

export const viewport = { themeColor: "#0d0c0b", colorScheme: "dark" };

const EMAIL = "sales@gosocialsect.com";
const C = Object.fromEntries(chapters.map((c, i) => [c.id, { ...c, n: String(i + 1).padStart(2, "0") }]));

// Words that surface from below their own edge, one after another.
function Rise({ text }) {
  return (
    <span aria-hidden="true">
      {text.split(" ").map((w, i) => (
        <span key={i} className="inline-block overflow-hidden pb-[0.06em] align-bottom">
          <span data-word className="inline-block">{w}&nbsp;</span>
        </span>
      ))}
    </span>
  );
}

// A small mouse, the reference's cue to scroll.
function Mouse() {
  return (
    <span aria-hidden="true" className="relative inline-block h-8 w-5 rounded-full border border-ivory/80">
      <span className="rm-wheel absolute left-1/2 top-1.5 h-1.5 w-[2px] -translate-x-1/2 rounded-full bg-ivory" />
    </span>
  );
}

// Every chapter: its number, name and line, one short sentence in Ray's
// words, and "Discover" for the fuller story. The world fills the screen.
function Chapter({ id, line, source, children }) {
  const c = C[id];
  return (
    <section id={id} tabIndex={-1} data-door={id} data-shade="0.9,0.25,0.3,0.25,0" aria-labelledby={`${id}-title`} className="relative min-h-[220svh] outline-none">
      <div className="rm-frame relative pb-24 pt-28 lg:sticky lg:top-0 lg:flex lg:min-h-svh lg:flex-col lg:pt-[18svh]">
        <div data-reveal-group className="max-w-[440px]">
          <p data-in className="rm-title text-[17px] text-gold">{c.n}</p>
          <h2 id={`${id}-title`} aria-label={`${c.name}: ${c.line}`} data-rise className="rm-title mt-2 text-[10vw] leading-[1] md:text-[clamp(36px,2.9vw,50px)]">
            <Rise text={c.name} />
          </h2>
          <p data-in className="mt-2 text-[17px]">{c.line}</p>
          <p data-in className="mt-5 max-w-[36ch] text-[15px] leading-[1.6] text-ivory/90">&ldquo;{line}&rdquo;</p>
          <p data-in className="mt-2 text-[13px] text-ivory/70">{source}</p>
          <div data-in>
            <Discover name={c.name}>{children}</Discover>
          </div>
        </div>
      </div>
    </section>
  );
}

// A photograph inside a Discover panel, with its credit.
function Picture({ img, caption, className = "aspect-[4/3]" }) {
  return (
    <figure>
      <div className={`overflow-hidden ${className}`}>
        {/* eslint-disable-next-line @next/next/no-img-element -- pre-built static WebP */}
        <img src={optSrc(img.src, 960)} srcSet={optSrcSet(img.src)} sizes="(min-width: 768px) 560px, 90vw" alt={img.alt} loading="lazy" decoding="async" className="h-full w-full object-cover" />
      </div>
      {caption && <figcaption className="mt-2 text-[13px] leading-[1.5] text-ivory/75">{caption}</figcaption>}
    </figure>
  );
}

export default async function HomePage() {
  const content = await getHomeContent();
  const { copy, quotes, person, values, timeline, images, book, media, possibilities } = content;
  const venture = content.ventures.find((v) => v.featured);
  const show = media.find((m) => m.format === "podcast");
  const credit = (i) => `${i.caption.replace(/\.$/, "")}. Photo: ${i.credit.creator}, ${i.credit.license}.`;
  const places = [
    { name: "India", note: "Socialsect is built here", img: images.tungnath },
    { name: "The US", note: "Socialsect is built here", img: { src: "/assets/world/new-york-dusk.jpg", alt: "Manhattan at dusk, the Empire State Building lit green.", caption: "New York at dusk", credit: { creator: "Dllu", license: "CC BY-SA 4.0" } } },
    { name: "The UK", note: "Socialsect is built here", img: { src: "/assets/world/london-dusk.jpg", alt: "Tower Bridge over the Thames at dusk.", caption: "Tower Bridge, London", credit: { creator: "Diliff", license: "CC BY-SA 3.0" } } },
    { name: "The UAE", note: "Building its presence now", img: images.dubai },
  ];
  const ABOUT = "Rayansh, gosocialsect.com/about";

  return (
    <div className={display.variable}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(personJsonLd(person)) }} />
      <Doors>
        <header className="absolute inset-x-0 top-0 z-40">
          <div className="rm-frame flex h-16 items-center justify-between gap-6 md:h-20">
            <a href="#top" className="text-[14px] font-semibold tracking-[0.35em]">RAYMINDSET</a>
            <nav aria-label="Primary" className="hidden lg:block">
              <ul className="flex items-center gap-7 text-[15px]">
                <li>
                  <a href="#top" className="border-b border-ivory pb-1">Home</a>
                </li>
                {chapters.map((c) => (
                  <li key={c.id}>
                    <a href={`#${c.id}`} className="pb-1 text-ivory/85 transition-colors hover:text-ivory">{c.name}</a>
                  </li>
                ))}
              </ul>
            </nav>
            {/* The menu: every chapter and the way to write, on any screen. */}
            <details className="rm-menu relative">
              <summary aria-label="Menu" className="flex size-11 cursor-pointer list-none items-center justify-center">
                <span aria-hidden="true" className="flex w-6 flex-col gap-[6px]">
                  <span className="h-px w-full bg-ivory" />
                  <span className="h-px w-full bg-ivory" />
                  <span className="h-px w-full bg-ivory" />
                </span>
              </summary>
              <ul className="absolute right-0 top-12 w-[240px] bg-ink-deep/95 py-3 text-[17px]">
                <li><a href="#top" className="flex min-h-11 items-center px-5">Home</a></li>
                {chapters.map((c) => (
                  <li key={c.id}>
                    <a href={`#${c.id}`} className="flex min-h-11 items-center gap-3 px-5">
                      <span className="text-[13px] text-gold">{C[c.id].n}</span>
                      {c.name}
                    </a>
                  </li>
                ))}
                <li><a href={`mailto:${EMAIL}?subject=Hello%20Ray`} className="flex min-h-11 items-center px-5 text-gold">Write to Ray</a></li>
              </ul>
            </details>
          </div>
        </header>

        <main id="main">
          {/* The first door. */}
          <section id="top" data-door="hero" data-shade="0.88,0.3,0.3,0.35,0" aria-labelledby="hero-title" className="relative flex min-h-svh items-start">
            <div className="rm-frame relative pt-[20svh]">
              <p className="rm-rise text-[12px] tracking-[0.35em] text-ivory/85">RAYANSH SINGH</p>
              <h1 id="hero-title" className="rm-title rm-hero mt-4 max-w-[13ch] text-[10vw] leading-[1] md:text-[clamp(40px,3.4vw,60px)]">
                Welcome to Ray&apos;s mind
              </h1>
              <div className="rm-rise">
                <p className="mt-5 text-[18px]">{person.bioShort}</p>
                <p className="mt-2 max-w-[38ch] text-[15px] leading-[1.55] text-ivory/80">Walk through the worlds that shaped him: Socialsect, boxing, travel, his book and his podcast.</p>
                <span aria-hidden="true" className="mt-7 block h-px w-12 bg-ivory/60" />
                <a href="#threshold" data-enter className="group mt-7 inline-flex min-h-11 items-center gap-4 text-[15px]">
                  <Mouse />
                  <span>Scroll to explore</span>
                  <svg viewBox="0 0 16 16" aria-hidden="true" className="size-4 transition-transform group-hover:translate-x-1"><path d="M2 8h11M9 4l4 4-4 4" fill="none" stroke="currentColor" strokeWidth="1.6" /></svg>
                </a>
              </div>
            </div>
          </section>

          {/* The first door opens while this is read. */}
          <section id="threshold" tabIndex={-1} data-door="threshold" data-shade="0,0,0,0.75,0" aria-labelledby="threshold-title" className="relative min-h-[170svh] outline-none">
            <div data-reveal-group className="rm-frame sticky top-0 flex h-svh flex-col items-center justify-end pb-[14svh] text-center">
              <h2 id="threshold-title" aria-label="I've never been just one thing." data-rise className="rm-title text-[9vw] leading-[1] md:text-[clamp(44px,4.4vw,76px)]">
                <Rise text="I've never been just one thing." />
              </h2>
              <p data-in className="mt-5 max-w-[44ch] text-[17px] leading-[1.5]">&ldquo;{copy.identityBody.text}&rdquo;</p>
            </div>
          </section>

          <Chapter id="journey" line={copy.originBody.text} source={ABOUT}>
            <div className="flex items-end gap-5">
              <div className="w-[38%] shrink-0">
                <Picture img={person.portrait} className="aspect-[4/5]" />
              </div>
              <p className="text-[16px] leading-[1.6]">&ldquo;{copy.identityBody.text}&rdquo;</p>
            </div>
            <p className="mt-5 text-[16px] leading-[1.6]">&ldquo;{quotes.origin.text}&rdquo;</p>
            <ol className="mt-5 space-y-2 text-[15px] leading-[1.5]">
              {timeline.slice(0, 5).map((e) => (
                <li key={e.title}><span className="font-semibold">{e.title}.</span> <span className="text-ivory/85">{e.description}</span></li>
              ))}
            </ol>
            <p className="mt-4 text-[13px] text-ivory/70">Ray&apos;s photograph and words, from gosocialsect.com/about. Dates are being added with him.</p>
          </Chapter>

          <Chapter id="ventures" line="I built Socialsect because I kept seeing brilliant doctors being let down by agencies that didn't understand their world." source={ABOUT}>
            <p className="rm-title text-[40px] leading-none text-gold">{venture.name}</p>
            <p className="mt-3 text-[15px]">{venture.role} · {venture.sector} · India, the US and the UK; building in the UAE</p>
            <p className="mt-5 text-[16px] leading-[1.6]">&ldquo;{copy.buildingBody.text}&rdquo;</p>
            <ul className="mt-5 grid grid-cols-1 gap-x-6 gap-y-1 text-[16px] sm:grid-cols-2">
              {values.map((v) => <li key={v}>{v}</li>)}
            </ul>
            <a href={venture.verifiedLinks[0].href} target="_blank" rel="noopener noreferrer" className="rm-button mt-6">Visit gosocialsect.com</a>
          </Chapter>

          <Chapter id="discipline" line="Boxing taught me that the most important fight is the one you have with yourself before you ever step into the ring." source={ABOUT}>
            <p className="text-[16px] leading-[1.6]">&ldquo;{copy.disciplineBody.text}&rdquo; Boxing is a practice for Ray, not a title.</p>
            <div className="mt-5"><Picture img={images.boxer} caption={`${credit(images.boxer)} Not Ray: his own training footage will be added once approved.`} /></div>
          </Chapter>

          <Chapter id="exploration" line="Somewhere between all the airports and different clocks, I learned that the best businesses are built on understanding people, not markets." source={ABOUT}>
            <ul className="grid grid-cols-2 gap-4">
              {places.map((p) => (
                <li key={p.name}>
                  <Picture img={p.img} />
                  <p className="rm-title mt-2 text-[24px] leading-none">{p.name}</p>
                  <p className="mt-1 text-[14px] text-ivory/85">{p.note}</p>
                </li>
              ))}
            </ul>
            <p className="mt-4 text-[13px] leading-[1.5] text-ivory/70">Pictures: {places.map((p) => credit(p.img)).join(" ")} Ray&apos;s own travel photographs are to be added.</p>
          </Chapter>

          <Chapter id="expression" line="We spend our lives collecting things worth carrying." source={`From ${book.title}, quoted on gosocialsect.com/about`}>
            <p className="text-[16px] leading-[1.6]">Ray wrote a book, <em>{book.title}</em>. In his words: &ldquo;{copy.storiesBody.text}&rdquo;</p>
            <blockquote className="mt-5 text-[19px] leading-[1.5]">&ldquo;{quotes.book.text}&rdquo;</blockquote>
            <p className="mt-4 text-[13px] text-ivory/70">{book.note}</p>
          </Chapter>

          <Chapter id="ideas" line="The day I stop being curious is the day I stop being useful." source={ABOUT}>
            <p className="rm-title text-[34px] leading-none">{show.title}</p>
            <p className="mt-2 text-[14px] text-ivory/80">A podcast hosted by {show.host}.</p>
            <p className="mt-3 text-[16px] leading-[1.55]">{show.description}</p>
            <ul className="mt-3 space-y-1 text-[15px]">
              {show.episodes.map((e) => <li key={e.title}>{e.title} <span className="text-ivory/70">· {e.duration}</span></li>)}
            </ul>
            <p className="mt-4 flex flex-wrap gap-x-6 gap-y-2 text-[15px]">
              {show.links.map((l) => <a key={l.href} href={l.href} target="_blank" rel="noopener noreferrer" className="rm-link">Listen on {l.label}</a>)}
            </p>
            <p className="mt-6 text-[14px] text-ivory/80">The unknown ahead. Future possibilities, not achievements:</p>
            <ul className="mt-2 space-y-1 text-[16px]">
              {possibilities.map((p) => <li key={p.text}>{p.text}</li>)}
            </ul>
          </Chapter>

          {/* Through the final door, into the light. */}
          <section id="close" data-door="close" data-shade="0.88,0.3,0.25,0.55,0.15" aria-labelledby="close-title" className="relative flex min-h-[150svh] items-end">
            <div data-reveal-group className="rm-frame relative pb-[16svh]">
              <p data-in className="text-[12px] tracking-[0.35em] text-ivory/90">RAYANSH SINGH</p>
              <h2 id="close-title" aria-label="Still being written." data-rise className="rm-title mt-4 max-w-[14ch] text-[10vw] leading-[1] md:text-[clamp(38px,3.2vw,56px)]">
                <Rise text="Still being written." />
              </h2>
              <p data-in className="mt-5 text-[17px]">{person.bioShort}</p>
              <p data-in className="mt-5 max-w-[44ch] text-[17px] leading-[1.6] text-ivory/90">&ldquo;{copy.unknownBody.text}&rdquo;</p>
              <p data-in className="mt-1 text-[13px] text-ivory/75">{ABOUT}</p>
            </div>
          </section>
        </main>

        <footer className="relative z-10 overflow-hidden bg-ink-deep">
          <div className="rm-frame grid gap-14 pb-16 pt-24 md:grid-cols-2 lg:grid-cols-12 lg:gap-8">
            <div className="md:col-span-2 lg:col-span-5">
              <p className="text-[13px] font-semibold tracking-[0.35em]">RAYMINDSET</p>
              <p className="rm-title mt-6 max-w-[16ch] text-[34px] leading-[1.05] md:text-[44px]">Good conversations change things.</p>
              <p className="mt-5 max-w-[42ch] text-[16px] leading-[1.6] text-ivory/85">{copy.contactBody.text}</p>
              <a href={`mailto:${EMAIL}?subject=Hello%20Ray`} className="rm-button mt-8">Write to Ray</a>
            </div>
            <nav aria-label="Chapters in the footer" className="lg:col-span-3 lg:col-start-7">
              <p className="text-[13px] tracking-[0.25em] text-gold">EXPLORE</p>
              <ol className="mt-5 space-y-3 text-[16px]">
                {chapters.map((c) => (
                  <li key={c.id}>
                    <a href={`#${c.id}`} className="group inline-flex items-baseline gap-3 text-ivory/90 transition-colors hover:text-ivory">
                      <span className="w-6 text-[13px] text-ivory/55 group-hover:text-gold">{C[c.id].n}</span>
                      {c.name}
                    </a>
                  </li>
                ))}
              </ol>
            </nav>
            <div className="lg:col-span-3">
              <p className="text-[13px] tracking-[0.25em] text-gold">CONNECT</p>
              <ul className="mt-5 space-y-3 text-[16px]">
                <li><a href={`mailto:${EMAIL}?subject=Hello%20Ray`} className="rm-link">{EMAIL}</a></li>
                <li><a href={venture.verifiedLinks[0].href} target="_blank" rel="noopener noreferrer" className="rm-link">Socialsect</a></li>
                {show.links.map((l) => (
                  <li key={l.href}><a href={l.href} target="_blank" rel="noopener noreferrer" className="rm-link">{show.title} on {l.label}</a></li>
                ))}
              </ul>
              <a href="#top" className="mt-10 inline-flex items-center gap-3 text-[15px] text-ivory/90 hover:text-ivory">
                <Mouse />
                Back to top
              </a>
            </div>
          </div>
          <div className="rm-frame"><div className="flex flex-wrap items-center justify-between gap-x-8 gap-y-2 border-t border-ivory/15 py-6 text-[13px] text-ivory/70">
            <p>© 2026 {person.canonicalName}</p>
            <p>Every world is real-time 3D, built in code. Surfaces: Poly Haven, CC0. Words and photograph: Rayansh Singh, gosocialsect.com/about.</p>
          </div></div>
          <p aria-hidden="true" className="rm-title select-none whitespace-nowrap pb-2 text-center text-[13.5vw] leading-[0.8] text-ivory/[0.07]">Raymindset</p>
        </footer>
      </Doors>
    </div>
  );
}
