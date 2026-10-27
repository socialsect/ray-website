# QA Report — homepage ("Ray's mind", light redesign)

2026-10-27, production build (`npm run build && npm start`).

## Automated
| Check | Result |
|-------|--------|
| ESLint | Clean |
| Unit tests (Vitest) | 26 passing |
| Production build | Passes; all routes static |
| Routes | `/`, `/atlas` and `/museum` return 200; unknown routes return 404; brain meshes return 200 |
| Taste Skill lint | 0 FAIL, 0 WARN |
| Taste Skill inspector (1440 / 768 / 390) | 0 FAIL, 4 WARN (below) |
| Impeccable detector | No findings |

## Real-browser check (headless Chrome over CDP, 1440, 1900 and 390 wide)
- **Opening:** dust gathers into the brain, and the name rises letter by letter. On scroll, the name opens out and the brain fills the screen before the page turns white.
- **Intro:** Ray's statement lights up word by word, and the brain turns with the scroll.
- **Map:** labels and leader lines draw in one by one, staying below the heading. The map then lights each region in turn, brain and label together.
- **Chapters:** six forms (road, tower, ring, globe, book, spiral) morph with a scatter-and-turn. Each chapter has its own colour wash and a drifting giant name.
- **Close, contact and footer:** render cleanly.
- **Console:** no errors or warnings in any capture.

## Inspector warnings, defended
- **Font sizes:** the count includes the monument mid-dive and the decorative giant chapter names.
- **No footage:** no honest clip of Ray exists. The particle scene is the moving picture.
- **Blank stretches and pinned heading over a picture:** the inspector cannot see what the WebGL canvas draws. Those areas hold the 3D forms, and the map heading sits clear of the brain.

## Not yet verified
- **Hardware:** real-GPU frame rate on a midrange phone and a laptop.
- **Browsers:** Safari and Firefox.
- **Accessibility tools:** screen readers.
