// Structured data only for what Ray has published himself: his name, his
// role at Socialsect and his book. Anything else waits for his approval.
export function personJsonLd(person) {
  return {
    "@context": "https://schema.org",
    "@type": "Person",
    name: person.canonicalName,
    alternateName: person.preferredName,
    url: process.env.NEXT_PUBLIC_SITE_URL || undefined,
    jobTitle: "Founder",
    worksFor: { "@type": "Organization", name: "Socialsect", url: "https://gosocialsect.com" },
    ...(person.socials.length ? { sameAs: person.socials.map((s) => s.href) } : {}),
  };
}
