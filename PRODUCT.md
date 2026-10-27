# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Stack
Pinned by the RayMindset developer pack (`RayMindset_Complete_Developer_Pack/01_CLAUDE.md`): Next.js App Router, TypeScript strict, React, Tailwind CSS, semantic HTML; Three.js + React Three Fiber + Drei for bespoke 3D (lazy-loaded client islands); GSAP ScrollTrigger only where necessary, CSS for basic motion. Package manager: npm. CMS (Sanity or Payload) deferred until approval; typed local content fixtures behind a content adapter until then. Hosting preference Vercel; no deployment without explicit owner approval.

## Users
- A curious stranger arriving from a link or a social profile, deciding in seconds whether this person is worth exploring.
- A potential business partner or investor checking whether the ambition is grounded in real work, and how to make contact.
- A reader or follower returning for essays, stories and ideas.
- Future collaborators and media who need to understand what Ray builds and how to reach him.

## Product Purpose
RayMindset.com is the evolving digital home of Rayansh "Ray" Singh: a cinematic experience framed as "Welcome to Ray's Mind", in which the visitor discovers connected rooms (Origin, Motion, Discipline, Stories, Building, Thinking, The Unknown). It begins with mystery, becomes progressively human, and ends with a clear invitation to connect. Success: a stranger understands who Ray is within five seconds and wants to explore; a partner leaves with verified work and a contact path; readers have something worth returning for.

## Positioning
A living record of one person in motion, not a finished success story, an agency portfolio, a motivational funnel, a luxury flex site, or a CV. Ray's identity is the umbrella; Socialsect is one chapter. Credibility over hype.

## Operating Context
Visitors arrive on phones as often as on desktops; mobile is first-class and heavy 3D is never forced on underpowered devices. Content is a product: ventures, timeline, articles, experiences and media are CMS-driven content with verification status (Verified / Needs Ray confirmation / Editorial draft / Future possibility) and approval status (Draft / Fact-check needed / Legal-rights review / Approved / Published).

## Capabilities and Constraints
- Routes: / , /story, /ventures, /ventures/[slug], /journal, /journal/[slug], /experiences, /media, /connect, /privacy, 404, sitemap, robots, RSS if feasible. Only real venture detail routes are published.
- The site stays fully usable without WebGL, without motion, and with JavaScript-light rendering of essential content.
- No auto-playing sound, no unskippable intro, no scroll hijacking, no whole-site canvas, no animation-only text.
- Analytics event names: hero_enter, intro_skip, story_chapter_view, venture_open, article_open, social_click, contact_submit.
- Contact categories: Collaboration, Media/Speaking, Business, Other. No promised response time.
- Undecided: CMS vendor, final typography, chosen concept route (A Mind Museum / B Infinite Atlas / C Unfinished Monument), canonical www vs apex, contact delivery service.

## Brand Commitments
- Name: Rayansh Singh, uses Ray. Hero line "WELCOME TO RAY'S MIND." (draft copy pending Ray's approval, see `04_CONTENT_WRITING.md`).
- Voice: first person, direct, curious, confident, self-aware, occasionally playful. No "visionary entrepreneur", hustle clichés, billionaire slogans, or inspirational one-liners.
- Never call Ray a billionaire, investor, hospital owner or product founder until verifiably true; ambitions phrased as "I'm exploring", "I'm interested in", "One day I may build".
- Avoid literal brain clip art and generic tech particles.

## Evidence on Hand
- Brand truths from the pack (all "Needs Ray confirmation" until approved): founder of Socialsect (healthcare-practice growth and digital systems, US/UAE activity); has trained in boxing (no titles); backpacking/travel across Asia; author of *The Suitcase of Memories* (title/cover/publication unconfirmed); interests in entrepreneurship, healthcare, technology, human behaviour, AI.
- Verification source: https://gosocialsect.com/about.
- No photos, footage, book cover, logo, timeline dates, testimonials, press or statistics are in hand (confirmed 2026-10-26). None may be fabricated. Openly licensed, credited world imagery (archival places, objects) is approved as interim material, captioned as what it is and never presented as Ray.

## Product Principles
1. Story before spectacle: every visual has a narrative function.
2. Credibility over hype: nothing invented, everything labelled by verification status.
3. Mobile and fallback are first-class, not degraded afterthoughts.
4. Content is a product: no hardcoded portfolio arrays in UI.
5. The person is the umbrella; any one venture is a chapter.

## Accessibility & Inclusion
WCAG AA contrast; visible focus; logical headings; skip-to-content; keyboard and touch parity; prefers-reduced-motion respected with a variant for every scene; no essential information conveyed only by 3D.
