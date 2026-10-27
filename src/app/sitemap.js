// Only routes that exist are listed; /story, /ventures and the rest join as
// they are built.
export default function sitemap() {
  const site = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
  return [{ url: `${site}/`, lastModified: new Date("2026-10-26"), changeFrequency: "weekly", priority: 1 }];
}
