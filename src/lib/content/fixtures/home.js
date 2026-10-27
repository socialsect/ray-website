// Local seed content for the homepage. Every statement carries a verification
// status (CONTENT_WRITING.md, "Factual control"). "verified" means Ray
// published it himself: his words on gosocialsect.com/about (read 2026-10-26)
// and his podcast listing. "editorial-draft" lines come from the developer
// pack and still need his approval. Nothing here is invented biography.

const images = {
  salkCourtyard: {
    src: "/assets/stage/salk-courtyard.jpg",
    width: 3840,
    height: 2880,
    alt: "The Salk Institute courtyard: two rows of concrete towers frame a channel of water running to the Pacific horizon under a blue sky.",
    caption: "The Salk Institute courtyard, La Jolla, California.",
    credit: {
      title: "Salk Institute 2",
      creator: "Codera23",
      license: "CC BY-SA 4.0",
      licenseUrl: "https://creativecommons.org/licenses/by-sa/4.0/",
      page: "https://commons.wikimedia.org/w/index.php?curid=81787561",
    },
  },
  salkSunset: {
    src: "/assets/stage/salk-sunset.jpg",
    width: 1920,
    height: 1440,
    alt: "The Salk Institute courtyard at sunset, the water channel glowing toward a golden sea.",
    caption: "The Salk Institute at sunset.",
    credit: {
      title: "Salk Institute",
      creator: "TheNose",
      license: "CC BY-SA 2.0",
      licenseUrl: "https://creativecommons.org/licenses/by-sa/2.0/",
      page: "https://commons.wikimedia.org/w/index.php?curid=1708238",
    },
  },
  vatican: {
    src: "/assets/stage/vatican-stair.jpg",
    width: 1920,
    height: 1220,
    alt: "The double spiral staircase of the Vatican Museums seen from above, coiling down to a small floor.",
    caption: "The spiral staircase of the Vatican Museums, Rome.",
    credit: {
      title: "Vatican Museums Spiral Staircase 2012",
      creator: "Colin",
      license: "CC BY-SA 3.0",
      licenseUrl: "https://creativecommons.org/licenses/by-sa/3.0/",
      page: "https://commons.wikimedia.org/w/index.php?curid=22120484",
    },
  },
  frankfurt: {
    src: "/assets/stage/frankfurt-cranes.jpg",
    width: 1920,
    height: 1277,
    alt: "Frankfurt's skyline across the river Main, with red and yellow cranes raising new towers.",
    caption: "Cranes over Frankfurt.",
    credit: {
      title: "Frankfurt Skyline with Cranes",
      creator: "Eli Beckman",
      license: "CC BY-SA 4.0",
      licenseUrl: "https://creativecommons.org/licenses/by-sa/4.0/",
      page: "https://commons.wikimedia.org/w/index.php?curid=37640122",
    },
  },
  xian: {
    src: "/assets/stage/xian-terminal.jpg",
    width: 1920,
    height: 1361,
    alt: "The vast hall of Xi'an Xianyang airport Terminal 5, a lit pavilion under a slatted ceiling.",
    caption: "Terminal 5, Xi'an Xianyang International Airport.",
    credit: {
      title: "Xi'an Xianyang International Airport Terminal 5",
      creator: "Jiasheng669",
      license: "CC0",
      licenseUrl: "https://creativecommons.org/publicdomain/zero/1.0/deed.en/",
      page: "https://commons.wikimedia.org/w/index.php?curid=166820029",
    },
  },
  admont: {
    src: "/assets/stage/admont-book.jpg",
    width: 1920,
    height: 1280,
    alt: "An old book lying open on a shelf, its blackletter pages softly lit.",
    caption: "An open book, Admont Abbey Library, Austria.",
    credit: {
      title: "Austria - Admont Abbey Library - 1407",
      creator: "Jorge Royan",
      license: "CC BY-SA 3.0",
      licenseUrl: "https://creativecommons.org/licenses/by-sa/3.0/",
      page: "https://commons.wikimedia.org/w/index.php?curid=15881905",
    },
  },
  vlt: {
    src: "/assets/stage/vlt-atacama.jpg",
    width: 1920,
    height: 1275,
    alt: "The Very Large Telescope's four domes on a mountaintop in the Atacama desert, a road winding away across red hills.",
    caption: "The Very Large Telescope, Atacama desert, Chile.",
    credit: {
      title: "View of the Very Large Telescope",
      creator: "J.L. Dauvergne & G. Hüdepohl (atacamaphoto.com)/ESO",
      license: "CC BY 4.0",
      licenseUrl: "https://creativecommons.org/licenses/by/4.0/",
      page: "https://commons.wikimedia.org/w/index.php?curid=22549633",
    },
  },
  dubai: {
    src: "/assets/world/dubai-night-birds-eye-view.jpg",
    width: 1920,
    height: 742,
    alt: "Dubai at night from high above: highways and towers traced in orange light.",
    caption: "Dubai at night.",
    credit: {
      title: "Dubai night birds eye view",
      creator: "Challiyan",
      license: "CC BY-SA 3.0",
      licenseUrl: "https://creativecommons.org/licenses/by-sa/3.0/",
      page: "https://commons.wikimedia.org/w/index.php?curid=56982557",
    },
  },
  boxer: {
    src: "/assets/world/boxer-of-quirinal-hands.jpg",
    width: 1920,
    height: 1280,
    alt: "Bronze hands of the ancient Boxer at Rest, wrapped in leather straps, resting on his knee.",
    caption: "The Boxer at Rest, Greek bronze, about 2,300 years old.",
    credit: {
      title: "Boxer of quirinal hands",
      creator: "MatthiasKabel (assumed)",
      license: "CC BY 2.5",
      licenseUrl: "https://creativecommons.org/licenses/by/2.5/",
      page: "https://commons.wikimedia.org/w/index.php?curid=542400",
    },
  },
  departures: {
    src: "/assets/world/departures-board.jpg",
    width: 1920,
    height: 1280,
    alt: "A split-flap airport departures board in yellow letters: Singapore, Los Angeles, Bangkok, Hong Kong, Kuala Lumpur.",
    caption: "A departures board, Melbourne Airport.",
    credit: {
      title: "Melbourne Airport departures board",
      creator: "Marek Ślusarczyk (Tupungato)",
      license: "CC BY 3.0",
      licenseUrl: "https://creativecommons.org/licenses/by/3.0/",
      page: "https://commons.wikimedia.org/w/index.php?curid=126439467",
    },
  },
  tungnath: {
    src: "/assets/world/snow-covered-path-to-tungnath.jpg",
    width: 1504,
    height: 1000,
    alt: "A lone walker on a snow ridge, a line of footprints behind, Himalayan ranges fading into haze.",
    caption: "The snow path to Tungnath, Uttarakhand.",
    credit: {
      title: "Snow covered path to Tungnath",
      creator: "Vvnataraj",
      license: "CC BY-SA 3.0",
      licenseUrl: "https://creativecommons.org/licenses/by-sa/3.0/",
      page: "https://commons.wikimedia.org/w/index.php?curid=9815890",
    },
  },
};

