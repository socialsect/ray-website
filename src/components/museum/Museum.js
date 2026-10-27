"use client";

import { useEffect, useRef, useState } from "react";
import { optSrc, optSrcSet } from "@/lib/content/images";

// The walk through the Mind Museum. Scrolling moves the visitor forward;
// each room's wall lettering is pinned to the wall of the photograph frame
// by frame, so it is part of the room rather than laid over it.

function Exhibit({ room, last }) {
  return (
    <>
      {/* Long titles take a smaller cut so every room's lettering fits its wall. */}
      <h2
        className="font-display font-extrabold uppercase leading-[0.92] tracking-[-0.01em]"
        style={{ fontSize: room.title.length > 34 ? "0.072em" : room.title.length > 22 ? "0.092em" : "0.118em" }}
      >
        {room.title}
      </h2>
      {room.body && <p className="mt-[0.5em] text-[max(0.04em,14px)] leading-[1.45]">{room.body}</p>}
      {room.links && (
        <p className="mt-[0.7em] flex flex-wrap gap-x-[0.9em] text-[0.036em] font-semibold">
          {room.links.map((l) => (
            <a key={l.href} href={l.href} target="_blank" rel="noopener noreferrer" className="pointer-events-auto underline decoration-[0.06em] underline-offset-[0.2em]">
              {l.label}
              <svg viewBox="0 0 14 14" aria-hidden="true" className="ml-[0.25em] inline size-[0.7em]">
                <path d="M4 2h8v8M12 2 2 12" fill="none" stroke="currentColor" strokeWidth="2" />
              </svg>
            </a>
          ))}
        </p>
      )}
      {last && <p className="mt-[0.7em] text-[0.032em] opacity-80">The niche below is empty on purpose.</p>}
    </>
  );
}

