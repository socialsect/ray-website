"use client";

import { useEffect, useRef, useState } from "react";
import { EVENTS, track } from "@/lib/analytics/track";

// Ray's mind as one cloud of particles fixed behind the page. The scroll
// position decides which form it holds, where it stands, its colours and
// the colour of the page around it.

const ORANGE = "#ff7a1f";
const WHITE = "#ffffff";
const INK = "#050f16";
const SKY = "#cfe2ff";
const LIME = "#e8f5d0";
const SUN = "#ffd23f";

// A chapter's ground: its colour, washed almost to white.
const wash = (hex, k = 0.9) => {
  const n = parseInt(hex.slice(1), 16);
  const mix = (c) => Math.round(c + (255 - c) * k);
  return `rgb(${mix(n >> 16)} ${mix((n >> 8) & 255)} ${mix(n & 255)})`;
};

const smooth = (a, b, v) => {
  const t = Math.min(Math.max((v - a) / (b - a), 0), 1);
  return t * t * (3 - 2 * t);
};

export default function Mind({ regions, children }) {
  const canvasRef = useRef(null);
  const groundRef = useRef(null);
  const mindRef = useRef(null);
  const labelRefs = useRef([]);
  const lineRefs = useRef([]);
  const tailRefs = useRef([]);
  const userHover = useRef(-1);
  const litRef = useRef(-1);
  const idRef = useRef("hero");
  const groundNow = useRef("");
  const lenisRef = useRef(null);
  const cursorRef = useRef(null);
  const [mode, setMode] = useState("pending");
  const [current, setCurrent] = useState("hero");
  const mapRef = useRef(0);
  const updateRef = useRef(() => {});

  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const lite = window.matchMedia("(max-width: 767px), (pointer: coarse)").matches;
    let disposed = false;
    import("./particleMind").then(({ createParticleMind, supportsWebGL }) => {
      if (disposed || !canvasRef.current) return;
      if (!supportsWebGL()) {
        setMode("fallback");
        return;
      }
      try {
        mindRef.current = createParticleMind(canvasRef.current, { regions, lite, reducedMotion: reduced, onReady: () => updateRef.current() });
        setMode("live");
        document.documentElement.classList.add("mind-live");
        updateRef.current();
        mindRef.current.jumpView();
      } catch (e) {
        console.warn("Mind scene unavailable", e);
        setMode("fallback");
      }
    });
    return () => {
      disposed = true;
      document.documentElement.classList.remove("mind-live");
      mindRef.current?.dispose();
      mindRef.current = null;
    };
  }, [regions]);

  // Labels and their leader lines follow the brain every frame, outside React.
  useEffect(() => {
    if (mode !== "live") return;
    let raf = 0;
    let lastY = -1;
    let frame = 0;
    const tick = () => {
      raf = requestAnimationFrame(tick);
      // The page state follows the true scroll position every frame it moves,
      // so no jump or missed event can leave a stale form on screen.
      if (window.scrollY !== lastY || ++frame % 30 === 0) {
        lastY = window.scrollY;
        updateRef.current();
      }
      const mind = mindRef.current;
      if (!mind) return;
      const W = window.innerWidth;
      const H = window.innerHeight;
      const pts = mind.screen;
      const cx = pts.reduce((a, s) => a + s.x, 0) / pts.length;
      const cy = pts.reduce((a, s) => a + s.y, 0) / pts.length;
      const reach = Math.min(W, H) * (W < 768 ? 0.2 : 0.22);
      const show = mapRef.current;
      // Labels stay below the map's heading.
      const title = document.getElementById("map-title");
      const top = Math.max(title ? title.getBoundingClientRect().bottom + 36 : 110, W < 768 ? 200 : 110);
      // Once the map is fully drawn, it lights one region after another until the reader picks one.
      const cycling = show > 0.95 && userHover.current < 0;
      const lit = cycling ? Math.floor(performance.now() / 1600) % pts.length : userHover.current;
      if (lit !== litRef.current) {
        litRef.current = lit;
        mind.setHover(lit);
      }
      // On the map, the whole page takes the colour of the region that is lit.
      if (idRef.current === "map" && groundRef.current) {
        const g = lit >= 0 && show > 0.5 ? wash(regions[lit].color, 0.8) : LIME;
        if (g !== groundNow.current) {
          groundNow.current = g;
          groundRef.current.style.backgroundColor = g;
        }
      }
      pts.forEach((s, i) => {
        const label = labelRefs.current[i];
        const line = lineRefs.current[i];
        const tailEl = tailRefs.current[i];
        if (!label || !line || !tailEl) return;
        const dx = s.x - cx;
        const dy = s.y - cy;
        const len = Math.hypot(dx, dy) || 1;
        const right = dx >= 0;
        const arm = W < 768 ? 12 : 28;
        // Keep the whole label on screen: leader end + tail + label width.
        const room = (label.offsetWidth || 120) + arm + 18;
        const ex = right
          ? Math.min(Math.max(s.x + (dx / len) * reach, 24), W - room)
          : Math.max(Math.min(s.x + (dx / len) * reach, W - 24), room);
        const ey = Math.min(Math.max(s.y + (dy / len) * reach * 0.8, top), H - 90);
        // Each label is drawn in on its own beat: the line grows out of the brain, then the name arrives.
        const beat = smooth(i * 0.1, i * 0.1 + 0.4, show);
        const grow = smooth(0, 0.6, beat);
        const o = smooth(0.5, 1, beat);
        const ll = Math.hypot(ex - s.x, ey - s.y);
        line.style.width = `${ll}px`;
        line.style.transform = `translate3d(${s.x}px, ${s.y}px, 0) rotate(${Math.atan2(ey - s.y, ex - s.x)}rad) scaleX(${grow})`;
        tailEl.style.width = `${arm}px`;
        tailEl.style.transform = `translate3d(${right ? ex : ex - arm}px, ${ey}px, 0) scaleX(${smooth(0.5, 0.8, beat)})`;
        tailEl.style.transformOrigin = right ? "0 50%" : "100% 50%";
        const on = lit === i;
        line.style.opacity = tailEl.style.opacity = String(grow > 0.01 ? (lit >= 0 && !on ? 0.6 : 1) : 0);
        label.style.opacity = String(o * (lit >= 0 && !on ? 0.72 : 1));
        // Faded out means gone: nothing invisible stays over the words.
        const vis = grow > 0.01 ? "visible" : "hidden";
        label.style.visibility = line.style.visibility = tailEl.style.visibility = vis;
        label.style.pointerEvents = o > 0.5 ? "auto" : "none";
        label.style.transform = `translate3d(${right ? ex + arm + 6 : ex - arm - 6}px, ${ey}px, 0) translate(${right ? "0" : "-100%"}, -50%) translateY(${(1 - o) * 10}px) scale(${on ? 1.08 : 1})`;
      });
    };
    tick();
    return () => cancelAnimationFrame(raf);
  }, [mode, regions]);

  // Scroll decides the form, the view, the colours and the page's ground.
  useEffect(() => {
    let ctx;
    let cancelled = false;
    let removeScroll = () => {};
    let lenis = null;
    let lenisTick = null;
    let gsapRef = null;
    Promise.all([import("gsap"), import("gsap/ScrollTrigger"), import("lenis")]).then(([{ gsap }, { ScrollTrigger }, { default: Lenis }]) => {
      if (cancelled) return;
      gsapRef = gsap;
      gsap.registerPlugin(ScrollTrigger);
      const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      // Smooth, weighted scrolling. The page keeps its native scroll position,
      // so sticky sections, anchors and ScrollTrigger all behave as before.
      if (!reduced) {
        lenis = new Lenis({ duration: 1.2, easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)), smoothWheel: true, anchors: { offset: 0 } });
        lenisRef.current = lenis;
        const root = document.documentElement;
        let skew = 0;
        lenis.on("scroll", ({ velocity }) => {
          ScrollTrigger.update();
          // Fast scrolling stirs the thoughts and leans the photographs.
          mindRef.current?.setStir(Math.min(Math.abs(velocity) / 40, 1));
          skew = Math.max(-5, Math.min(5, velocity * 0.12));
          root.style.setProperty("--mind-skew", `${skew.toFixed(2)}deg`);
        });
        lenisTick = (time) => lenis.raf(time * 1000);
        gsap.ticker.add(lenisTick);
        gsap.ticker.lagSmoothing(0);
      }
      const ids = ["hero", "intro", "map", ...regions.map((r) => r.id), "close"];
      const sections = ids.map((id) => document.querySelector(`[data-mind="${id}"]`));
      const monument = document.querySelector("[data-monument]");
      const heroFade = document.querySelector("[data-hero-fade]");
      const formOf = (id) => (regions.some((r) => r.id === id) ? id : "brain");
      const seen = new Set();
      let lastId = "";
      let lastGround = "";
      let update = () => {};
      ctx = gsap.context(() => {
        update = () => {
          const W = window.innerWidth;
          const H = window.innerHeight;
          const wide = W >= 1024;
          const phone = W < 768;
          // A section takes over the moment its top enters the screen.
          const line = H * 0.85;
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
          const id = ids[index];
          const chapter = regions.findIndex((r) => r.id === id);
          if (id !== lastId) {
            lastId = id;
            setCurrent(id);
            if (chapter >= 0 && !seen.has(id)) {
              seen.add(id);
              track(EVENTS.chapterView, { chapter: id });
            }
          }

          // The page's ground: orange for the opening and the close, white between.
          idRef.current = id;
          const ground = id === "hero" ? ORANGE : id === "intro" ? SKY : id === "close" ? SUN : chapter >= 0 ? wash(regions[chapter].color) : id === "map" ? groundNow.current || LIME : WHITE;
          if (id !== "map" && ground !== lastGround && groundRef.current) {
            groundRef.current.style.backgroundColor = ground;
            groundNow.current = ground;
          }
          lastGround = id === "map" ? "" : ground;

          // The monument settles as the first screen leaves.
          const q = Math.min(window.scrollY / H, 1);
          if (heroFade) heroFade.style.opacity = String(1 - smooth(0, 0.25, q));
          if (monument) {
            // Into the mind: the name opens around the reader as the brain rushes in.
            monument.style.transform = `scale(${1 + 0.9 * smooth(0, 1, q)})`;
            monument.style.letterSpacing = `${-0.045 + 0.06 * smooth(0, 1, q)}em`;
            monument.style.opacity = String(1 - smooth(0.2, 0.75, q));
          }

          const mind = mindRef.current;
          if (!mind) return;
          mind.setScroll(window.scrollY / H);
          // The real brain holds the opening; it dissolves into thought as the dive begins.
          // Every section shows its real object; the map paints its regions onto the brain itself.
          mind.setSolid(1);
          const prev = index > 0 ? formOf(ids[index - 1]) : formOf(id);
          // The moment a section takes over, its form gathers, on its own clock.
          mind.setForm(prev, formOf(id), 1);

          // Where the form stands.
          let view;
          if (id === "hero") {
            const base = wide ? { x: 0, y: 0.02, z: 6.2, scale: 1.08 } : phone ? { x: 0, y: -0.6, z: 7.6, scale: 0.74 } : { x: 0, y: -0.4, z: 7, scale: 0.95 };
            // Through the name and into the mind.
            view = { ...base, z: base.z - 3.2 * smooth(0, 1, q), rot: 0.6 * smooth(0, 1, q) };
          } else if (id === "intro") {
            view = wide ? { x: -1.12, y: 0, z: 6, scale: 0.9, rot: -0.9 + 2.2 * p } : { x: 0, y: 0.55, z: phone ? 8.4 : 7.6, scale: 0.8, rot: -0.9 + 2.2 * p };
          } else if (id === "map") {
            // The brain turns slowly under the reader as the map is read.
            const turn = -0.35 + 0.7 * smooth(0, 1, p);
            view = wide ? { x: 0, y: -0.04, z: 5.5, scale: 1, rot: turn } : { x: 0, y: 0.18, z: phone ? 9.4 : 7.2, scale: phone ? 0.62 : 0.86, rot: turn };
          } else if (id === "close") {
            view = wide ? { x: 1.05, y: 0.12, z: 6.2, scale: 0.82, rot: 0 } : { x: 0, y: 1.2, z: 8.4, scale: 0.58, rot: 0 };
          } else {
            // The object stands in front of its chapter's photograph, on the stage side.
            const side = chapter % 2 === 0 ? -1 : 1;
            view = wide ? { x: side * 1.32, y: 0.12, z: 6, scale: 0.74, rot: -side * 0.3 } : { x: 0, y: 0.62, z: phone ? 8.4 : 7.6, scale: 0.72, rot: 0 };
          }
          mind.setView(view);

          // Colours: white thoughts on orange; ink, tinted by the chapter, on white.
          if (id === "hero") mind.setColors(WHITE, WHITE, 0);
          else if (id === "intro") mind.setColors(INK, "#2142e8", 0.35, 0.5);
          else if (id === "close") mind.setColors(INK, ORANGE, 0.35, 0.55);
          else if (id === "map") mind.setColors(INK, INK, 0, 0.6);
          else mind.setColors(INK, regions[chapter].color, 0.7, 0.6);

          // The map lights its regions while it is read.
          // The labels wait until the map's heading has settled, then draw in one by one.
          mapRef.current = id === "map" ? Math.min(Math.max((p - 0.46) / 0.26, 0), 1) * (1 - smooth(0.92, 1, p)) : 0;
          mind.setMap(mapRef.current);
          if (id === "map") mind.skipIntro();

          // On narrow screens the form sits above the words, then steps back for them.
          const canvas = canvasRef.current;
          if (canvas) {
            // In front of the page from the intro on, so each object stands before its photograph;
            // behind the name in the opening; hidden once the close has passed.
            const closeEl = sections[sections.length - 1];
            canvas.style.zIndex = id === "hero" || !wide ? "0" : "15";
            canvas.style.visibility = closeEl && closeEl.getBoundingClientRect().bottom < 0 ? "hidden" : "visible";
          }
          if (canvas) canvas.style.opacity = !wide && (chapter >= 0 || id === "intro") ? String(smooth(0.16, 0.26, p) * (1 - 0.82 * smooth(0.33, 0.47, p))) : "1";

          // Nothing to draw once the page has passed the close.
          const close = sections[sections.length - 1];
          mind.setPaused(close ? close.getBoundingClientRect().bottom < 0 : false);
        };
        ScrollTrigger.create({ trigger: document.body, start: "top top", end: "bottom bottom", onUpdate: () => update() });
        update();
        updateRef.current = update;
        let queued = false;
        const onScroll = () => {
          if (queued) return;
          queued = true;
          requestAnimationFrame(() => {
            queued = false;
            update();
          });
        };
        window.addEventListener("scroll", onScroll, { passive: true });
        window.addEventListener("resize", onScroll);
        removeScroll = () => {
          window.removeEventListener("scroll", onScroll);
          window.removeEventListener("resize", onScroll);
        };
        // With reduced motion the page is simply there: no reveals.
        if (reduced) return;
        // The parts of every section arrive in order, once.
        gsap.utils.toArray("[data-reveal-group]").forEach((el) => {
          const parts = el.querySelectorAll("[data-in]");
          if (!parts.length) return;
          gsap.from(parts, {
            y: 28,
            opacity: 0,
            duration: 1,
            ease: "power3.out",
            stagger: 0.08,
            scrollTrigger: { trigger: el, start: "top 78%", once: true },
          });
        });
        // Chapter names rise letter by letter.
        gsap.utils.toArray("[data-mind] h2[aria-label]").forEach((h) => {
          const chars = h.querySelectorAll("[data-char]");
          if (!chars.length) return;
          gsap.from(chars, {
            yPercent: 110,
            duration: 1.1,
            ease: "expo.out",
            stagger: 0.035,
            scrollTrigger: { trigger: h, start: "top 82%", once: true },
          });
        });
        // The footer's name rises letter by letter as the page ends.
        const footerChars = document.querySelectorAll("[data-footer-name] [data-char]");
        if (footerChars.length)
          gsap.from(footerChars, { yPercent: 105, duration: 1.2, ease: "expo.out", stagger: 0.05, scrollTrigger: { trigger: "[data-footer-name]", start: "top 95%", once: true } });
        // Ray's own statement lights up word by word as it is read.
        gsap.utils.toArray("[data-scrub]").forEach((el) => {
          gsap.fromTo(
            el.querySelectorAll("[data-w]"),
            { opacity: 0.14 },
            { opacity: 1, stagger: 0.1, ease: "none", scrollTrigger: { trigger: el, start: "top 80%", end: "bottom 45%", scrub: true } },
          );
        });
        // The giant chapter names drift across as their chapter is read.
        gsap.utils.toArray("[data-drift]").forEach((el) => {
          gsap.fromTo(el, { xPercent: 20 }, { xPercent: -45, ease: "none", scrollTrigger: { trigger: el.parentElement, start: "top bottom", end: "bottom top", scrub: true } });
        });
        // Each chapter's photograph opens from its lower edge.
        gsap.utils.toArray("[data-photo]").forEach((el) => {
          gsap.fromTo(
            el,
            { clipPath: "inset(100% 0 0 0)" },
            { clipPath: "inset(0% 0 0 0)", duration: 1.3, ease: "expo.out", scrollTrigger: { trigger: el, start: "top 85%", once: true } },
          );
          const img = el.querySelector("img");
          if (img) gsap.fromTo(img, { scale: 1.18 }, { scale: 1, ease: "none", scrollTrigger: { trigger: el, start: "top bottom", end: "bottom top", scrub: true } });
        });
      });
    });
    return () => {
      cancelled = true;
      removeScroll();
      ctx?.revert();
      if (lenisTick && gsapRef) gsapRef.ticker.remove(lenisTick);
      lenis?.destroy();
      lenisRef.current = null;
    };
  }, [regions]);

  // A cursor that follows with weight, inverts what lies beneath it and grows
  // over anything clickable; buttons lean toward it. Fine pointers only.
  useEffect(() => {
    if (!window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const dot = cursorRef.current;
    if (!dot) return;
    let x = -100, y = -100, cx = -100, cy = -100, s = 1, ts = 1, raf = 0;
    const onMove = (e) => {
      x = e.clientX;
      y = e.clientY;
      const hit = e.target.closest?.("a, button, summary");
      ts = hit ? 3.2 : 1;
      document.querySelectorAll(".mind-button").forEach((b) => {
        const r = b.getBoundingClientRect();
        const dx = x - (r.left + r.width / 2);
        const dy = y - (r.top + r.height / 2);
        const near = Math.abs(dx) < r.width && Math.abs(dy) < r.height * 1.6;
        b.style.translate = near ? `${dx * 0.18}px ${dy * 0.3}px` : "0 0";
      });
    };
    const loop = () => {
      raf = requestAnimationFrame(loop);
      cx += (x - cx) * 0.18;
      cy += (y - cy) * 0.18;
      s += (ts - s) * 0.15;
      dot.style.transform = `translate3d(${cx}px, ${cy}px, 0) translate(-50%, -50%) scale(${s})`;
    };
    document.documentElement.classList.add("mind-cursor-on");
    window.addEventListener("pointermove", onMove, { passive: true });
    loop();
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("pointermove", onMove);
      document.documentElement.classList.remove("mind-cursor-on");
    };
  }, []);

  // The live thing: the cursor (or a finger) parts the thoughts around it.
  useEffect(() => {
    const onMove = (e) => {
      mindRef.current?.setPointer((e.clientX / window.innerWidth) * 2 - 1, -((e.clientY / window.innerHeight) * 2 - 1), true);
    };
    const onLeave = () => mindRef.current?.setPointer(9, 9, false);
    window.addEventListener("pointermove", onMove, { passive: true });
    document.documentElement.addEventListener("pointerleave", onLeave);
    const onUp = (e) => e.pointerType === "touch" && onLeave();
    window.addEventListener("pointerup", onUp);
    return () => {
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("pointermove", onMove);
      document.documentElement.removeEventListener("pointerleave", onLeave);
    };
  }, []);

  const goTo = (id) => {
    track(EVENTS.heroEnter, { via: "brain", chapter: id });
    const el = document.getElementById(id);
    if (!el) return;
    if (lenisRef.current) lenisRef.current.scrollTo(el, { duration: 1.6 });
    else el.scrollIntoView();
  };
  const hover = (i) => {
    userHover.current = i;
  };

  return (
    <div ref={groundRef} className="relative text-ink transition-[background-color] duration-[900ms] ease-out" style={{ backgroundColor: ORANGE }}>
      <canvas ref={canvasRef} aria-hidden="true" className="pointer-events-none fixed inset-0 z-0 h-svh w-full transition-opacity duration-300" />

      {/* The map: each region of the brain, labelled, and a way into it. */}
      {mode === "live" && current === "map" && (
        <>
          {/* Leader lines: each a thin stroke of its region's colour, grown out of the brain. */}
          <div aria-hidden="true" className="pointer-events-none fixed left-0 top-0 z-20">
            {regions.map((r, i) => (
              <span key={r.id}>
                <span ref={(el) => (lineRefs.current[i] = el)} className="absolute left-0 top-0 block h-[1.5px] origin-[0_50%]" style={{ background: r.color, visibility: "hidden" }} />
                <span ref={(el) => (tailRefs.current[i] = el)} className="absolute left-0 top-0 block h-[1.5px]" style={{ background: r.color, visibility: "hidden" }} />
              </span>
            ))}
          </div>
          <nav aria-label="Regions of Ray's mind" className="pointer-events-none fixed inset-0 z-20">
            {regions.map((r, i) => (
              <button
                key={r.id}
                ref={(el) => (labelRefs.current[i] = el)}
                type="button"
                onClick={() => goTo(r.id)}
                onPointerEnter={() => hover(i)}
                onPointerLeave={() => hover(-1)}
                onFocus={() => hover(i)}
                onBlur={() => hover(-1)}
                className="mind-label absolute left-0 top-0 flex min-h-11 items-center gap-2.5 px-1 font-serif text-[17px] text-ink opacity-0 md:text-[22px]"
              >
                <span className="size-2.5 rounded-full" style={{ background: r.color }} />
                {r.name}
              </button>
            ))}
          </nav>
        </>
      )}

      <div className="relative z-10">{children}</div>
      <div ref={cursorRef} aria-hidden="true" className="mind-cursor" />
    </div>
  );
}
