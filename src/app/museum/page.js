import Link from "next/link";
import Museum from "@/components/museum/Museum";
import Connect from "@/components/story/Connect";
import Footer from "@/components/story/Footer";
import { getHomeContent } from "@/lib/content";

export const metadata = {
  title: "The Mind Museum — RayMindset",
  description: "Walk through the rooms of Rayansh Singh's mind: the work, the ring, the road, the book and the ideas.",
  alternates: { canonical: "/museum" },
};

const MUSEUM_PHOTO = {
  src: "/assets/museum/leeds-gallery.jpg",
  width: 4932,
  height: 3799,
  alt: "An empty gallery with a glass barrel-vaulted roof and a classical arched niche in its white back wall.",
  caption: "An empty gallery, Leeds Art Gallery.",
  credit: {
    title: "An Empty Gallery in Leeds Art Gallery",
    creator: "Andy Beecroft",
    license: "CC BY-SA 2.0",
    licenseUrl: "https://creativecommons.org/licenses/by-sa/2.0/",
    page: "https://commons.wikimedia.org/wiki/File:An_Empty_Gallery_in_Leeds_Art_Gallery_-_geograph.org.uk_-_7848134.jpg",
  },
};

// Every room's words come from Ray's own published writing or the approved
// headlines already used on the main site; nothing new is claimed here.
export default async function MuseumPage() {
  const content = await getHomeContent();
  const { copy, quotes, book, media, person } = content;
  const st = Object.fromEntries(content.stations.map((s) => [s.id, s]));
  const show = media.find((m) => m.format === "podcast");
  const firstSentence = (t) => t.split(/(?<=\.)\s/)[0];

  const rooms = [
    { id: "hall", name: "The hall", title: "Ray's mind.", body: `${person.canonicalName}. Founder of Socialsect. Writer, traveler and boxer.` },
    { id: "identity", name: "Ray", title: copy.identityHeadline.text, body: copy.identityBody.text },
    { id: "origin", name: "Origin", title: copy.originBody.text, body: "It was a systems problem dressed up as a marketing problem. I fixed the system. It worked." },
    { id: "building", name: "Building", title: "Socialsect.", body: copy.buildingBody.text },
    { id: "discipline", name: "Discipline", title: st.discipline.headline, body: firstSentence(copy.disciplineBody.text) },
    { id: "motion", name: "Motion", title: st.motion.headline, body: copy.motionBody.text },
    { id: "stories", name: "Stories", title: `${book.title}.`, body: quotes.book.text },
    { id: "thinking", name: "Thinking", title: `${show.title}.`, body: show.description, links: show.links },
    { id: "unknown", name: "The Unknown", title: st.unknown.headline, body: copy.unknownBody.text },
  ];

  return (
    <>
      <header className="fixed inset-x-0 top-0 z-40 bg-ground/90">
        <div className="mx-auto flex h-16 max-w-[1440px] items-center justify-between gap-6 px-4 md:h-20 md:px-8">
          <Link href="/museum" className="font-display text-[22px] font-bold tracking-[-0.01em] text-ink">
            RayMindset
          </Link>
          <nav aria-label="Primary" className="flex items-center gap-1 md:gap-2">
            <Link href="/atlas" className="hidden px-4 py-2 text-[14px] text-ink transition-colors duration-200 hover:bg-raised sm:inline-block">
              The Atlas
            </Link>
            <a href="#connect" className="bg-ink px-5 py-2.5 text-[14px] font-semibold text-ground transition-transform duration-200 hover:-translate-y-0.5">
              Get in touch
            </a>
          </nav>
        </div>
      </header>
      <main id="main">
        <h1 className="sr-only">The Mind Museum: {person.canonicalName}</h1>
        <Museum rooms={rooms} photo={MUSEUM_PHOTO} />
        <Connect copy={copy} categories={content.contactCategories} links={content.contactLinks} />
      </main>
      <Footer person={person} images={{ gallery: MUSEUM_PHOTO }} links={content.contactLinks} />
    </>
  );
}
