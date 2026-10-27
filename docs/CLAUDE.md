# CLAUDE.md — RAYMINDSET PROJECT OPERATING DIRECTIVE
This is the primary instruction file for Claude Code (sometimes called “Cloud Code”). Read this first, then read all files in /docs before implementing.

## Mission
Build a production-grade Next.js personal brand experience for RayMindset.com. It should feel like entering Ray's mind: cinematic, interactive, emotionally resonant, factually accurate, technically excellent, and expandable to future ventures. Follow /docs/OVERALL_IDEA.md, /docs/DESIGN.md, /docs/CONTENT_WRITING.md, /docs/MESSAGING.md, and /docs/CLOUD.md.

## Work protocol — mandatory
1. Inspect repository and package manager; do not overwrite existing code or assets without review.
2. Summarize what exists, identify gaps, and create /docs/IMPLEMENTATION_PLAN.md with tasks, dependencies, risks, and acceptance criteria.
3. Ask for approval before major design-direction changes, destructive commands, paid services, or deployment. For routine implementation, proceed in small verifiable steps.
4. Build a functional vertical slice first: header, hero, one WebGL scene, fallback, content model, and mobile view.
5. Use real approved content; otherwise write visibly labeled editorial placeholders in CMS seed data. Never present fabricated facts as final copy.
6. Run lint, typecheck, tests, production build and accessibility/performance checks after each meaningful milestone.
7. Record changes and unresolved issues in /docs/DECISIONS.md and /docs/QA_REPORT.md.
8. At each handoff report: completed, files changed, tests run, screenshots or preview route, blockers, next tasks.

## Technical defaults
- Next.js App Router, TypeScript strict, React, Tailwind, semantic HTML.
- Three.js + React Three Fiber + Drei for bespoke 3D; GSAP ScrollTrigger only when necessary; CSS for basic motion.
- CMS adapter architecture (prefer Sanity or Payload after approval); use typed local content fixtures before connecting CMS.
- Content-heavy pages server rendered/static where possible; lazy-load 3D client islands.
- No hardcoded business portfolio arrays inside UI components; use content schemas.
- No secrets in client code; env example only; validate inputs and sanitize rich text.
- Modular components; design tokens; clear ownership of animation lifecycle and cleanup.

## Routes to implement
/ (experience), /story, /ventures, /ventures/[slug], /journal, /journal/[slug], /experiences, /media, /connect, /privacy, /404. Add /sitemap.xml, /robots.txt, RSS if feasible. Only publish real venture detail routes.

## Suggested directory layout
src/app; src/components/ui; src/components/layout; src/components/scenes; src/components/story; src/lib/content; src/lib/seo; src/lib/analytics; src/styles; src/types; public/assets; docs; tests.

## Acceptance gates
- Works on touch, mouse, keyboard, and reduced-motion preference.
- Without WebGL: readable hero and full access to all content.
- Mobile-first layout, no sideways overflow, no blocked CTAs.
- Performance measured on real representative devices; target LCP <=2.5s, INP <=200ms, CLS <=0.1 at p75 where practical; document actual results.
- No inaccessible scroll traps; focus visible; headings logical; contrast WCAG AA.
- Person, Article, Book, Organization structured data only where factual.
- No broken links, unapproved claims, placeholder images presented as authentic, or console errors.

## Prohibited shortcuts
Do not implement the whole website as one canvas; do not fake interactions; do not auto-play sound; do not install large dependencies without justification; do not use unlicensed media; do not invent biography; do not copy competitor websites; do not commit credentials; do not mark tasks complete without verification.

## First Claude Code instruction
“Read CLAUDE.md and all /docs files. Audit the repo. Produce a prioritized implementation plan and initial information architecture. Then create a functioning desktop/mobile homepage prototype with a cinematic portal hero, accessible non-WebGL fallback, and CMS-ready content fixtures. Do not invent biographical facts. Show the plan and prototype before building remaining scenes.”
