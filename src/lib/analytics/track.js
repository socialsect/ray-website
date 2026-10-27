// Event names are fixed by CLOUD.md ("Observability"). No vendor is wired
// yet: events queue on window.__rmEvents until an approved, consent-aware
// analytics provider is connected.
export const EVENTS = Object.freeze({
  heroEnter: "hero_enter",
  introSkip: "intro_skip",
  chapterView: "story_chapter_view",
  ventureOpen: "venture_open",
  articleOpen: "article_open",
  socialClick: "social_click",
  contactSubmit: "contact_submit",
});

const allowed = new Set(Object.values(EVENTS));

export function track(name, props = {}) {
  if (!allowed.has(name)) throw new Error(`Unknown analytics event: ${name}`);
  if (typeof window === "undefined") return;
  const event = { name, props, at: Date.now() };
  (window.__rmEvents ||= []).push(event);
  if (process.env.NODE_ENV === "development") console.debug("[track]", name, props);
}
