# DESIGN.md — CREATIVE SYSTEM & MOTION DIRECTIVE

## Art direction
Cinematic editorial futurism with emotional warmth. Darkness is an atmospheric stage, not an excuse for unreadable copy. Signature metaphor: a living collection of rooms, fragments, paths, and unfinished structures. Avoid literal brain clip art and generic tech particles.

## Three concept routes to present before build
A. The Mind Museum: floating artifacts, rooms, memories, editorial typography.
B. The Infinite Atlas: branching pathways connecting disciplines, countries, ideas, ventures.
C. The Unfinished Monument: sculptural evolving structure representing building and ambition.
Each concept must include hero desktop/mobile stills, 15–30s motion prototype, typography, color tokens, accessibility fallback, and complexity estimate. Choose one route before production.

## Proposed tokens (exploration only)
Background #0B0D12, raised #151923, text #F2F0EA, muted #A8AAB3, accent #A3B8FF. Define CSS custom properties; test contrast. Font pairing: distinctive licensed display serif or grotesk plus restrained readable sans. Do not lock typography until moodboards approved.

## Homepage storyboard
01 Portal: 3D artifact, cursor parallax, ENTER / SKIP; 02 Identity: fragmented facets settle into actual portrait; 03 Journey: timeline with verified milestones; 04 Ventures: expandable constellation of actual ventures; 05 Boxing: kinetic shadow and footage; 06 Travel/book: memory suitcase artifacts; 07 Ideas: editorial constellation and filters; 08 Future: open-ended unfinished world; 09 Connect: calm, clear CTA.

## Motion rules
Every scene has entry, idle, interaction, exit, reduced-motion variant. Use scroll-linked animation only where it clarifies narrative; no hijacking wheel input. Allow direct section navigation. Avoid excessive camera motion, flash, spinning text, and forced waits. 150–300ms for micro-interactions; long cinematic transitions must be skippable.

## 3D engineering constraints
Use geometry instancing, LOD, optimized textures, compressed models, capped device pixel ratio, and lazy loading. Provide static image fallback and lightweight mobile variants. Scene components must dispose of materials, geometries, event listeners and timelines on unmount. Test GPU and memory use on midrange Android and iPhone, not only Mac desktop.

## Navigation and accessibility
Persistent unobtrusive nav; clear skip-to-content; keyboard focus and meaningful labels; visible scroll position; mobile thumb-friendly controls; semantic headings and readable HTML alongside canvas; prefers-reduced-motion respected; no essential information conveyed solely by 3D.

## Pages beyond homepage
/story = documentary editorial timeline; /ventures = sober, verifiable portfolio; /journal = excellent reading experience with taxonomy and search; /experiences = boxing/travel/writing; /media = video and appearances; /connect = simple direct inquiry. Use 3D selectively; editorial pages should prioritize readability.

## Deliverables
Moodboards; 3 concept routes; Figma tokens/components; desktop/tablet/mobile wireframes; storyboard; motion timing sheet; 3D asset list and provenance; interaction states; fallback frames; implementation handoff; QA screenshots.

## Design acceptance checklist
Memorable but understandable within 5 seconds; Ray's name is legible; primary CTA obvious; visual identity remains distinctive without 3D; no visual clutter; mobile works; content never feels like a motivational template.
