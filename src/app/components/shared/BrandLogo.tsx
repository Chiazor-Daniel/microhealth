import horizontal from "../../../assets/brand/logo-horizontal.png";
import stacked from "../../../assets/brand/logo-stacked.png";
import mark from "../../../assets/brand/mark.png";

/**
 * The MicroHealth logo.
 *
 * The real artwork, not a redrawing. It is a two-colour mark — a teal cross
 * with a leaf sweeping through it — and neither of those colours survives a
 * dark ground: the teal cross disappears into a teal panel, and the white gap
 * between cross and leaf is transparent, not white.
 *
 * So on a dark surface, use `onDark`. It seats the mark on a white tile rather
 * than letting it sink. That is the standard treatment for a two-colour logo
 * and it keeps the artwork's own colours intact, which is the whole point of
 * having the artwork.
 *
 * Files live in `src/assets/brand/` beside the avatars and are shared with the
 * native build, which reaches them through the same `@assets` alias — see
 * `mobile/src/ui/BrandLogo.tsx` for the other half of that.
 */

export function BrandLogo({
  variant = "horizontal",
  height = 34,
  onDark = false,
  alt = "MicroHealth",
}: {
  /** Which lockup. `mark` is the icon alone, for a square or tight space. */
  variant?: "horizontal" | "stacked" | "mark";
  /** Rendered height in px. The width follows the lockup's own aspect. */
  height?: number;
  /** Seats the mark on a white tile, for use over a dark surface. */
  onDark?: boolean;
  alt?: string;
}) {
  const src = variant === "mark" ? mark : variant === "stacked" ? stacked : horizontal;

  if (variant === "mark") {
    const inner = <img src={src} alt={alt} style={{ height, width: "auto", display: "block" }} />;
    if (!onDark) return inner;
    return (
      <span
        className="inline-flex items-center justify-center flex-shrink-0"
        style={{ background: "#FFFFFF", borderRadius: height * 0.28, padding: height * 0.22 }}
      >
        {inner}
      </span>
    );
  }

  return <img src={src} alt={alt} style={{ height, width: "auto", display: "block" }} />;
}
