"use client";

import { useId, useState } from "react";

// "Explore <chapter>": opens the chapter's fuller story in place.
export default function Explore({ name, color, children }) {
  const [open, setOpen] = useState(false);
  const id = useId();
  return (
    <div data-in className="mt-10">
      <button
        type="button"
        aria-expanded={open}
        aria-controls={id}
        onClick={() => setOpen((o) => !o)}
        className="group inline-flex min-h-12 items-center gap-3 rounded-full border border-ink/35 px-6 text-[15px] text-ink transition-colors duration-300 hover:border-ink hover:bg-ink/10"
      >
        {open ? `Close ${name}` : `Explore ${name}`}
        <svg viewBox="0 0 16 16" aria-hidden="true" className={`size-4 transition-transform duration-300 ${open ? "rotate-90" : "group-hover:translate-x-1"}`}>
          <path d="M2 8h11M9 4l4 4-4 4" fill="none" stroke="currentColor" strokeWidth="1.4" />
        </svg>
      </button>
      <div
        id={id}
        hidden={!open}
        className="mind-explore mt-6 max-w-[520px] border-l pl-6 text-[16px] leading-[1.65] text-ink/85"
        style={{ borderColor: color }}
      >
        {children}
      </div>
    </div>
  );
}
