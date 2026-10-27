"use client";

import { useId, useState } from "react";

// "Explore <chapter>": opens the chapter's fuller story in place.
export default function Explore({ name, children }) {
  const [open, setOpen] = useState(false);
  const id = useId();
  return (
    <div className="mt-10">
      <button type="button" aria-expanded={open} aria-controls={id} onClick={() => setOpen((o) => !o)} className="mind-button group gap-3">
        {open ? `Close ${name}` : `Explore ${name}`}
        <svg viewBox="0 0 16 16" aria-hidden="true" className={`size-4 transition-transform duration-300 ${open ? "rotate-90" : "group-hover:translate-x-1"}`}>
          <path d="M2 8h11M9 4l4 4-4 4" fill="none" stroke="currentColor" strokeWidth="1.6" />
        </svg>
      </button>
      <div id={id} hidden={!open} className="mt-4 max-w-[540px] bg-[#f2f1ee] px-6 py-6 text-[17px] leading-[1.65]">
        {children}
      </div>
    </div>
  );
}
