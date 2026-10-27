# Decisions

2026-10-26

1. **Stack: JavaScript, plain Three.js, inline Tailwind, GSAP.** The client chose this over the pack's TypeScript + React Three Fiber default. No TypeScript, R3F or Drei. Runtime dependencies are next, react, react-dom, three, gsap and zod.
2. **Direction: The Infinite Atlas.** The client pinned it after a first prototype ("The Unfinished Line", a transit-map network) was judged not cinematic or real enough. The decision record is in `.impeccable/surfaces/src-app-page-js.md` (development only, never shipped).
3. **Real content from Ray's own publications.** Ray's first-person words, his photo, the book title, the countries and Socialsect's values come from https://gosocialsect.com/about (read 2026-10-26). The podcast comes from its Apple Podcasts listing (host Rayansh Singh). These are marked "Verified: Ray's own published words". Lines from the developer pack stay "Draft copy, pending Ray's approval".
4. **Book title corrected.** The pack says *The Suitcase of Memories*. Ray's own page says ***A** Suitcase of Memories*. The site uses Ray's version.
5. **Countries corrected.** The pack says US/UAE activity. Ray's page says Socialsect is built across India, the US and the UK, and is building its presence in the UAE. The site uses Ray's version.
6. **No team or client names.** The about page lists staff, and a podcast episode names a doctor. Both are left out under the pack's rule on naming people without approval.
7. **No footage.** Stock boxing clips would stand in for Ray, which the pack forbids. The training-footage slot is labelled until his own clips exist.
8. **Palette.** The pack's exploratory `#F2F0EA` and `#A3B8FF` tokens are kept in spirit. The ink moved to a cooler bone (`#EEF0F2`) because the warm cream read as an AI-assistant default. `#A3B8FF` survives as the Thinking line colour.
9. **One canvas.** A single fixed WebGL canvas is reused for the whole journey (CLOUD.md). All content is semantic HTML above it; the canvas is `aria-hidden`, and each chapter's "In the Atlas" note says in words what the 3D shows.
10. **Contact form.** It validates fully but does not send, because no verified inbox or backend exists. It says so plainly. Real external paths (book a call with Socialsect, the podcast) are linked.
11. **Indexing off.** `robots.txt` disallows everything until `ALLOW_INDEXING=true` is set at launch.

Later on 2026-10-26, after client review

12. **Real photography replaces the procedural 3D world.** The client found the code-built architecture "cartoon-like" in two lighting versions (night, then golden hour) and asked for realistic backgrounds only. The background is now a WebGL photographic stage (`src/components/scenes/photoStage.js`). It shows real, credited, openly licensed photographs of real places, one per chapter (`stage` in the content fixtures). A photo pushes in slowly while its chapter is read, and a scroll-scrubbed displacement dissolve carries one place into the next. The procedural 3D world was deleted (nothing is committed to git yet, so it is not recoverable from history).
13. **Light theme.** The client asked for a less dark design. The page is now light stone (`#F1F2EF`) with near-black ink and dark "ticket" cards for contrast. On wide screens the text column sits on a paper-toned scrim, and the photograph shows untouched on the right.
14. **Every background names its place.** A "Behind this chapter" note gives each photo's caption and credit, so no background can be read as Ray's own life.
15. **Performance.** The stage computes noise only during transitions, redraws only when the picture changes, caps pixel density (1.5 desktop, 1.25 phones), and degrades itself on slow frames or software renderers.

2026-10-27, "The Human Mind" homepage

16. **The homepage is now a 3D human brain.** The client's brief and reference image asked for a realistic brain hero, brain regions used as navigation, and full-screen scroll chapters. The earlier homepages are still available: the Atlas at `/atlas` and the Mind Museum at `/museum`.
17. **A real anatomical mesh, not a procedural one.** The brain is "Brain AS" by Agnieszka Starostecka (CC BY 4.0, credited in the footer). It is 3.06M triangles, simplified with meshoptimizer to 260k (desktop, 886 KB) and 90k (phones, 319 KB), quantised and meshopt-encoded (`scripts/build-brain.mjs`). Bright moving filaments and the region map are drawn by a shader, so the build adds no further geometry.
18. **The six regions are themes, not anatomy.** Journey, Ventures, Discipline, Exploration, Expression and Ideas each name a chapter of Ray's published story. They are anchored to plausible areas of the brain but do not claim neuroscience.
19. **Chapter text is Ray's verified words only.** Each chapter's body and "Explore" panel quote his about page and podcast. Every background photo is a credited place, never a picture presented as Ray.
20. **Fallbacks.** Without WebGL, still photos and a plain region list replace the 3D. Reduced motion skips the intro and stops the motion. Labels are real buttons that can be reached by keyboard.
21. **Repository hygiene.** The repo is public. The client's brief (the developer pack and docx) and the Taste research downloads (`/assets/`) are kept out of git.

2026-10-27, later: the light "Ray's mind" redesign

22. **Light, not dark.** The client found the dark brain homepage not "wow" enough and asked for no dark theme. Taste Skill dealt "The name as a monument" (seed 1232375641) with an orange-and-black palette. The page is hot orange (`#ff7a1f`) for the opening and the close, and white for the map and chapters. The ink is blue-black (`#050f16`). Only the footer inverts.
23. **The brain is made of particles.** 70k particles (26k on phones) are sampled from the same Brain AS mesh. They gather from scattered dust behind the name "Ray's mind". On scroll they move forward through the name, then re-form into each chapter's shape: a road (Journey), a tower with unfinished top floors (Ventures), a ring (Discipline), a globe with arcs between India, the US, the UK and the UAE (Exploration), an open book (Expression) and a spiral (Ideas). Each change is a single morph run on the graphics card (`src/components/mind/particleMind.js`).
24. **The live thing.** The cursor or a finger parts the particles around it. On the map, hovering a region lights its particles.
25. **House rules applied.** The chapter numbers and the number rail are removed, along with the thin outlined pills and the coloured left borders. Region labels are set in ink with a coloured dot, so they meet text contrast.
26. **Photo stage retired from the homepage.** Each chapter now shows its credited photograph as a real image beside the words. `photoStage.js` and `brainScene.js` stay in the repo: `/atlas` uses the stage, and the brain scene is kept for reference.
27. **Real 3D objects for every chapter.** The client asked for real models instead of particle shapes. Five chapter objects are Poly Haven models, CC0, credited in the footer, with textures re-encoded as WebP (about 3.5 MB together):
    - Journey: a pocket watch
    - Ventures: a laptop
    - Exploration: a compass
    - Expression: a suitcase, for *A Suitcase of Memories*
    - Ideas: a lightbulb

    No open boxing model exists, so the Discipline ring is built in code with physical materials. The brain (Brain AS) also renders solid. In each section the particles gather on the object's real surface, then the solid object fades in. Only the map keeps the brain as particles, so its regions can light up.
