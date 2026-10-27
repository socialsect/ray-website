import { optSrc, optSrcSet } from "@/lib/content/images";

// A credited picture of the world around the story. The caption says what it
// is and who made it, so it is never read as Ray's own photograph.
export default function WorldImage({ image, sizes, className = "", imgClassName = "", priority = false, captionClassName = "" }) {
  return (
    <figure className={className}>
      {/* eslint-disable-next-line @next/next/no-img-element -- pre-built static WebP */}
      <img
        src={optSrc(image.src, 1600)}
        srcSet={optSrcSet(image.src)}
        sizes={sizes}
        width={image.width}
        height={image.height}
        alt={image.alt}
        loading={priority ? "eager" : "lazy"}
        decoding="async"
        className={`h-full w-full object-cover ${imgClassName}`}
      />
      <figcaption className={`mt-3 text-[14px] leading-snug ${captionClassName}`}>{image.caption}</figcaption>
    </figure>
  );
}
