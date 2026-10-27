// Chapter titles in station-signage capitals. Long draft lines get a smaller
// phone size rather than a rewrite, so every title holds to two lines.
export default function Heading({ id, children, className = "" }) {
  const long = String(children).length > 36;
  const size = long ? "text-[clamp(30px,5.4vw,84px)]" : "text-[clamp(38px,5.4vw,84px)]";
  return (
    <h2
      id={id}
      data-chapter-title
      className={`font-display font-bold uppercase leading-[0.9] tracking-[-0.015em] ${size} ${className}`}
    >
      {children}
    </h2>
  );
}
