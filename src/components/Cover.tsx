import TrekArt from "./TrekArt";

/** Shows cover_image_url when present, otherwise the pastel TrekArt. Fills its parent. */
export default function Cover({
  src,
  seed,
  alt,
  snow,
  className = "",
}: {
  src: string | null | undefined;
  seed: string;
  alt: string;
  snow?: boolean;
  className?: string;
}) {
  if (src) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={src} alt={alt} className={`h-full w-full object-cover ${className}`} loading="lazy" />;
  }
  return <TrekArt seed={seed} snow={snow} className={`h-full w-full ${className}`} />;
}
