import Heading from "@/components/ui/Heading";
import WorldImage from "@/components/ui/WorldImage";

// Motion: the camera stands at the corridor of gates, which light one after
// another like departures, while Ray talks about airports and clocks.
export default function Motion({ station, copy, image }) {
  return (
    <section id="motion" data-section="motion" aria-labelledby="motion-title" className="relative py-28 md:py-44">
      <div className="mx-auto max-w-[1440px] px-4 md:px-8">
        <Heading id="motion-title" className="lg:max-w-[64%]">
          {station.headline}
        </Heading>
        <div className="mt-10 lg:flex lg:items-stretch lg:justify-between lg:gap-12">
          <div className="lg:w-[44%]">
          <p data-reveal className="text-[19px] leading-[1.55] md:text-[22px]">&ldquo;{copy.motionBody.text}&rdquo;</p>
          <div data-reveal style={{ "--i": 2 }} className="luggage-tag mt-12 max-w-[460px] bg-paper py-6 pl-16 pr-8 text-ground">
            <p className="font-display text-[28px] font-bold uppercase leading-tight">India · US · UK · UAE</p>
            <p className="mt-2 text-[17px] leading-[1.55]">
              Where Ray has built Socialsect, and where it is growing next.
            </p>
          </div>
          <div data-reveal style={{ "--i": 1 }} className="mt-10">
            <WorldImage
              image={image}
              sizes="(min-width: 1024px) 40vw, 100vw"
              imgClassName="aspect-[4/3]"
              captionClassName="!mt-0 bg-exploration px-5 py-4 text-ground"
            />
          </div>
          </div>
        </div>
      </div>
    </section>
  );
}
