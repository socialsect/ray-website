# QA Report — homepage ("The Human Mind")

2026-10-27, production build (`npm run build && npm start`).

## Automated
| Check | Result |
|-------|--------|
| ESLint | Clean |
| Unit tests (Vitest) | 26 passing (content schema, verification rules, credited photos on disk, museum geometry) |
| Production build | Passes; `/`, `/atlas`, `/museum`, robots and sitemap are all static |
| Routes | `/`, `/atlas` and `/museum` return 200; unknown routes return 404; brain meshes return 200 |
| Impeccable detector | No findings |

## Real-browser check (headless Chrome over CDP, 1440×900 and 390×844)
- **Hero:** the brain renders with its intro. The headline is readable.
- **Region map:** six coloured regions with leader-line labels. Labels stay on screen at 390 px (they were clipped and are now fixed).
- **Chapters:** all six chapters and the close show the right scene and the right rail number.
- **Instant jumps:** the right layer shows after an instant jump (a stale layer was fixed with a per-frame sync).
- **Errors:** no console errors or warnings in any capture.
- **Reduced motion:** no horizontal overflow.

## Known exceptions (pinned by the client's reference)
- **Chapter numbers and the right number rail:** the Taste lint flags numbering, but the reference design calls for it.
- **Hairline leader lines and rail:** these are kept as drawn in the reference.

## Not yet verified
- **Real GPU:** the captures ran without a GPU. Check frame rate and sharpness on a real midrange phone and a laptop.
- **Browsers:** iPhone Safari, desktop Safari and Firefox.
- **Web Vitals, screen readers:** Lighthouse/Web Vitals, plus NVDA and VoiceOver.