export default function Museum({ rooms, photo }) {
  const wrapRef = useRef(null);
  const canvasRef = useRef(null);
  const boxRefs = useRef([]);
  const stageRef = useRef(null);
  const [mode, setMode] = useState("pending");
  const [room, setRoom] = useState(0);

  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let disposed = false;
    if (reduced) {
      queueMicrotask(() => setMode("static"));
      return;
    }
    import("./museumStage").then(({ createMuseumStage, supportsWebGL }) => {
      if (disposed || !canvasRef.current) return;
      if (!supportsWebGL()) {
        setMode("static");
        return;
      }
      let shownRoom = -1;
      stageRef.current = createMuseumStage(canvasRef.current, {
        src: photo.src,
        rooms: rooms.length,
        onFrame: ({ level, u, camera, layout: L }) => {
          if (level !== shownRoom) {
            shownRoom = level;
            setRoom(level);
          }
          // Narrow screens get a narrower panel of wall lettering so it fits.
          const bw = Math.min(L.wall.w, 0.84 * L.W);
          const bx = L.niche.cx - bw / 2;
          boxRefs.current.forEach((el, i) => {
            if (!el) return;
            if (i !== level) {
              el.style.visibility = "hidden";
              return;
            }
            const fadeIn = level === 0 ? 1 : Math.min(1, u / 0.06);
            const fadeOut = 1 - Math.min(1, Math.max(0, (u - 0.42) / 0.18));
            const s = 1 / camera.scale;
            const x = (bx - camera.center[0]) * s + L.W / 2;
            const y = (L.wall.y - camera.center[1]) * s + L.H / 2;
            el.style.visibility = "visible";
            el.style.opacity = String(fadeIn * fadeOut);
            el.style.width = `${bw}px`;
            el.style.fontSize = `${bw}px`;
            el.style.transform = `translate3d(${x}px, ${y}px, 0) scale(${s})`;
          });
        },
      });
      setMode("walk");
    });
    return () => {
      disposed = true;
      stageRef.current?.dispose();
      stageRef.current = null;
    };
  }, [photo.src, rooms.length]);

  // Scroll position -> how far into the museum the visitor has walked.
  useEffect(() => {
    if (mode !== "walk") return;
    const maxWalk = rooms.length - 1 + 0.38;
    const onScroll = () => {
      const el = wrapRef.current;
      if (!el) return;
      const r = el.getBoundingClientRect();
      const span = r.height - window.innerHeight;
      const p = Math.min(Math.max(-r.top / Math.max(span, 1), 0), 1);
      stageRef.current?.setWalk(p * maxWalk);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, [mode, rooms.length]);

  const goTo = (i) => {
    const el = wrapRef.current;
    if (!el) return;
    const maxWalk = rooms.length - 1 + 0.38;
    const span = el.offsetHeight - window.innerHeight;
    const target = el.offsetTop + (Math.min(i + 0.02, maxWalk) / maxWalk) * span;
    window.scrollTo({ top: target, behavior: "smooth" });
  };

  if (mode === "static") {
    return (
      <section aria-labelledby="museum-static-title" className="bg-ground">
        {/* eslint-disable-next-line @next/next/no-img-element -- pre-built static WebP */}
        <img src={optSrc(photo.src, 1600)} srcSet={optSrcSet(photo.src)} sizes="100vw" alt={photo.alt} className="h-[70svh] w-full object-cover" />
        <h2 id="museum-static-title" className="sr-only">The rooms</h2>
        <ol className="mx-auto max-w-[900px] px-4 py-16 md:px-8">
          {rooms.map((r, i) => (
            <li key={r.id} className="py-10">
              <p className="text-[14px] text-muted">Room {i + 1}</p>
              <div className="text-[min(640px,90vw)]">
                <Exhibit room={r} last={i === rooms.length - 1} />
              </div>
            </li>
          ))}
        </ol>
      </section>
    );
  }

  return (
    <section ref={wrapRef} id="museum-walk" aria-label="The Mind Museum" className="relative" style={{ height: `${(rooms.length - 1 + 0.38) * 115 + 100}vh` }}>
      <div className="sticky top-0 h-svh w-full overflow-hidden bg-ground">
        <canvas ref={canvasRef} aria-hidden="true" className="absolute inset-0 h-full w-full" />
        {/* Wall lettering, printed onto the white walls. */}
        <div aria-hidden={mode === "walk" ? undefined : true} className="pointer-events-none absolute inset-0">
          {rooms.map((r, i) => (
            <div
              key={r.id}
              ref={(el) => (boxRefs.current[i] = el)}
              className="wall-text absolute left-0 top-0 origin-top-left text-center"
              style={{ visibility: "hidden" }}
            >
              <Exhibit room={r} last={i === rooms.length - 1} />
            </div>
          ))}
        </div>
        {/* Where you are, and a way to any room. */}
        <nav aria-label="Rooms" className="absolute inset-x-0 bottom-4 flex justify-center md:bottom-6">
          <ol className="flex items-center gap-1.5 bg-paper/90 px-3 py-2 text-ink">
            {rooms.map((r, i) => (
              <li key={r.id}>
                <button
                  type="button"
                  onClick={() => goTo(i)}
                  aria-label={`Room ${i + 1}: ${r.name}`}
                  aria-current={room === i ? "step" : undefined}
                  className="grid size-7 place-items-center text-[13px] font-semibold tabular-nums text-ground/70 transition-colors duration-200 hover:text-ground aria-[current=step]:bg-ground aria-[current=step]:text-paper"
                >
                  {i + 1}
                </button>
              </li>
            ))}
            <li className="ml-2 hidden pr-1 text-[13px] text-ground sm:block" aria-live="polite">
              {rooms[room]?.name}
            </li>
          </ol>
        </nav>
        {room === 0 && mode === "walk" && (
          <p className="pointer-events-none absolute inset-x-0 bottom-20 text-center text-[14px] font-semibold text-ground/80 md:bottom-24">
            Scroll to walk in
          </p>
        )}
      </div>
    </section>
  );
}
