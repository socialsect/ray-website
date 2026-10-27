"use client";

import { useEffect, useRef, useState } from "react";
import { EVENTS, track } from "@/lib/analytics/track";

// The Human Mind. Two layers stay fixed behind the page: the anatomical
// brain (hero and map) and a photographic stage (the chapter worlds). The
// scroll position decides which one is seen and where the camera stands.

const smooth = (a, b, v) => {
  const t = Math.min(Math.max((v - a) / (b - a), 0), 1);
  return t * t * (3 - 2 * t);
};

export default function Mind({ regions, frames, children }) {
  const brainCanvas = useRef(null);
  const stageCanvas = useRef(null);
  const brainRef = useRef(null);
  const stageRef = useRef(null);
  const labelRefs = useRef([]);
  const lineRefs = useRef([]);
  const [mode, setMode] = useState("pending");
  const [ready, setReady] = useState(false);
  const [layer, setLayer] = useState("brain");
  const [current, setCurrent] = useState("hero");
  const mapRef = useRef(0);
  const updateRef = useRef(() => {});

  // The brain, then the stage once the opening has had the GPU to itself.
  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const lite = window.matchMedia("(max-width: 767px), (pointer: coarse)").matches;
    let disposed = false;
    let stageTimer = 0;
    import("./brainScene").then(({ createBrainScene, supportsWebGL }) => {
      if (disposed || !brainCanvas.current) return;
      if (!supportsWebGL()) {
        setMode("fallback");
        return;
      }
      try {
        brainRef.current = createBrainScene(brainCanvas.current, { regions, lite, reducedMotion: reduced, onReady: () => {
          setReady(true);
          updateRef.current();
        } });
        setMode("live");
        document.documentElement.classList.add("mind-live");
      } catch (e) {
        console.warn("Brain scene unavailable", e);
        setMode("fallback");
        return;
      }
      stageTimer = window.setTimeout(() => {
        import("@/components/scenes/photoStage").then(({ createPhotoStage }) => {
          if (disposed || !stageCanvas.current) return;
          try {
            const stage = createPhotoStage(stageCanvas.current, { frames, lite, reducedMotion: reduced, dark: true });
            stage.setIntro(1);
            stageRef.current = stage;
          } catch (e) {
            console.warn("Photo stage unavailable", e);
          }
        });
      }, reduced ? 0 : 2500);
    });
    return () => {
      disposed = true;
      window.clearTimeout(stageTimer);
      document.documentElement.classList.remove("mind-live");
      brainRef.current?.dispose();
      stageRef.current?.dispose();
      brainRef.current = stageRef.current = null;
    };
  }, [regions, frames]);

  // Labels and their leader lines follow the brain every frame, outside React.
  useEffect(() => {
    if (mode !== "live") return;
    let raf = 0;
    let lastY = -1;
    let frame = 0;
    const tick = () => {
      raf = requestAnimationFrame(tick);
      // The page state follows the true scroll position every frame it moves,
      // so no jump or missed event can leave a stale layer on screen.
      if (window.scrollY !== lastY || ++frame % 30 === 0) {
        lastY = window.scrollY;
        updateRef.current();
      }
      const brain = brainRef.current;
      if (!brain) return;
      const W = window.innerWidth;
      const H = window.innerHeight;
      const pts = brain.screen;
      const cx = pts.reduce((a, s) => a + s.x, 0) / pts.length;
      const cy = pts.reduce((a, s) => a + s.y, 0) / pts.length;
      const reach = Math.min(W, H) * (W < 768 ? 0.2 : 0.24);
      const show = mapRef.current;
      pts.forEach((s, i) => {
        const label = labelRefs.current[i];
        const line = lineRefs.current[i];
        if (!label || !line) return;
        const dx = s.x - cx;
        const dy = s.y - cy;
        const len = Math.hypot(dx, dy) || 1;
        const right = dx >= 0;
        const arm = W < 768 ? 12 : 28;
        const tail = right ? arm : -arm;
        // Keep the whole label on screen: leader end + tail + label width.
        const room = (label.offsetWidth || 120) + arm + 18;
        const ex = right
          ? Math.min(Math.max(s.x + (dx / len) * reach, 24), W - room)
          : Math.max(Math.min(s.x + (dx / len) * reach, W - 24), room);
        const ey = Math.min(Math.max(s.y + (dy / len) * reach * 0.8, 110), H - 70);
        const visible = show > 0.15 && s.facing > -0.1;
        const o = visible ? show : 0;
        line.setAttribute("d", `M${s.x},${s.y} L${ex},${ey} L${ex + tail},${ey}`);
        line.style.opacity = String(o * 0.8);
        label.style.opacity = String(o);
        label.style.pointerEvents = o > 0.5 ? "auto" : "none";
        label.style.transform = `translate3d(${right ? ex + tail + 6 : ex + tail - 6}px, ${ey}px, 0) translate(${right ? "0" : "-100%"}, -50%)`;
      });
    };
    tick();
    return () => cancelAnimationFrame(raf);
  }, [mode]);

  // Scroll decides the layer, the camera and the stage.
  useEffect(() => {
    let ctx;
    let cancelled = false;
    let removeScroll = () => {};
    Promise.all([import("gsap"), import("gsap/ScrollTrigger")]).then(([{ gsap }, { ScrollTrigger }]) => {
      if (cancelled) return;
      gsap.registerPlugin(ScrollTrigger);
      gsap.ticker.lagSmoothing(0);
      const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      const ids = ["hero", "map", ...regions.map((r) => r.id), "close"];
      const sections = ids.map((id) => document.querySelector(`[data-mind="${id}"]`));
      const seen = new Set();
      let lastId = "";
      const proxy = { journey: 0 };
      let update = () => {};
      ctx = gsap.context(() => {
        ScrollTrigger.create({
          trigger: document.body,
          start: "top top",
          end: "bottom bottom",
          onUpdate: () => update(),
        });
        update = () => {
            const wide = window.innerWidth >= 1024;
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
            const id = ids[index];
            if (id !== lastId) {
              lastId = id;
              setCurrent(id);
              const ch = regions.findIndex((r) => r.id === id);
              if (ch >= 0 && !seen.has(id)) {
                seen.add(id);
                track(EVENTS.chapterView, { chapter: id });
              }
            }
            const brain = brainRef.current;
            // Brain views: the hero on the right; the map centred and closer.
            // The camera sits on the brain's right (+x): front left, cerebellum low right.
            const heroView = { yaw: Math.PI / 2 - 0.32, pitch: 0.14, dist: wide ? 2.75 : 7.4, x: wide ? 0.21 : 0, y: wide ? -0.01 : -0.2 };
            const mapView = { yaw: Math.PI / 2 - 0.12, pitch: 0.18, dist: wide ? 4.6 : 9.2, x: wide ? 0.04 : 0, y: wide ? -0.02 : -0.08 };
            if (id === "hero") {
              const t = smooth(0.45, 1, p);
              brain?.setView({
                yaw: heroView.yaw + (mapView.yaw - heroView.yaw) * t,
                pitch: heroView.pitch + (mapView.pitch - heroView.pitch) * t,
                dist: heroView.dist + (mapView.dist - heroView.dist) * t,
                x: heroView.x + (mapView.x - heroView.x) * t,
                y: heroView.y + (mapView.y - heroView.y) * t,
              });
              mapRef.current = t * 0.4;
            } else if (id === "map") {
              brain?.setView(mapView);
              brain?.skipIntro?.();
              mapRef.current = 1 - smooth(0.7, 1, p);
            } else {
              mapRef.current = 0;
            }
            brain?.setMap(mapRef.current);
            // Layers: the brain until the map is left, then the worlds.
            const onStage = index >= 2 || (id === "map" && p > 0.82);
            setLayer(onStage ? "stage" : "brain");
            brain?.setPaused(onStage && index >= 3);
            const stage = stageRef.current;
            if (stage) {
              const chapter = Math.max(0, index - 2);
              const travel = index >= 2 ? smooth(0.62, 1, p) : 0;
              const target = Math.min(chapter + travel, frames.length - 1);
              stage.setSide(wide && id !== "close" ? 1 : 0);
              stage.setChapter(frames[chapter]?.id, Math.min(p * 1.4, 1));
              if (reduced) {
                proxy.journey = Math.round(target);
                stage.setJourney(proxy.journey);
              } else {
                gsap.to(proxy, { journey: target, duration: 0.9, ease: "power2.out", overwrite: "auto", onUpdate: () => stage.setJourney(proxy.journey) });
              }
            }
        };
        // Frame the scene for wherever the page is now, and again once the brain exists.
        update();
        updateRef.current = update;
        // Belt and braces: a plain scroll listener too, so a jump never leaves a stale frame.
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
        // Chapter words arrive in order, once.
        gsap.utils.toArray("[data-mind-chapter]").forEach((el) => {
          gsap.from(el.querySelectorAll("[data-in]"), {
            y: 30,
            opacity: 0,
            duration: reduced ? 0 : 1,
            ease: "power3.out",
            stagger: 0.09,
            scrollTrigger: { trigger: el, start: "top 70%", once: true },
          });
        });
      });
    });
    return () => {
      cancelled = true;
      removeScroll();
      ctx?.revert();
    };
  }, [regions, frames]);

  // Pointer parallax.
  useEffect(() => {
    const onMove = (e) => {
      const x = (e.clientX / window.innerWidth) * 2 - 1;
      const y = -((e.clientY / window.innerHeight) * 2 - 1);
      brainRef.current?.setPointer(x, y);
      stageRef.current?.setPointer(x, y);
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    return () => window.removeEventListener("pointermove", onMove);
  }, []);

  const goTo = (id) => {
    track(EVENTS.heroEnter, { via: "brain", chapter: id });
    document.getElementById(id)?.scrollIntoView({ behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" });
  };
  const hover = (i) => brainRef.current?.setHover(i);
  const chapterIndex = regions.findIndex((r) => r.id === current);

  return (
    <div className="theme-mind relative bg-ground text-ink">
      <div aria-hidden="true" className="fixed inset-0 z-0">
        <canvas
          ref={stageCanvas}
          className={`absolute inset-0 h-full w-full transition-opacity duration-[1200ms] ${layer === "stage" ? "opacity-100" : "opacity-0"}`}
        />
        <canvas
          ref={brainCanvas}
          className={`absolute inset-0 h-full w-full transition-opacity duration-[1200ms] ${ready && layer === "brain" ? "opacity-100" : "opacity-0"}`}
        />
        {mode === "fallback" && <div className="mind-fallback absolute inset-0" />}
        <div className={`mind-scrim absolute inset-y-0 left-0 w-full transition-opacity duration-700 lg:w-[64%] ${layer === "stage" ? "opacity-100" : "opacity-60"}`} />
      </div>

      {/* The map: each region of the brain, labelled, and a way into it. */}
      {mode === "live" && (
        <>
          <svg aria-hidden="true" className="pointer-events-none fixed inset-0 z-20 h-full w-full">
            {regions.map((r, i) => (
              <g key={r.id}>
                <path ref={(el) => (lineRefs.current[i] = el)} fill="none" stroke={r.color} strokeWidth="1" style={{ opacity: 0 }} />
              </g>
            ))}
          </svg>
          <nav aria-label="Regions of Ray's mind" className={`pointer-events-none fixed inset-0 z-20 ${current === "map" || current === "hero" ? "" : "invisible"}`}>
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
                className="mind-label absolute left-0 top-0 flex items-center gap-2 px-1 py-1 font-serif text-[16px] opacity-0 md:text-[19px]"
                style={{ color: r.color }}
              >
                <span className="size-1.5 rounded-full" style={{ background: r.color, boxShadow: `0 0 10px ${r.color}` }} />
                {r.name}
              </button>
            ))}
          </nav>
        </>
      )}

      {/* Where you are: the chapter number on a quiet rail. */}
      <div aria-hidden="true" className="pointer-events-none fixed right-5 top-1/2 z-30 hidden -translate-y-1/2 flex-col items-center gap-3 md:flex lg:right-10">
        <span className="font-serif text-[15px] text-ink/80">{String(Math.max(chapterIndex, 0) + 1).padStart(2, "0")}</span>
        <span className="relative block h-24 w-px bg-ink/20">
          <span
            className="absolute inset-x-0 top-0 bg-ink transition-[height] duration-700"
            style={{ height: `${((Math.max(chapterIndex, 0) + 1) / regions.length) * 100}%` }}
          />
        </span>
      </div>

      <div className="relative z-10">{children}</div>
    </div>
  );
}
