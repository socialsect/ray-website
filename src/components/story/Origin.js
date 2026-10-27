import { lineColors } from "@/components/scenes/network";
import Heading from "@/components/ui/Heading";
import Quote from "@/components/ui/Quote";
import { StationMark } from "@/components/ui/Status";

const lineNames = { building: "Building", discipline: "Discipline", exploration: "Exploration", thinking: "Thinking" };

// Where it starts: the camera looks down on the plaza where every walkway
// begins, while Ray tells how the first doctor led to everything else.
export default function Origin({ station, copy, timeline, quote }) {
  const stops = timeline.filter((e) => e.visibility === "public");
  return (
    <section id="origin" data-section="origin" aria-labelledby="origin-title" className="relative py-28 md:py-44">
      <div className="mx-auto max-w-[1440px] px-4 md:px-8">
        <Heading id="origin-title" className="lg:max-w-[64%]">
          {station.headline}
        </Heading>
        <div className="mt-8 lg:flex lg:items-stretch lg:justify-between lg:gap-12">
          <div className="lg:w-[46%]">
          <p data-reveal className="font-display text-[28px] font-bold uppercase leading-[1.05] text-building-ink md:text-[37px]">
            {copy.originBody.text}
          </p>
          <Quote quote={quote} className="mt-10" />

          <div data-reveal style={{ "--i": 1 }} className="mt-12 bg-raised/95">
            <table className="w-full border-collapse text-left pb-4">
              <caption className="px-6 pb-2 pt-6 text-left text-[17px] font-semibold md:px-8">The journey so far</caption>
              <thead>
                <tr className="text-[14px] text-muted">
                  <th scope="col" className="px-6 py-3 font-normal md:px-8">Stop</th>
                  <th scope="col" className="hidden px-4 py-3 font-normal sm:table-cell">Line</th>
                </tr>
              </thead>
              <tbody>
                {stops.map((e) => (
                  <tr key={e.title} className="border-t border-ink/10 align-top">{/* taste-skill-ignore: real table row */}
                    <th scope="row" className="px-6 py-4 font-normal md:px-8">
                      <span className="flex items-start gap-3">
                        <span className="mt-1.5">
                          <StationMark status={e.verificationStatus} color={lineColors[e.line]} />
                        </span>
                        <span>
                          <span className="block text-[17px] font-semibold">{e.title}</span>
                          <span className="block text-[14px] text-muted">{e.description}</span>
                        </span>
                      </span>
                    </th>
                    <td className="hidden px-4 py-4 text-[14px] sm:table-cell">{lineNames[e.line]}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          </div>
        </div>
      </div>
    </section>
  );
}
