"use client";

import Heading from "@/components/ui/Heading";
import { useState } from "react";
import { EVENTS, track } from "@/lib/analytics/track";

// The public inbox published on Ray's own page (gosocialsect.com/about).
const CONTACT_EMAIL = "sales@gosocialsect.com";

const field =
  "mt-2 block w-full bg-ground px-4 py-3.5 text-[17px] text-ink border-2 border-ink/30 outline-none transition-colors duration-200 placeholder:text-muted focus:border-building aria-invalid:border-discipline";

function validate(data) {
  const errors = {};
  if (!data.name.trim()) errors.name = "Add your name so Ray knows who's writing.";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email.trim())) errors.email = "That email doesn't look complete. Check for the @ and the domain.";
  if (!data.category) errors.category = "Pick what this is about.";
  if (data.message.trim().length < 20) errors.message = "Say a little more: at least 20 characters.";
  return errors;
}

// The contact form validates in full. Delivery is not wired yet (no inbox
// is verified), and the form says so plainly instead of pretending to send.
export default function Connect({ copy, categories, links = [] }) {
  const [data, setData] = useState({ name: "", email: "", category: "", message: "" });
  const [errors, setErrors] = useState({});
  const [state, setState] = useState("idle");

  const set = (k) => (e) => setData((d) => ({ ...d, [k]: e.target.value }));

  function onSubmit(e) {
    e.preventDefault();
    const found = validate(data);
    setErrors(found);
    if (Object.keys(found).length) {
      setState("idle");
      document.getElementById(`contact-${Object.keys(found)[0]}`)?.focus();
      return;
    }
    track(EVENTS.contactSubmit, { category: data.category });
    const subject = `${data.category}: message from ${data.name.trim()}`;
    const body = `${data.message.trim()}

${data.name.trim()}
${data.email.trim()}`;
    window.location.href = `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    setState("not-connected");
  }

  return (
    <section id="connect" data-section="connect" aria-labelledby="connect-title" className="relative py-28 md:py-40">
      <div className="mx-auto grid max-w-[1440px] gap-12 px-4 md:px-8 lg:grid-cols-12 lg:gap-8">
        <div className="lg:contents">
          <Heading id="connect-title" className="lg:col-span-9">{copy.contactHeadline.text}</Heading>
          <p data-reveal style={{ "--i": 1 }} className="mt-8 max-w-[40ch] text-[19px] leading-[1.55] md:text-[22px] lg:col-span-5 lg:row-start-2 lg:mt-0">
            {copy.contactBody.text}
          </p>
          <ul className="mt-8 grid gap-2 lg:col-span-5 lg:row-start-3">
            {links.map((l) => (
              <li key={l.href}>
                <a
                  href={l.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex min-h-14 items-center justify-between gap-4 bg-raised/95 px-5 font-display text-[22px] font-bold uppercase transition-colors duration-200 hover:bg-paper hover:text-ground"
                >
                  {l.label}
                  <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden="true"><path d="M4 2h8v8M12 2 2 12" fill="none" stroke="currentColor" strokeWidth="2" /></svg>
                </a>
              </li>
            ))}
          </ul>
        </div>

        <form
          noValidate
          onSubmit={onSubmit}
          data-reveal
          style={{ "--i": 2 }}
          className="bg-raised/95 px-6 py-8 md:px-10 md:py-10 lg:col-span-6 lg:col-start-7 lg:row-start-2"
        >
          <div className="grid gap-6 sm:grid-cols-2">
            <label className="block text-[14px]">
              Your name
              <input
                id="contact-name"
                name="name"
                autoComplete="name"
                value={data.name}
                onChange={set("name")}
                aria-invalid={errors.name ? true : undefined}
                aria-describedby={errors.name ? "err-name" : undefined}
                className={field}
              />
              {errors.name && <span id="err-name" className="mt-2 block text-[14px] text-discipline">{errors.name}</span>}
            </label>
            <label className="block text-[14px]">
              Email
              <input
                id="contact-email"
                name="email"
                type="email"
                autoComplete="email"
                value={data.email}
                onChange={set("email")}
                aria-invalid={errors.email ? true : undefined}
                aria-describedby={errors.email ? "err-email" : undefined}
                className={field}
              />
              {errors.email && <span id="err-email" className="mt-2 block text-[14px] text-discipline">{errors.email}</span>}
            </label>
          </div>

          <fieldset className="mt-7" aria-describedby={errors.category ? "err-category" : undefined}>
            <legend className="text-[14px]">What&apos;s it about?</legend>
            <div className="mt-3 flex flex-wrap gap-2">
              {categories.map((c, i) => (
                <label key={c} className="relative">
                  <input
                    id={i === 0 ? "contact-category" : undefined}
                    type="radio"
                    name="category"
                    value={c}
                    checked={data.category === c}
                    onChange={set("category")}
                    className="peer absolute inset-0 cursor-pointer opacity-0"
                  />
                  <span className="pointer-events-none inline-flex min-h-11 items-center px-4 text-[14px] border-2 border-ink/30 transition-colors duration-200 peer-checked:border-paper peer-checked:bg-paper peer-checked:text-ground peer-hover:border-ink/70 peer-focus-visible:outline-3 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-building">
                    {c}
                  </span>
                </label>
              ))}
            </div>
            {errors.category && <p id="err-category" className="mt-2 text-[14px] text-discipline">{errors.category}</p>}
          </fieldset>

          <label className="mt-7 block text-[14px]">
            Message
            <textarea
              id="contact-message"
              name="message"
              rows={5}
              value={data.message}
              onChange={set("message")}
              aria-invalid={errors.message ? true : undefined}
              aria-describedby={errors.message ? "err-message" : undefined}
              className={`${field} resize-y`}
            />
            {errors.message && <span id="err-message" className="mt-2 block text-[14px] text-discipline">{errors.message}</span>}
          </label>

          <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-3">
            <button
              type="submit"
              className="inline-flex min-h-14 items-center bg-paper px-8 text-[17px] font-semibold text-ground transition-transform duration-200 hover:-translate-y-0.5 active:translate-y-0"
            >
              Send message
            </button>
            <p className="text-[14px] text-muted">Opens your email app, addressed and ready to send.</p>
          </div>

          <p role="status" aria-live="polite" className="mt-6 text-[17px] leading-[1.55]">
            {state === "not-connected" &&
              "Your email app is opening with your message. Send it from there."}
          </p>
        </form>
      </div>
    </section>
  );
}
