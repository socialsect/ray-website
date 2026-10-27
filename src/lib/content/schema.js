import { z } from "zod";

// Content schemas mirror CONTENT_WRITING.md so a CMS (Sanity or Payload, pending
// approval) can replace the local fixtures without touching UI components.

export const verificationStatus = z.enum([
  "verified",
  "needs-confirmation",
  "editorial-draft",
  "future-possibility",
]);

export const approvalStatus = z.enum([
  "draft",
  "fact-check-needed",
  "legal-rights-review",
  "approved",
  "published",
]);

const credit = z.object({
  title: z.string(),
  creator: z.string(),
  license: z.string(),
  licenseUrl: z.url(),
  page: z.url(),
});

export const worldImage = z.object({
  src: z.string().startsWith("/assets/"),
  width: z.number().int().positive(),
  height: z.number().int().positive(),
  alt: z.string().min(10),
  caption: z.string(),
  credit,
});

export const person = z.object({
  canonicalName: z.string(),
  preferredName: z.string(),
  bioShort: z.string(),
  bioShortStatus: verificationStatus,
  portrait: z.lazy(() => ownImage).nullable(),
  socials: z.array(z.object({ label: z.string(), href: z.url() })),
  updatedAt: z.iso.date(),
});

export const lineId = z.enum(["interchange", "building", "discipline", "exploration", "thinking", "unknown"]);

export const station = z.object({
  id: z.string(),
  name: z.string(),
  line: lineId,
  headline: z.string().max(60),
  headlineStatus: verificationStatus,
});

export const timelineEvent = z.object({
  title: z.string(),
  date: z.string().nullable(),
  datePrecision: z.enum(["day", "month", "year", "unknown"]),
  location: z.string().nullable(),
  description: z.string(),
  line: lineId,
  verificationStatus,
  sourceNotes: z.string(),
  visibility: z.enum(["public", "hidden"]),
});

export const venture = z.object({
  name: z.string(),
  slug: z.string(),
  role: z.string(),
  launchDate: z.string().nullable(),
  status: z.enum(["active", "past", "exploring"]),
  sector: z.string(),
  description: z.string(),
  verifiedLinks: z.array(z.object({ label: z.string(), href: z.url() })),
  verificationStatus,
  featured: z.boolean(),
});

export const topic = z.object({
  name: z.string(),
  slug: z.string(),
  articleCount: z.number().int().nonnegative(),
});

export const book = z.object({
  title: z.string(),
  status: verificationStatus,
  note: z.string(),
  cover: worldImage.nullable(),
});

export const possibility = z.object({
  text: z.string(),
  verificationStatus: z.literal("future-possibility"),
});

export const homeContent = z.object({
  person,
  stations: z.array(station).length(7),
  copy: z.record(z.string(), z.object({ text: z.string(), status: verificationStatus })),
  timeline: z.array(timelineEvent),
  ventures: z.array(venture),
  book,
  topics: z.array(topic),
  possibilities: z.array(possibility),
  contactCategories: z.array(z.string()).min(1),
  images: z.record(z.string(), worldImage),
  quotes: z.record(z.string(), z.lazy(() => quote)),
  media: z.array(z.lazy(() => mediaItem)),
  values: z.array(z.string()),
  contactLinks: z.array(z.object({ label: z.string(), href: z.string() })),
  stage: z.array(z.object({ section: z.string(), image: z.string(), focus: z.tuple([z.number(), z.number()]), depth: z.tuple([z.number(), z.number()]).optional() })),
});

// Ray's own published material (his photo, his words) carries its source
// instead of a licence.
const source = z.object({ label: z.string(), href: z.url() });

export const ownImage = z.object({
  src: z.string().startsWith("/assets/"),
  width: z.number().int().positive(),
  height: z.number().int().positive(),
  alt: z.string().min(10),
  source,
});

export const quote = z.object({
  text: z.string(),
  source,
  approvalStatus: verificationStatus,
});

export const mediaItem = z.object({
  format: z.enum(["podcast", "video", "article"]),
  title: z.string(),
  host: z.string(),
  description: z.string(),
  episodes: z.array(z.object({ title: z.string(), duration: z.string() })),
  links: z.array(z.object({ label: z.string(), href: z.url() })),
  verificationStatus,
});
