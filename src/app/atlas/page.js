import Experience from "@/components/layout/Experience";
import { optSrc, optSrcSet } from "@/lib/content/images";
import Building from "@/components/story/Building";
import Connect from "@/components/story/Connect";
import Discipline from "@/components/story/Discipline";
import Footer from "@/components/story/Footer";
import Hero from "@/components/story/Hero";
import Identity from "@/components/story/Identity";
import Motion from "@/components/story/Motion";
import Origin from "@/components/story/Origin";
import Stories from "@/components/story/Stories";
import Thinking from "@/components/story/Thinking";
import Unknown from "@/components/story/Unknown";
import { getHomeContent } from "@/lib/content";
import { personJsonLd } from "@/lib/seo/jsonld";

export const metadata = {
  title: "The Atlas — RayMindset",
  alternates: { canonical: "/atlas" },
};

export default async function AtlasPage() {
  const content = await getHomeContent();
  const { copy, person, images } = content;
  const st = Object.fromEntries(content.stations.map((s) => [s.id, s]));
  const stationMeta = content.stations.map(({ id, name, line }) => ({ id, name, line }));
  const frames = content.stage.map((f) => ({ id: f.section, src: images[f.image].src, focus: f.focus }));
  const opening = images[content.stage[0].image];

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(personJsonLd(person)) }} />
      <Experience
        stations={stationMeta}
        frames={frames}
        still={
          // eslint-disable-next-line @next/next/no-img-element -- pre-built static WebP
          <img
            src={optSrc(opening.src, 1600)}
            srcSet={optSrcSet(opening.src)}
            sizes="100vw"
            alt=""
            fetchPriority="high"
            decoding="async"
            className="absolute inset-0 h-full w-full object-cover object-[50%_42%]"
          />
        }
      >
        <main>
          <Hero copy={copy} person={person} />
          <Identity copy={copy} person={person} quotes={content.quotes} />
          <Origin station={st.origin} copy={copy} timeline={content.timeline} quote={content.quotes.origin} />
          <Building station={st.building} copy={copy} ventures={content.ventures} values={content.values} image={images.dubai} />
          <Discipline station={st.discipline} copy={copy} image={images.boxer} />
          <Motion station={st.motion} copy={copy} image={images.departures} />
          <Stories station={st.stories} copy={copy} book={content.book} quote={content.quotes.book} />
          <Thinking station={st.thinking} copy={copy} topics={content.topics} media={content.media} />
          <Unknown station={st.unknown} copy={copy} possibilities={content.possibilities} image={images.tungnath} />
          <Connect copy={copy} categories={content.contactCategories} links={content.contactLinks} />
        </main>
        <Footer person={person} images={images} links={content.contactLinks} />
      </Experience>
    </>
  );
}
