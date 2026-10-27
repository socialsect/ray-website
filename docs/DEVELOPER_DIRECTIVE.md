# DEVELOPER DIRECTIVE — EXECUTION PLAN, SPRINTS & ACCEPTANCE

## Ownership and workflow
Ray: final brand/content/design approval. Product/design lead: narrative and UX. Frontend lead: Next.js, accessibility, responsive components. Creative developer: WebGL and motion. Content editor: verified copy and CMS. QA: devices, performance, accessibility. Assign named owners at kickoff.

## Sprint 0 — Discovery (3–5 working days, estimate only)
Audit repo, confirm domains, gather approved assets, founder interview, inventory content, map dependencies, shortlist CMS and hosting, define KPIs. Deliver sitemap, content gap tracker, risk register, and three design directions. Gate: Ray chooses a concept.

## Sprint 1 — Prototype (5–10 working days)
Build responsive hero with real typography, one meaningful 3D object, Enter/Skip, reduced-motion and static fallback, navigation shell, 2 representative content sections. Test desktop + mobile. Gate: approve interaction quality and performance direction.

## Sprint 2 — Design system and core pages
Tokens, typography, nav, footer, story, ventures, journal, experiences, media, contact, 404, privacy. Implement CMS schemas and seed content with verification labels. Gate: full functional site without WebGL.

## Sprint 3 — Signature storytelling
Add journey timeline, ventures constellation, and one boxing/travel interactive scene; responsive and reduced-motion variants. Avoid all-at-once 3D production. Gate: visual and functional QA.

## Sprint 4 — Content, SEO, instrumentation
Approved copy, photos, media, OG, metadata, schema, sitemap, analytics events, consent/privacy, contact pipeline, redirects. Gate: factual and legal review.

## Sprint 5 — Hardening and launch
Run tests, Lighthouse/Web Vitals measurements, keyboard/screen-reader audit, cross-browser/device checks, broken-link scan, error tracking, rollback rehearsal, launch checklist. Gate: Ray approves production deployment.

## Required testing matrix
Desktop Chrome/Safari/Firefox; iPhone Safari; midrange Android Chrome; touch and keyboard; slow network; reduced motion; WebGL unsupported; CMS empty states; contact form validation; no-JS essential content; SEO crawlability.

## Definition of done per feature
Responsive; accessible; functional with graceful fallback; approved content; tests pass; analytics event (if relevant); loading/error states; no console errors; documented maintenance path.

## Handoff artifacts
Source repo, design Figma, editable Blender/3D source, licensed media list, CMS schema and credentials ownership, hosting/DNS ownership, environment template, runbook, QA report, analytics event dictionary, content publishing guide.

## Critical risks
Heavy 3D causes slow mobile; timeline invented from assumptions; future ambition framed as current achievement; copyrighted photos/videos; over-engineered launch; CMS editing difficulty. Mitigate through prototype gates, source verification, asset rights inventory, and phased delivery.

## Day-one tasks for team
1. Create repo /docs and copy these directives into it.
2. Read CLAUDE.md and document architecture decisions.
3. Produce three moodboards and a scene-by-scene storyboard.
4. Request Ray's approved timeline and assets.
5. Build a portal hero prototype with static fallback.
6. Demo on actual phone and desktop before continuing.
