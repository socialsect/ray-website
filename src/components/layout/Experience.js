"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { EVENTS, track } from "@/lib/analytics/track";
import { lineColors, sectionOrder } from "@/components/scenes/network";
import DoorIntro from "@/components/layout/DoorIntro";

function wantsStill() {
  const c = navigator.connection;
  if (c && c.saveData) return true;
  if (navigator.deviceMemory && navigator.deviceMemory <= 2) return true;
  return false;
}

// Client shell around the server-rendered chapters. It owns the one fixed
// canvas, and GSAP ScrollTrigger turns the reader's scroll into the camera's
// journey through the Atlas and each chapter's own transformation.
export default function Experience({ stations, frames, still, children }) {
  const canvasRef = useRef(null);
  const sceneRef = useRef(null);
  const introRef = useRef(null);
  // The latest state the page asked of the world, replayed when it loads.
  const wanted = useRef({ journey: 0, intro: 0, side: 1, highlight: null, chapters: {} });
  const menuRef = useRef(null);
  const stubButtonRef = useRef(null);
  const [sceneReady, setSceneReady] = useState(false);
  const [current, setCurrent] = useState("hero");
  const [menuOpen, setMenuOpen] = useState(false);
  const [stubAway, setStubAway] = useState(false);

  const byId = Object.fromEntries(stations.map((s) => [s.id, s]));
  const station = byId[current] || null;

  // Mount the WebGL world lazily; the SVG still stays underneath until then.
  useEffect(() => {
    let disposed = false;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (wantsStill()) return;
    import("@/components/scenes/photoStage").then(({ createPhotoStage, supportsWebGL }) => {
      if (disposed || !canvasRef.current || !supportsWebGL()) return;
      const lite = window.matchMedia("(max-width: 767px), (pointer: coarse)").matches;
      try {
        const scene = createPhotoStage(canvasRef.current, { frames, lite, reducedMotion: reduced });
        const w = wanted.current;
        scene.setJourney(w.journey);
        scene.setIntro(reduced ? 1 : w.intro);
        scene.setSide(window.innerWidth >= 1024 ? w.side : 0);
        scene.setHighlight(w.highlight);
        for (const [id, v] of Object.entries(w.chapters)) scene.setChapter(id, v);
        sceneRef.current = scene;
        setSceneReady(true);
      } catch (err) {
        // The still stays in place; the warning feeds WebGL failure monitoring.
        console.warn("Atlas scene unavailable, showing the still instead.", err);
        sceneRef.current = null;
      }
    });
    return () => {
      disposed = true;
      sceneRef.current?.dispose();
      sceneRef.current = null;
    };
  }, [frames]);

  // GSAP: the title sequence, then scroll-linked travel between chapters.
  useEffect(() => {
    let ctx;
    let cancelled = false;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    Promise.all([import("gsap"), import("gsap/ScrollTrigger")]).then(([{ gsap }, { ScrollTrigger }]) => {
      if (cancelled) return;
      gsap.registerPlugin(ScrollTrigger);
      // Animations follow real time even when frames are slow, instead of
      // GSAP's default lag smoothing stretching them out.
      gsap.ticker.lagSmoothing(0);
      const seen = new Set();
      const proxy = { journey: 0, intro: reduced ? 1 : 0 };
      const push = () => {
        wanted.current.journey = proxy.journey;
        wanted.current.intro = proxy.intro;
        sceneRef.current?.setJourney(proxy.journey);
        sceneRef.current?.setIntro(proxy.intro);
      };
      const setSide = (v) => {
        wanted.current.side = v;
        sceneRef.current?.setSide(v);
      };
      const setHighlight = (v) => {
        wanted.current.highlight = v;
        sceneRef.current?.setHighlight(v);
      };
      const wide = window.matchMedia("(min-width: 1024px)");
      let lastY = window.scrollY;

      ctx = gsap.context(() => {
        // The opening title sequence: the camera descends to the gate while
        // the headline rises word by word. Skip intro jumps to its end.
        // When the doors are opening, the courtyard's own arrival waits for them.
        // While the doors are opening, the courtyard's arrival waits for them.
        const doors = document.querySelector(".door-intro")?.dataset.state === "playing";
        const intro = gsap.timeline({ onUpdate: push, paused: doors });
        if (doors) window.addEventListener("rm:doors-open", () => intro.play(), { once: true });
        if (!reduced) {
          intro.to(proxy, { intro: 1, duration: 3.4, ease: "power2.inOut" }, 0);
          intro.from("[data-word]", { yPercent: 115, duration: 1, ease: "power4.out", stagger: 0.08 }, 0.2);
          intro.from("[data-hero-rest]", { opacity: 0, y: 24, duration: 0.8, ease: "power3.out", stagger: 0.1 }, 0.6);
        }
        introRef.current = intro;

        sectionOrder.forEach((id, i) => {
          const el = document.querySelector(`[data-section="${id}"]`);
          if (!el) return;
          ScrollTrigger.create({
            trigger: el,
            start: "top 55%",
            end: "bottom 55%",
            onToggle: (self) => {
              if (!self.isActive) return;
              setCurrent(id);
              const s = stations.find((st) => st.id === id);
              setHighlight(s && s.line !== "interchange" && s.line !== "unknown" ? s.line : null);
              setSide(wide.matches && id !== "connect" ? 1 : 0);
              if (id !== "hero" && !seen.has(id)) {
                seen.add(id);
                track(EVENTS.chapterView, { chapter: id });
              }
            },
          });
        });

        // One master trigger reads the true scroll position, so jumping over
        // several chapters at once still lands the camera in the right place.
        const sections = sectionOrder.map((id) => document.querySelector(`[data-section="${id}"]`));
        ScrollTrigger.create({
          trigger: document.body,
          start: "top top",
          end: "bottom bottom",
          onUpdate: () => {
            const y = window.scrollY;
            if (Math.abs(y - lastY) > 6) {
              setStubAway(y > lastY);
              lastY = y;
            }
            const line = window.innerHeight * 0.55;
            let index = 0;
            let p = 0;
            sections.forEach((el, k) => {
              if (!el) return;
              const r = el.getBoundingClientRect();
              if (r.top <= line) {
                index = k;
                p = Math.min(Math.max((line - r.top) / Math.max(r.height, 1), 0), 1);
              }
            });
            sectionOrder.forEach((id, k) => {
              const chapter = k < index ? 1 : k > index ? 0 : Math.min(p * 1.6, 1);
              if (wanted.current.chapters[id] === chapter) return;
              wanted.current.chapters[id] = chapter;
              sceneRef.current?.setChapter(id, chapter);
            });
            // Hold on the chapter while it is read, travel in the last stretch.
            const travel = Math.min(Math.max((p - 0.6) / 0.4, 0), 1);
            const target = Math.min(index + travel, sectionOrder.length - 1);
            if (reduced) {
              proxy.journey = index;
              push();
            } else {
              gsap.to(proxy, { journey: target, duration: 1.1, ease: "power2.out", overwrite: "auto", onUpdate: push });
            }
          },
        });

        // Headlines arrive with a mask wipe as each chapter enters.
        if (!reduced) {
          gsap.utils.toArray("[data-chapter-title]").forEach((h) => {
            gsap.fromTo(
              h,
              { clipPath: "inset(0% 0% 100% 0%)", y: 30 },
              {
                clipPath: "inset(0% 0% 0% 0%)",
                y: 0,
                duration: 1.1,
                ease: "power4.out",
                clearProps: "clipPath,transform",
                scrollTrigger: { trigger: h, start: "top 85%", once: true },
              },
            );
          });
        }
      });
      push();
    });
    return () => {
      cancelled = true;
      ctx?.revert();
    };
  }, [stations]);

  // Entrance reveals: parts of each chapter rise in once, in order.
  useEffect(() => {
    const els = document.querySelectorAll("[data-reveal]");
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            e.target.classList.add("is-in");
            io.unobserve(e.target);
          }
        }
      },
      { rootMargin: "0px 0px -12% 0px" },
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);

  // Pointer parallax.
  useEffect(() => {
    const root = document.documentElement.style;
    const onMove = (e) => {
      const x = (e.clientX / window.innerWidth) * 2 - 1;
      const y = -((e.clientY / window.innerHeight) * 2 - 1);
      sceneRef.current?.setPointer(x, y);
      root.setProperty("--hx", x.toFixed(3));
      root.setProperty("--hy", y.toFixed(3));
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    return () => window.removeEventListener("pointermove", onMove);
  }, [sceneReady]);

  // Line legend in the hero lights its walkways in the world (hover or focus).
  useEffect(() => {
    const items = document.querySelectorAll("[data-line-preview]");
    const on = (e) => sceneRef.current?.setHighlight(e.currentTarget.dataset.linePreview);
    const off = () => sceneRef.current?.setHighlight(wanted.current.highlight);
    items.forEach((el) => {
      el.addEventListener("pointerenter", on);
      el.addEventListener("focus", on);
      el.addEventListener("pointerleave", off);
      el.addEventListener("blur", off);
    });
    return () =>
      items.forEach((el) => {
        el.removeEventListener("pointerenter", on);
        el.removeEventListener("focus", on);
        el.removeEventListener("pointerleave", off);
        el.removeEventListener("blur", off);
      });
  }, [sceneReady]);

  // Enter and Skip. Both are plain anchors that work without script.
  const onAction = useCallback((e) => {
    const link = e.target.closest("[data-action]");
    if (!link) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const target = document.querySelector(link.getAttribute("href"));
    if (link.dataset.action === "enter") {
      track(EVENTS.heroEnter);
      introRef.current?.progress(1);
    } else if (link.dataset.action === "skip") {
      track(EVENTS.introSkip);
      introRef.current?.progress(1);
    }
    if (target) {
      e.preventDefault();
      // "instant" overrides the page's CSS smooth scrolling: skip means skip.
      target.scrollIntoView({ behavior: link.dataset.action === "enter" && !reduced ? "smooth" : "instant" });
      target.focus({ preventScroll: true });
    }
  }, []);

  // Chapter menu: Escape closes and returns focus to the stub.
  useEffect(() => {
    if (!menuOpen) return;
    const first = () => menuRef.current?.querySelector("a")?.focus({ preventScroll: true });
    first();
    const raf = requestAnimationFrame(first);
    function onKey(e) {
      if (e.key === "Escape") {
        setMenuOpen(false);
        stubButtonRef.current?.focus();
      }
    }
    document.addEventListener("keydown", onKey);
    return () => {
      cancelAnimationFrame(raf);
      document.removeEventListener("keydown", onKey);
    };
  }, [menuOpen]);

  const inHero = current === "hero";
  const signName = station ? station.name : current === "connect" ? "Connect" : current === "identity" ? "Ray" : "The Atlas";
  const signColor = station ? lineColors[station.line] : "#14161A";

  return (
    <div onClick={onAction}>
      <DoorIntro title="Ray's Mind" />
      <div aria-hidden="true" className="fixed inset-0 z-0">
        <div className={`absolute inset-0 transition-opacity duration-1000 ${sceneReady ? "opacity-0" : "opacity-100"}`}>{still}</div>
        <canvas
          ref={canvasRef}
          className={`absolute inset-0 h-full w-full transition-opacity duration-1000 ${sceneReady ? "opacity-100" : "opacity-0"}`}
        />
        {/* Text sits on the left: a scrim there keeps it legible over the world. */}
        <div className={`scrim-left absolute inset-y-0 left-0 hidden w-[72%] transition-opacity duration-700 lg:block ${inHero ? "opacity-75" : "opacity-100"}`} />
        <div className={`absolute inset-0 bg-ground transition-opacity duration-700 lg:hidden ${inHero ? "opacity-45" : "opacity-80"}`} />
      </div>

      <header className="fixed inset-x-0 top-0 z-40 bg-ground/90">
        <div className="mx-auto flex h-16 max-w-[1440px] items-center justify-between gap-6 px-4 md:h-20 md:px-8">
          <a href="#top" className="flex items-center gap-3 font-display text-[22px] font-bold tracking-[-0.01em] text-ink">
            RayMindset
            <span className="hidden items-center gap-2 text-[14px] font-normal text-muted sm:flex" aria-live="polite">
              <span className="inline-block size-2.5 rounded-full" style={{ background: signColor }} />
              {signName}
            </span>
          </a>
          <nav aria-label="Primary" className="flex items-center gap-1 md:gap-2">
            {[
              ["#origin", "Story"],
              ["#building", "Work"],
              ["#thinking", "Ideas"],
            ].map(([href, label]) => (
              <a key={href} href={href} className="hidden px-4 py-2 text-[14px] text-ink transition-colors duration-200 hover:bg-raised md:inline-block">
                {label}
              </a>
            ))}
            <a
              href="#connect"
              className="bg-ink px-5 py-2.5 text-[14px] font-semibold text-ground transition-transform duration-200 hover:-translate-y-0.5 active:translate-y-0"
            >
              Get in touch
            </a>
          </nav>
        </div>
      </header>

      <div className="relative z-10">{children}</div>

      <nav
        aria-label="Chapters"
        className={`fixed bottom-4 left-4 z-40 transition-[opacity,transform] duration-300 ease-out-expo md:bottom-8 md:left-8 ${
          inHero ? "hidden" : "block"
        } ${stubAway && !menuOpen ? "pointer-events-none translate-y-[calc(100%+2rem)]" : "translate-y-0"}`}
      >
        {menuOpen && (
          <ul ref={menuRef} id="chapter-menu" className="ticket-stock mb-3 w-[min(320px,calc(100vw-32px))] bg-paper py-3 text-ground overlay-shadow">
            {[{ id: "identity", name: "Ray", line: "interchange" }, ...stations, { id: "connect", name: "Connect", line: "interchange" }].map((s) => (
              <li key={s.id}>
                <a
                  href={`#${s.id}`}
                  onClick={() => setMenuOpen(false)}
                  aria-current={current === s.id ? "location" : undefined}
                  className="flex items-center gap-3 px-5 py-2.5 text-[17px] transition-colors duration-150 hover:bg-ground/10 aria-[current=location]:font-semibold"
                >
                  <span
                    className="inline-block size-3 rounded-full border-[3px]"
                    style={{ borderColor: s.line === "interchange" || s.line === "unknown" ? "#F1F2EF" : lineColors[s.line] }}
                  />
                  {s.name}
                </a>
              </li>
            ))}
          </ul>
        )}
        <button
          ref={stubButtonRef}
          type="button"
          aria-expanded={menuOpen}
          aria-controls="chapter-menu"
          tabIndex={inHero ? -1 : 0}
          onClick={() => setMenuOpen((o) => !o)}
          onFocus={() => setStubAway(false)}
          className="ticket-stub flex min-h-12 items-center gap-3 bg-paper py-3 pl-4 pr-6 text-left text-ground transition-transform duration-200 hover:-translate-y-0.5"
        >
          <span className="inline-block h-8 w-1.5 rounded-full" style={{ background: station && station.line !== "interchange" && station.line !== "unknown" ? signColor : "#F1F2EF" }} />
          <span className="flex flex-col leading-tight">
            <span className="text-[13px] text-ground/75">{menuOpen ? "Close chapters" : "You are at"}</span>
            <span className="font-display text-[17px] font-bold uppercase">{signName}</span>
          </span>
        </button>
      </nav>
    </div>
  );
}
