"use client";

import { useId, useState } from "react";

// "Discover": opens a chapter's fuller story in place, so the world stays the
// picture until the visitor asks for more.
export default function Discover({ name, children }) {
  const [open, setOpen] = useState(false);
  const id = useId();
  return (
    <div className="mt-7">
      <button
        type="button"
        aria-expanded={open}
        aria-controls={id}
        onClick={() => setOpen((o) => !o)}
        className="group inline-flex min-h-11 items-center gap-3 text-[16px] text-gold"
      >
        <span className="rm-link">{open ? `Close ${name}` : "Discover"}</span>
        <svg viewBox="0 0 16 16" aria-hidden="true" className={`size-4 transition-transform duration-300 ${open ? "rotate-90" : "group-hover:translate-x-1"}`}>
          <path d="M2 8h11M9 4l4 4-4 4" fill="none" stroke="currentColor" strokeWidth="1.6" />
        </svg>
      </button>
      <div id={id} hidden={!open} className="rm-panel mt-5 max-w-[640px] bg-ink-deep/88 p-6 md:p-8">
        {children}
      </div>
    </div>
  );
}
