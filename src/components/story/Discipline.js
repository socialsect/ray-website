import Heading from "@/components/ui/Heading";

// Discipline: Ray's words on the left; on the right, the camera stands at
// the arena as its single hard light comes on.
export default function Discipline({ station, copy, image }) {
  return (
    <section id="discipline" data-section="discipline" aria-labelledby="discipline-title" className="relative py-28 md:py-44">
      <div className="mx-auto max-w-[1440px] px-4 md:px-8">
        <Heading id="discipline-title" className="lg:max-w-[64%]">
          {station.headline}
        </Heading>
        <div className="mt-10 lg:flex lg:items-stretch lg:justify-between lg:gap-12">
          <div className="lg:w-[44%]">
          <p data-reveal className="text-[19px] leading-[1.55] md:text-[22px]">
            &ldquo;{copy.disciplineBody.text}&rdquo;
          </p>
          </div>
        </div>
      </div>
    </section>
  );
}
