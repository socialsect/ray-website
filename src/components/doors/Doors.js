"use client";

import { useEffect, useRef, useState } from "react";
import { EVENTS, track } from "@/lib/analytics/track";
import { chapters, sectionOrder } from "./world";

// Ground colour behind each section: the loading state and the no-WebGL view.
const GROUND = { hero: "#0d0c0b", threshold: "#14110e", journey: "#3b2f24", ventures: "#1d2129", discipline: "#2a241e", exploration: "#3a4450", expression: "#1a1612", ideas: "#121418", close: "#2a2620" };

// Client shell around the server-rendered sections. It owns the one fixed
// canvas; Lenis and GSAP ScrollTrigger turn scroll into the walk through the
// doors. Sections carry data-door (their place on the path) and data-shade
// (where the scene darkens behind their words: left,right,top,bottom,centre).
export default function Doors({ children, scene = true }) {
  const canvasRef = useRef(null);
  const groundRef = useRef(null);
  const sceneRef = useRef(null);
  const journeyRef = useRef(0);
  const [mode, setMode] = useState("pending");
  const [current, setCurrent] = useState("hero");
  const [present, setPresent] = useState([]);

  useEffect(() => {
    let disposed = false;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const conn = navigator.connection;
    const spare = conn?.saveData || (navigator.deviceMemory && navigator.deviceMemory <= 2);
    // A page built on painted scenes needs no 3D world behind it.
    if (!scene) return;
    import("./doorsScene")
      .then(({ createDoorsScene, supportsWebGL, isSoftwareRenderer }) => {
        if (disposed || !canvasRef.current) return;
        if (spare || !supportsWebGL()) return setMode("fallback");
        try {
          // `?tier=full|lite|minimal` forces a quality tier, for checking the look.
          const forced = new URLSearchParams(window.location.search).get("tier");
          const minimal = forced ? forced === "minimal" : isSoftwareRenderer();
          const lite = forced ? forced !== "full" : minimal || window.matchMedia("(max-width: 767px), (pointer: coarse)").matches;
          const scene = createDoorsScene(canvasRef.current, { lite, minimal, reducedMotion: reduced, onReady: () => !disposed && setMode("live") });
          scene.setJourney(journeyRef.current, true);
          sceneRef.current = scene;
        } catch (e) {
          console.warn("Doors scene unavailable; showing the page without it.", e);
          setMode("fallback");
        }
      })
      .catch((e) => {
        console.warn("Doors scene failed to load; showing the page without it.", e);
        setMode("fallback");
      });
    return () => {
      disposed = true;
      sceneRef.current?.dispose();
      sceneRef.current = null;
    };
  }, [scene]);

  useEffect(() => {
    let ctx;
    let cancelled = false;
    let lenis = null;
    let tick = null;
    let gsapRef = null;
    let remove = () => {};
    Promise.all([import("gsap"), import("gsap/ScrollTrigger"), import("lenis")]).then(([{ gsap }, { ScrollTrigger }, { default: Lenis }]) => {
      if (cancelled) return;
      gsapRef = gsap;
      gsap.registerPlugin(ScrollTrigger);
      const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      if (!reduced) {
        lenis = new Lenis({ duration: 1.25, easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)), smoothWheel: true, anchors: true });
        lenis.on("scroll", ScrollTrigger.update);
        tick = (time) => lenis.raf(time * 1000);
        gsap.ticker.add(tick);
        gsap.ticker.lagSmoothing(0);
      }
      const sections = [...document.querySelectorAll("[data-door]")];
      const ids = sections.map((s) => s.dataset.door);
      setPresent(ids);
      const lastId = ids[ids.length - 1];
      const seen = new Set();
      let shown = "";
      ctx = gsap.context(() => {
        const update = () => {
          const line = window.innerHeight * 0.5;
          let index = 0;
          let p = 0;
          sections.forEach((el, k) => {
            const r = el.getBoundingClientRect();
            if (r.top <= line) {
              index = k;
              p = Math.min(Math.max((line - r.top) / Math.max(r.height, 1), 0), 1);
            }
          });
          if (index === 0) p = Math.min(window.scrollY / Math.max(sections[0].offsetHeight, 1), 1);
          const id = ids[index];
          // The last built section holds its view: the path beyond is not yet open.
          const local = id === lastId && id !== "close" ? Math.min(p, 0.4) : p;
          const journey = sectionOrder.indexOf(id) + (reduced ? 0 : local);
          journeyRef.current = journey;
          sceneRef.current?.setJourney(journey, reduced);
          if (id !== shown) {
            shown = id;
            setCurrent(id);
            if (groundRef.current) groundRef.current.style.backgroundColor = GROUND[id] || GROUND.hero;
            const wide = window.innerWidth >= 1024;
            const s = (sections[index].dataset.shade || "0,0,0,0,0").split(",").map(Number);
            sceneRef.current?.setShade(wide ? s : [0, 0, 0, 0.5], wide ? s[4] : 0.45);
            if (chapters.some((c) => c.id === id) && !seen.has(id)) {
              seen.add(id);
              track(EVENTS.chapterView, { chapter: id });
            }
          }
        };
        ScrollTrigger.create({ trigger: document.body, start: "top top", end: "bottom bottom", onUpdate: update });
        window.addEventListener("scroll", update, { passive: true });
        window.addEventListener("resize", update);
        remove = () => {
          window.removeEventListener("scroll", update);
          window.removeEventListener("resize", update);
        };
        update();
        if (reduced) return;
        gsap.utils.toArray("[data-reveal-group]").forEach((el) => {
          const parts = el.querySelectorAll("[data-in]");
          if (parts.length) gsap.from(parts, { y: 28, opacity: 0, duration: 1.1, ease: "power3.out", stagger: 0.09, scrollTrigger: { trigger: el, start: "top 78%", once: true } });
        });
        gsap.utils.toArray("[data-rise]").forEach((h) => {
          gsap.from(h.querySelectorAll("[data-word]"), { yPercent: 110, duration: 1.2, ease: "expo.out", stagger: 0.06, scrollTrigger: { trigger: h, start: "top 85%", once: true } });
        });
        // Each scene opens from its centre like a door as it arrives, then
        // pushes in slowly while its chapter is read.
        gsap.utils.toArray("[data-band]").forEach((el) => {
          const sec = el.closest("section");
          gsap.fromTo(el, { clipPath: "inset(0% 50% 0% 50%)" }, { clipPath: "inset(0% 0% 0% 0%)", ease: "power2.inOut", scrollTrigger: { trigger: sec, start: "top 95%", end: "top 25%", scrub: 0.6 } });
          const img = el.querySelector("img");
          if (img) gsap.fromTo(img, { scale: 1.22, yPercent: -4 }, { scale: 1.04, yPercent: 4, ease: "none", scrollTrigger: { trigger: sec, start: "top bottom", end: "bottom top", scrub: 0.6 } });
        });
        // The opening scene drifts and deepens as the page leaves it.
        const hero = document.querySelector("[data-hero-scene]");
        if (hero) gsap.fromTo(hero, { scale: 1.08 }, { scale: 1.3, yPercent: 8, ease: "none", scrollTrigger: { trigger: hero.closest("section"), start: "top top", end: "bottom top", scrub: 0.6 } });
        // Ray's words light up one by one as they are read.
        gsap.utils.toArray("[data-scrub]").forEach((el) => {
          gsap.fromTo(el.querySelectorAll("[data-w]"), { opacity: 0.18 }, { opacity: 1, stagger: 0.1, ease: "none", scrollTrigger: { trigger: el, start: "top 82%", end: "bottom 50%", scrub: true } });
        });
        // Photographs open from their lower edge and settle from close up.
        gsap.utils.toArray("[data-open]").forEach((el) => {
          gsap.fromTo(el, { clipPath: "inset(100% 0% 0% 0%)" }, { clipPath: "inset(0% 0% 0% 0%)", duration: 1.4, ease: "expo.out", scrollTrigger: { trigger: el, start: "top 88%", once: true } });
          const img = el.querySelector("img");
          if (img) gsap.fromTo(img, { scale: 1.25 }, { scale: 1, duration: 1.8, ease: "expo.out", scrollTrigger: { trigger: el, start: "top 88%", once: true } });
        });
      });
    });
    return () => {
      cancelled = true;
      remove();
      ctx?.revert();
      if (tick && gsapRef) gsapRef.ticker.remove(tick);
      lenis?.destroy();
    };
  }, []);

  useEffect(() => {
    const onMove = (e) => sceneRef.current?.setPointer((e.clientX / window.innerWidth) * 2 - 1, -((e.clientY / window.innerHeight) * 2 - 1));
    window.addEventListener("pointermove", onMove, { passive: true });
    return () => window.removeEventListener("pointermove", onMove);
  }, []);

  const order = present.length ? present : ["hero"];
  const progress = Math.max(order.indexOf(current), 0) / Math.max(order.length - 1, 1);
  const chapterIndex = chapters.findIndex((c) => c.id === current) + 1 || (current === "close" ? chapters.length : 0);

  return (
    <div
      ref={groundRef}
      onClick={(e) => {
        const a = e.target.closest("a[data-enter]");
        if (a) {
          track(EVENTS.heroEnter);
          document.getElementById(a.getAttribute("href").slice(1))?.focus({ preventScroll: true });
        }
      }}
      className="relative overflow-x-clip text-ivory transition-[background-color] duration-[1200ms] ease-out"
      style={{ backgroundColor: GROUND.hero }}
    >
      <canvas
        ref={canvasRef}
        aria-hidden="true"
        className={`pointer-events-none fixed inset-0 z-0 h-svh w-full transition-opacity duration-[1400ms] ${mode === "live" ? "opacity-100" : "opacity-0"}`}
      />

      {/* The chapters, numbered, on a line of points at the right edge. */}
      <nav aria-label="Chapters" className={`fixed right-[clamp(20px,3vw,48px)] top-1/2 z-30 hidden -translate-y-1/2 transition-opacity duration-500 lg:block ${current === "close" ? "pointer-events-none opacity-0" : "opacity-100"}`}>
        <ol className="relative space-y-1 bg-ink-deep/60 py-4 pl-5 pr-10">
          <span aria-hidden="true" className="absolute right-[19px] top-6 bottom-6 w-px bg-ivory/35" />
          {chapters.map((c, i) => {
            const on = current === c.id;
            return (
              <li key={c.id}>
                <a href={`#${c.id}`} aria-current={on ? "location" : undefined} className="group relative flex min-h-8 items-center justify-end gap-4 text-[14px] text-ivory/90 transition-colors hover:text-ivory aria-[current=location]:text-ivory">
                  <span className="tabular-nums text-ivory/50 group-aria-[current=location]:text-gold">{String(i + 1).padStart(2, "0")}</span>
                  <span className="w-[86px]">{c.name}</span>
                  <span aria-hidden="true" className={`absolute -right-[23px] size-[7px] rounded-full transition-[transform,background-color] duration-300 ${on ? "scale-150 bg-gold" : "bg-ivory/60"}`} />
                </a>
              </li>
            );
          })}
        </ol>
      </nav>

      {/* The progress line along the bottom of the screen. */}
      <div aria-hidden="true" className={`pointer-events-none fixed inset-x-0 bottom-0 z-30 hidden transition-opacity duration-500 lg:block ${current === "close" ? "opacity-0" : "opacity-100"}`}>
        <div className="rm-frame flex items-center gap-6 pb-5 text-[12px] tracking-[0.3em] text-ivory/80">
          <span>RAYMINDSET</span>
          <span className="relative h-px flex-1 bg-ivory/25">
            <span className="absolute inset-y-0 left-0 bg-gold transition-[width] duration-700 ease-out" style={{ width: `${progress * 100}%` }} />
          </span>
          <span className="tabular-nums tracking-[0.15em]">{String(Math.max(chapterIndex, 1)).padStart(2, "0")} / {String(chapters.length).padStart(2, "0")}</span>
        </div>
      </div>

      {/* Quiet shades so the menu, the chapter list and the progress line read over any sky. */}
      <div aria-hidden="true" className="rm-shade-left pointer-events-none fixed inset-y-0 left-0 z-[5] w-full lg:w-[46vw]" />
      <div aria-hidden="true" className="rm-shade-top pointer-events-none fixed inset-x-0 top-0 z-[5] h-40" />
      <div aria-hidden="true" className="rm-shade-right pointer-events-none fixed inset-y-0 right-0 z-[5] hidden w-[340px] lg:block" />
      <div aria-hidden="true" className="rm-shade-bottom pointer-events-none fixed inset-x-0 bottom-0 z-[5] hidden h-28 lg:block" />

      <div className="relative z-10">{children}</div>
    </div>
  );
}
