import Heading from "@/components/ui/Heading";
import { StationMark } from "@/components/ui/Status";

// The Unknown: the bridge rises toward the horizon and stops in glass.
// Every line here is a possibility, never something done.
export default function Unknown({ station, copy, possibilities, image }) {
  return (
    <section id="unknown" data-section="unknown" aria-labelledby="unknown-title" className="relative py-28 md:py-44">
      <div className="mx-auto max-w-[1440px] px-4 md:px-8">
        <Heading id="unknown-title" className="lg:max-w-[70%]">
          {station.headline}
        </Heading>
        <div className="mt-10 lg:flex lg:items-stretch lg:justify-between lg:gap-12">
          <div className="lg:w-[44%]">
          <p data-reveal className="text-[19px] leading-[1.55] md:text-[22px]">&ldquo;{copy.unknownBody.text}&rdquo;</p>
          <div data-reveal style={{ "--i": 1 }} className="ticket-stock mt-10 bg-paper px-8 py-8 text-ground md:px-10">
            <p className="text-[17px] leading-[1.55]">And the questions I keep coming back to:</p>
            <ul className="mt-5 space-y-3">
              {possibilities.map((p) => (
                <li key={p.text} className="flex items-start gap-3 text-[17px] font-semibold leading-snug">
                  <span className="mt-1">
                    <StationMark status={p.verificationStatus} />
                  </span>
                  {p.text}
                </li>
              ))}
            </ul>
          </div>
          </div>
        </div>
      </div>
    </section>
  );
}