const ABOUT = { label: "Rayansh, gosocialsect.com/about", href: "https://gosocialsect.com/about" };

export const homeFixture = {
  person: {
    canonicalName: "Rayansh Singh",
    preferredName: "Ray",
    bioShort: "Founder of Socialsect. Writer, traveler and boxer.",
    bioShortStatus: "verified",
    portrait: {
      src: "/assets/ray/rayansh.webp",
      width: 1448,
      height: 1086,
      alt: "Rayansh Singh at his desk in the Socialsect office, arms crossed, smiling, in glasses and a black Socialsect T-shirt.",
      source: { label: "Socialsect", href: "https://gosocialsect.com/about" },
    },
    socials: [],
    updatedAt: "2026-10-26",
  },

  stations: [
    { id: "origin", name: "Origin", line: "interchange", headline: "EVERYTHING STARTS SOMEWHERE.", headlineStatus: "editorial-draft" },
    { id: "building", name: "Building", line: "building", headline: "I LIKE BUILDING THINGS THAT DIDN'T EXIST YESTERDAY.", headlineStatus: "editorial-draft" },
    { id: "discipline", name: "Discipline", line: "discipline", headline: "SOME LESSONS DON'T COME FROM BUSINESS.", headlineStatus: "editorial-draft" },
    { id: "motion", name: "Motion", line: "exploration", headline: "I STARTED COLLECTING STORIES.", headlineStatus: "editorial-draft" },
    { id: "stories", name: "Stories", line: "exploration", headline: "A SUITCASE OF MEMORIES.", headlineStatus: "verified" },
    { id: "thinking", name: "Thinking", line: "thinking", headline: "THINGS I CAN'T STOP THINKING ABOUT.", headlineStatus: "editorial-draft" },
    { id: "unknown", name: "The Unknown", line: "unknown", headline: "THE MOST INTERESTING PART HASN'T HAPPENED YET.", headlineStatus: "editorial-draft" },
  ],

  copy: {
    hero: { text: "WELCOME TO RAY'S MIND.", status: "editorial-draft" },
    heroSub: { text: "Rayansh Singh. Founder of Socialsect. Writer, traveler and boxer.", status: "verified" },
    identityHeadline: { text: "I'VE NEVER BEEN JUST ONE THING.", status: "editorial-draft" },
    identityBody: {
      text: "My name is Rayansh. I'm the founder of Socialsect. I'm also a writer, a traveler, and a boxer. Not necessarily in that order depending on the week.",
      status: "verified",
    },
    originBody: { text: "I didn't choose healthcare. Healthcare chose me.", status: "verified" },
    buildingBody: {
      text: "I built Socialsect because I kept seeing brilliant doctors, people who had dedicated their lives to their craft, being let down by agencies that didn't understand their world. I decided to build something that did.",
      status: "verified",
    },
    disciplineBody: {
      text: "Boxing taught me that the most important fight is the one you have with yourself before you ever step into the ring. Most things worth doing are uncomfortable before they're rewarding.",
      status: "verified",
    },
    motionBody: {
      text: "I've built Socialsect across time zones, India, the US, the UK. Somewhere between all the airports and different clocks, I learned that the best businesses are built on understanding people, not markets.",
      status: "verified",
    },
    storiesBody: {
      text: "It's about the things we carry with us, the places, the people, the moments that shape us without us realising.",
      status: "verified",
    },
    thinkingBody: {
      text: "I travel. I read. I write. I box. I try to stay genuinely curious about everything. The day I stop being curious is the day I stop being useful.",
      status: "verified",
    },
    unknownBody: {
      text: "I'm building Socialsect to last. I'm not optimizing for the next quarter.",
      status: "verified",
    },
    contactHeadline: { text: "GOOD CONVERSATIONS CHANGE THINGS.", status: "editorial-draft" },
    contactBody: {
      text: "If you're building something interesting, have a thoughtful question, or want to collaborate, say hello.",
      status: "editorial-draft",
    },
  },

  quotes: {
    origin: {
      text: "The first time I worked with a doctor, I didn't know I was building a niche. I was just trying to solve a problem. I spent two weeks learning their practice before I touched anything. It was a systems problem dressed up as a marketing problem. I fixed the system. It worked.",
      source: ABOUT,
      approvalStatus: "verified",
    },
    book: {
      text: "We spend our lives collecting things worth carrying, experiences, people, places, lessons. The ones that last aren't the ones we planned. They're the ones that found us.",
      source: { label: "A Suitcase of Memories, quoted on gosocialsect.com/about", href: "https://gosocialsect.com/about" },
      approvalStatus: "verified",
    },
    jobTitle: {
      text: "I've never believed you can understand someone from a job title.",
      source: ABOUT,
      approvalStatus: "verified",
    },
  },

  timeline: [
    {
      title: "The first doctor",
      date: null,
      datePrecision: "unknown",
      location: null,
      description: "A specialist who had been through two agencies in eighteen months. Two weeks learning the practice before touching anything.",
      line: "building",
      verificationStatus: "verified",
      sourceNotes: "Rayansh, gosocialsect.com/about.",
      visibility: "public",
    },
    {
      title: "Built Socialsect",
      date: null,
      datePrecision: "unknown",
      location: "India, the US, the UK",
      description: "Healthcare growth and marketing for private medical practices.",
      line: "building",
      verificationStatus: "verified",
      sourceNotes: "gosocialsect.com/about. Founding year not published.",
      visibility: "public",
    },
    {
      title: "Wrote A Suitcase of Memories",
      date: null,
      datePrecision: "unknown",
      location: null,
      description: "A book about the things we carry with us.",
      line: "exploration",
      verificationStatus: "verified",
      sourceNotes: "gosocialsect.com/about. Publisher and date to add.",
      visibility: "public",
    },
    {
      title: "Boxing",
      date: null,
      datePrecision: "unknown",
      location: null,
      description: "The fight with yourself before the ring. No titles claimed.",
      line: "discipline",
      verificationStatus: "verified",
      sourceNotes: "gosocialsect.com/about.",
      visibility: "public",
    },
    {
      title: "Started One Day with Ray",
      date: null,
      datePrecision: "unknown",
      location: null,
      description: "A podcast: one guest, one conversation.",
      line: "thinking",
      verificationStatus: "verified",
      sourceNotes: "Apple Podcasts listing, host Rayansh Singh.",
      visibility: "public",
    },
    {
      title: "Building in the UAE",
      date: null,
      datePrecision: "unknown",
      location: "UAE",
      description: "Socialsect is building its presence there now.",
      line: "building",
      verificationStatus: "verified",
      sourceNotes: "gosocialsect.com/about, present tense.",
      visibility: "public",
    },
  ],

  ventures: [
    {
      name: "Socialsect",
      slug: "socialsect",
      role: "Founder",
      launchDate: null,
      status: "active",
      sector: "Healthcare growth and marketing",
      description: "Almost everything we do is for private medical practices in the US and UK, while we build our presence in the UAE.",
      verifiedLinks: [{ label: "gosocialsect.com", href: "https://gosocialsect.com/about" }],
      verificationStatus: "verified",
      featured: true,
    },
  ],

  values: [
    "Honesty before comfort",
    "Results over reports",
    "Depth over volume",
    "Partnership over transaction",
    "Curiosity over assumption",
    "Long-term over short-term",
  ],

  book: {
    title: "A Suitcase of Memories",
    status: "verified",
    note: "Publisher, date and cover to be added.",
    cover: null,
  },

  media: [
    {
      format: "podcast",
      title: "One Day with Ray",
      host: "Rayansh Singh",
      description: "If you had one day with someone exceptional, what would you ask? One guest. One conversation. A lifetime of lessons.",
      episodes: [
        { title: "What Every Business Gets Wrong About AI", duration: "21 min" },
        { title: "How Great Implant Dentists Are Built", duration: "44 min" },
      ],
      links: [
        { label: "Spotify", href: "https://open.spotify.com/show/033xRQ9iPlF7Y24nB7IS4e" },
        { label: "Apple Podcasts", href: "https://podcasts.apple.com/us/podcast/one-day-with-ray/id1896923883" },
      ],
      verificationStatus: "verified",
    },
  ],

  topics: [
    { name: "Healthcare", slug: "healthcare", articleCount: 0 },
    { name: "AI", slug: "ai", articleCount: 0 },
    { name: "Human behaviour", slug: "human-behaviour", articleCount: 0 },
    { name: "Building companies", slug: "building-companies", articleCount: 0 },
  ],

  possibilities: [
    { text: "I'm interested in healthcare products.", verificationStatus: "future-possibility" },
    { text: "One day I may build hospitals.", verificationStatus: "future-possibility" },
    { text: "I'm exploring technology companies of my own.", verificationStatus: "future-possibility" },
  ],

  contactCategories: ["Collaboration", "Media / Speaking", "Business", "Other"],

  contactLinks: [
    { label: "Work with Socialsect", href: "https://gosocialsect.com/book-a-call#book-call-form" },
    { label: "Listen to One Day with Ray", href: "https://open.spotify.com/show/033xRQ9iPlF7Y24nB7IS4e" },
  ],

  // The real place behind each chapter, in page order, with the point of the
  // photograph the frame keeps in view.
  stage: [
    { section: "hero", image: "salkCourtyard", focus: [0.5, 0.42], depth: [0.5, 0.485] },
    { section: "identity", image: "salkCourtyard", focus: [0.5, 0.5], depth: [0.5, 0.485] },
    { section: "origin", image: "vatican", focus: [0.5, 0.55] },
    { section: "building", image: "frankfurt", focus: [0.55, 0.45] },
    { section: "discipline", image: "boxer", focus: [0.62, 0.55] },
    { section: "motion", image: "xian", focus: [0.5, 0.45] },
    { section: "stories", image: "admont", focus: [0.5, 0.5] },
    { section: "thinking", image: "vlt", focus: [0.45, 0.6] },
    { section: "unknown", image: "tungnath", focus: [0.45, 0.45] },
    { section: "connect", image: "salkSunset", focus: [0.5, 0.45] },
  ],

  images,
};
