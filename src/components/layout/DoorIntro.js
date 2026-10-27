"use client";

import { useEffect, useRef } from "react";
import { optSrc } from "@/lib/content/images";

// The opening: two leaves of real travertine, cut from the Salk courtyard
// photograph at the natural joint in its stone block, swing open on 3D
// hinges and the camera passes through into the courtyard itself.
// Plays on arrival; absent without script or with reduced motion.

const SOURCE = "/assets/stage/salk-courtyard.jpg";
// The block's front face in the photograph, as fractions of the image.
const FACE = { x: 0.2112, y: 0.765, w: 0.585, h: 0.19 };

function paintLeaf(canvas, img, side) {
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  canvas.width = Math.round((vw / 2) * dpr);
  canvas.height = Math.round(vh * dpr);
  const g = canvas.getContext("2d");
  const sx = FACE.x * img.naturalWidth;
  const sy = FACE.y * img.naturalHeight;
  const sw = FACE.w * img.naturalWidth;
  const sh = FACE.h * img.naturalHeight;
  // Cover-fit the stone face across both leaves together, centred on the joint.
  const scale = Math.max(vw / sw, vh / sh);
  const visibleW = vw / scale;
  const visibleH = vh / scale;
  const cx = sx + sw / 2;
  const cy = sy + sh / 2;
  const half = visibleW / 2;
  const srcX = side === "left" ? cx - half : cx;
  g.drawImage(img, srcX, cy - visibleH / 2, half, visibleH, 0, 0, canvas.width, canvas.height);
  // Soft occlusion where the leaves meet, so the seam reads as depth.
  const edge = side === "left" ? canvas.width : 0;
  const shade = g.createLinearGradient(edge, 0, side === "left" ? edge - canvas.width * 0.12 : canvas.width * 0.12, 0);
  shade.addColorStop(0, "rgba(40,30,20,0.35)");
  shade.addColorStop(1, "rgba(40,30,20,0)");
  g.fillStyle = shade;
  g.fillRect(0, 0, canvas.width, canvas.height);
}

export default function DoorIntro({ title }) {
  const rootRef = useRef(null);
  const leftRef = useRef(null);
  const rightRef = useRef(null);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) {
      root.dataset.state = "done";
      return;
    }
    root.dataset.state = "playing";

    let tl;
    let cancelled = false;
    const small = new Image();
    small.src = optSrc(SOURCE, 960);
    const img = new Image();
    img.decoding = "async";
    img.src = optSrc(SOURCE, window.innerWidth > 900 ? 2400 : 1600);
    const paintWith = (source) => {
      if (!source.complete || !source.naturalWidth || !leftRef.current) return;
      paintLeaf(leftRef.current, source, "left");
      paintLeaf(rightRef.current, source, "right");
      root.dataset.stone = "ready";
    };
    const paint = () => paintWith(img.complete && img.naturalWidth ? img : small);
    small.onload = () => !(img.complete && img.naturalWidth) && paintWith(small);
    img.onload = paint;
    window.addEventListener("resize", paint);

    const finish = () => {
      root.dataset.state = "done";
    };
    // Any intent to move on opens the doors at once.
    const hurry = () => tl && tl.timeScale(3.5);
    window.addEventListener("wheel", hurry, { passive: true });
    window.addEventListener("touchstart", hurry, { passive: true });
    window.addEventListener("keydown", hurry);
    root.addEventListener("click", hurry);

    const ready = new Promise((resolve) => {
      if (img.complete && img.naturalWidth) resolve();
      img.addEventListener("load", resolve, { once: true });
      img.addEventListener("error", resolve, { once: true });
      small.addEventListener("load", () => setTimeout(resolve, 250), { once: true });
      setTimeout(resolve, 700);
    });
    Promise.all([import("gsap"), ready]).then(([{ gsap }]) => {
      if (cancelled) return;
      paint();
      tl = gsap.timeline({ onComplete: finish });
      root.__timeline = tl;
      tl.fromTo("[data-door-light]", { scaleY: 0, opacity: 0 }, { scaleY: 1, opacity: 1, duration: 0.7, ease: "power2.out" }, 0.2)
        .fromTo("[data-door-title]", { opacity: 0, y: 24 }, { opacity: 1, y: 0, duration: 0.9, ease: "power3.out" }, 0.15)
        .call(() => window.dispatchEvent(new Event("rm:doors-open")), null, 1.05)
        .to(leftRef.current.parentElement, { rotateY: -96, duration: 2.0, ease: "power2.inOut" }, 1.05)
        .to(rightRef.current.parentElement, { rotateY: 96, duration: 2.0, ease: "power2.inOut" }, 1.05)
        .to("[data-door-shade]", { opacity: 0.55, duration: 1.8, ease: "power2.in" }, 1.1)
        .to("[data-door-stage]", { scale: 1.28, duration: 2.3, ease: "power2.in" }, 1.0)
        .to("[data-door-light]", { scaleX: 6, opacity: 0, duration: 0.7, ease: "power2.out" }, 1.05)
        .to(root, { opacity: 0, duration: 0.55, ease: "power1.out" }, 2.75);
    });

    return () => {
      cancelled = true;
      tl?.kill();
      window.removeEventListener("resize", paint);
      window.removeEventListener("wheel", hurry);
      window.removeEventListener("touchstart", hurry);
      window.removeEventListener("keydown", hurry);
    };
  }, []);

  const skip = () => {
    const root = rootRef.current;
    if (!root) return;
    root.__timeline?.kill();
    window.dispatchEvent(new Event("rm:doors-open"));
    root.dataset.state = "done";
  };

  const carved = (
    <span
      data-door-title
      className="door-carving absolute inset-y-0 flex w-[200%] items-center justify-center font-display text-[clamp(72px,13.5vw,232px)] font-extrabold uppercase leading-none tracking-[-0.01em]"
    >
      {title}
    </span>
  );

  return (
    <div ref={rootRef} className="door-intro fixed inset-0 z-[60]" role="presentation">
      <div data-door-stage className="door-stage absolute inset-0">
        <div data-door-light className="door-light absolute inset-y-0 left-1/2 w-[3px] -translate-x-1/2 bg-[#fff4e2]" />
        <div className="door-leaf door-leaf-left absolute inset-y-0 left-0 w-1/2 overflow-hidden">
          <canvas ref={leftRef} className="absolute inset-0 h-full w-full" />
          <span aria-hidden="true" className="contents [&>span]:left-0">{carved}</span>
          <div data-door-shade className="absolute inset-0 bg-ink opacity-0" />
        </div>
        <div className="door-leaf door-leaf-right absolute inset-y-0 right-0 w-1/2 overflow-hidden">
          <canvas ref={rightRef} className="absolute inset-0 h-full w-full" />
          <span aria-hidden="true" className="contents [&>span]:right-0">{carved}</span>
          <div data-door-shade className="absolute inset-0 bg-ink opacity-0" />
        </div>
      </div>
      <button
        type="button"
        onClick={skip}
        className="absolute bottom-6 right-6 z-10 min-h-11 bg-paper px-5 text-[14px] font-semibold text-ground transition-transform duration-200 hover:-translate-y-0.5 md:bottom-8 md:right-8"
      >
        Skip the opening
      </button>
    </div>
  );
}
