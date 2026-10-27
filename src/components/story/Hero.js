import { lineColors } from "@/components/scenes/network";

const legend = [
  { line: "building", name: "Building", note: "Socialsect, and what comes next", href: "#building" },
  { line: "discipline", name: "Discipline", note: "The fight before the ring", href: "#discipline" },
  { line: "exploration", name: "Exploration", note: "India, the US, the UK, and a book", href: "#motion" },
  { line: "thinking", name: "Thinking", note: "A podcast, and essays to come", href: "#thinking" },
];

// The opening title: the headline is split into masked words so the title
// sequence can raise them one by one; without script it simply shows.
export default function Hero({ copy }) {
  const words = copy.hero.text.split(" ");
  return (
    <section
      id="top"
      data-section="hero"
      aria-labelledby="hero-title"
      className="relative flex min-h-svh flex-col justify-between pb-6 pt-28 md:pb-10 md:pt-36"
    >
      {/* A soft paper band under the legend so every line of it reads. */}
      <div aria-hidden="true" className="scrim-bottom pointer-events-none absolute inset-x-0 -bottom-[22%] h-[68%]" />

      <div className="relative mx-auto w-full max-w-[1440px] px-4 md:px-8">
        <h1
          data-depth-layer
          id="hero-title"
          className="max-w-[11ch] font-display text-[clamp(60px,10.4vw,168px)] font-extrabold uppercase leading-[0.86] tracking-[-0.02em] text-ink"
        >
          {words.map((w, i) => (
            <span key={i}>
              <span className="inline-block overflow-hidden pb-[0.04em] align-bottom">
                <span data-word className="inline-block">
                  {w}
                </span>
              </span>
              {i < words.length - 1 ? " " : null}
            </span>
          ))}
        </h1>
        <p data-hero-rest className="mt-8 max-w-[36ch] text-[19px] leading-[1.45] text-ink md:mt-10 md:text-[22px]">
          {copy.heroSub.text}
        </p>
        <div data-hero-rest className="mt-9 flex flex-wrap items-center gap-x-8 gap-y-4">
          <a
            href="#identity"
            data-action="enter"
            className="inline-flex min-h-14 items-center bg-paper px-8 text-[17px] font-semibold text-ground transition-transform duration-200 ease-out-expo hover:-translate-y-0.5 active:translate-y-0"
          >
            Enter the mind
          </a>
          <a
            href="#identity"
            data-action="skip"
            className="inline-flex min-h-12 items-center text-[17px] text-ink underline decoration-ink/50 transition-colors duration-200 hover:decoration-ink"
          >
            Skip intro
          </a>
        </div>
      </div>

      <div data-hero-rest className="relative mx-auto mt-16 w-full max-w-[1440px] px-4 md:px-8">
        <ul aria-label="The four lines through the Atlas" className="grid grid-cols-2 gap-x-6 gap-y-5 lg:grid-cols-4 lg:gap-x-10">
          {legend.map((l) => (
            <li key={l.line}>
              <a
                href={l.href}
                data-line-preview={l.line}
                className="group block py-1 text-ink transition-transform duration-200 ease-out-expo hover:-translate-y-1 focus-visible:-translate-y-1"
              >
                <span
                  className="block h-1.5 w-12 rounded-full transition-[width] duration-300 ease-out-expo group-hover:w-20 group-focus-visible:w-20"
                  style={{ background: lineColors[l.line] }}
                />
                <span className="mt-3 block font-display text-[22px] font-bold uppercase leading-none">{l.name}</span>
                <span className="mt-1.5 block text-[14px] leading-snug text-ink/80">{l.note}</span>
              </a>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
