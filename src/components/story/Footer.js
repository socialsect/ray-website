// A finished site's close: the name at full width, the real ways to reach
// Ray, and the photographers credited as their licences require.
export default function Footer({ person, images, links }) {
  const credits = Object.values(images);
  return (
    <footer id="site-footer" className="relative z-10 pt-16">
      <div className="mx-auto max-w-[1440px] px-4 md:px-8">
        <div className="scallop-top bg-paper px-6 pb-10 pt-16 text-ground md:px-12 md:pt-20">
          <div className="grid gap-10 lg:grid-cols-12">
            <div className="lg:col-span-5">
              <p className="font-display text-[clamp(30px,3vw,44px)] font-bold uppercase leading-[0.95]">Still being written.</p>
              <p className="mt-4 max-w-[44ch] text-[17px] leading-[1.6]">
                Founder of Socialsect. Writer, traveler and boxer. Host of One Day with Ray.
              </p>
            </div>
            <nav aria-label="Footer" className="grid grid-cols-2 gap-x-8 gap-y-3 text-[17px] lg:col-span-6 lg:col-start-7">
              {[
                ["#origin", "Story"],
                ["#building", "Work"],
                ["#thinking", "Ideas"],
                ["#connect", "Get in touch"],
              ].map(([href, label]) => (
                <a key={href} href={href} className="underline decoration-ground/40 hover:decoration-ground">
                  {label}
                </a>
              ))}
              {links.map((l) => (
                <a key={l.href} href={l.href} target="_blank" rel="noopener noreferrer" className="underline decoration-ground/40 hover:decoration-ground">
                  {l.label}
                </a>
              ))}
            </nav>
          </div>
          <p
            aria-hidden="true"
            className="mt-16 select-none font-display text-[clamp(64px,15.5vw,236px)] font-extrabold uppercase leading-[0.8] tracking-[-0.03em]"
          >
            RayMindset
          </p>
          <div className="mt-8 flex flex-col gap-4 text-[14px] md:flex-row md:items-start md:justify-between">
            <p>© 2026 {person.canonicalName}</p>
            <details className="md:max-w-[60%] md:text-right">
              <summary className="cursor-pointer underline decoration-ground/40">Photo credits</summary>
              <p className="mt-3 text-left leading-[1.65]">
                {credits.map((img, i) => (
                  <span key={img.src}>
                    <a href={img.credit.page} target="_blank" rel="noopener noreferrer" className="underline">
                      {img.credit.title}
                    </a>{" "}
                    by {img.credit.creator},{" "}
                    <a href={img.credit.licenseUrl} target="_blank" rel="noopener noreferrer license" className="underline">
                      {img.credit.license}
                    </a>
                    {i < credits.length - 1 ? "; " : "."}
                  </span>
                ))}
              </p>
            </details>
          </div>
        </div>
      </div>
    </footer>
  );
}
