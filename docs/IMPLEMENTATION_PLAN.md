# RayMindset — Implementation Plan

Updated 2026-10-26. Direction: **The Infinite Atlas** (client-approved). Stack (client decision, overrides the pack's TypeScript/R3F default): Next.js App Router + JavaScript, plain Three.js, Tailwind CSS utility classes inline, GSAP ScrollTrigger.

## Repository audit (start of work)
- `index.html`: a one-line typed welcome page from the first commit. Kept untouched.
- `RayMindset_Complete_Developer_Pack/` and `RayMindset_Master_Developer_Directive.docx`: the brief (the .docx is the pack's files combined). Copied into `/docs`.
- No package manager, framework or assets existed. npm chosen.

## Information architecture
`/` experience (built) · `/story` · `/ventures` · `/ventures/[slug]` (Socialsect only, once approved) · `/journal` · `/journal/[slug]` · `/experiences` · `/media` (One Day with Ray) · `/connect` · `/privacy` · 404 (built) · `sitemap.xml` and `robots.txt` (built; robots blocks indexing until `ALLOW_INDEXING=true`).

Homepage chapters, each with its own place in the Atlas: Hero (gate) → Identity (the cube) → Origin (plaza) → Building (tower) → Discipline (ring) → Motion (corridor of gates) → Stories (suitcase) → Thinking (orbit, podcast) → The Unknown (unfinished bridge) → Connect (whole-Atlas view).

## Tasks, prioritised
| # | Task | Status | Depends on |
|---|------|--------|------------|
| 1 | Next.js scaffold, tokens, fonts, lint, tests | Done | — |
| 2 | Content model (zod schemas) + adapter + fixtures with verification status | Done | — |
| 3 | Atlas world (procedural architecture, lighting, post), lite mode, auto-degrade, disposal | Done | 1 |
| 4 | GSAP camera journey, chapter transformations, title-sequence intro, Skip | Done | 3 |
| 5 | SVG still fallback (no WebGL / save-data / low memory), reduced-motion path | Done | 3 |
| 6 | Homepage chapters with Ray's verified words, portrait, podcast | Done | 2 |
| 7 | Real-GPU QA on target devices (midrange Android, iPhone, Mac/Windows) | **Open** | 3–6 |
| 8 | CMS selection (Sanity or Payload) and adapter | Open — needs approval | 2 |
| 9 | Contact delivery (form backend, spam protection, rate limit) | Open — needs inbox and approval | — |
| 10 | Remaining routes from the IA, reusing the chapter components | Open | 2, 8 |
| 11 | Analytics vendor with consent | Open — needs approval | — |
| 12 | Hosting (Vercel preferred), domains, deployment | Open — **needs explicit approval** | all |

## Risks
- Heavy 3D on weak phones: mitigated by lite mode (no mirror, shadows, transmission), software-renderer detection, auto-degrade after slow frames, the SVG still, and pausing when the tab is hidden. Still needs measurement on real devices.
- Factual drift: every statement carries a status; quotes link to where Ray published them; tests fail if a verified fact lacks a source.
- Imagery rights: world photos are CC-licensed with credits in captions and footer; Ray's photo is from Socialsect's own site and still needs his approval for this use.

## Acceptance criteria (homepage)
Works with touch, mouse, keyboard and reduced motion; readable without WebGL; no horizontal overflow; no console errors; headings logical; contrast AA; Skip intro instant; every claim labelled; no fabricated media.
