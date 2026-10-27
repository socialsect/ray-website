// Staging and previews stay out of search indexes (CLOUD.md). Production
// opts in explicitly with ALLOW_INDEXING=true once launch is approved.
export default function robots() {
  const site = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
  if (process.env.ALLOW_INDEXING !== "true") {
    return { rules: { userAgent: "*", disallow: "/" } };
  }
  return { rules: { userAgent: "*", allow: "/" }, sitemap: `${site}/sitemap.xml` };
}
