// A pull quote in Ray's own words, with an optional plain attribution.
export default function Quote({ quote, attribution, className = "", tone = "ink" }) {
  const muted = tone === "ground" ? "text-ground/75" : "text-muted";
  return (
    <figure className={className}>
      <blockquote className="text-[22px] leading-[1.45] md:text-[28px] md:leading-[1.35]">
        <p>&ldquo;{quote.text}&rdquo;</p>
      </blockquote>
      {attribution && <figcaption className={`mt-4 text-[14px] ${muted}`}>{attribution}</figcaption>}
    </figure>
  );
}
