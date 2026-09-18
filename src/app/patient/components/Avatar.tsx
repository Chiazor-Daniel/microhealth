import { avatarFor, type AvatarKey, type AvatarVariant } from "../lib/avatars";

import man1 from "../../../assets/avatars/man-1.jpg";
import man2 from "../../../assets/avatars/man-2.jpg";
import man3 from "../../../assets/avatars/man-3.jpg";
import man4 from "../../../assets/avatars/man-4.jpg";
import woman1 from "../../../assets/avatars/woman-1.jpg";
import woman2 from "../../../assets/avatars/woman-2.jpg";
import woman3 from "../../../assets/avatars/woman-3.jpg";
import woman4 from "../../../assets/avatars/woman-4.jpg";

/** Vite turns each import into a URL. The keys must match AVATAR_KEYS. */
const SRC: Record<AvatarKey, string> = {
  "man-1": man1,
  "man-2": man2,
  "man-3": man3,
  "man-4": man4,
  "woman-1": woman1,
  "woman-2": woman2,
  "woman-3": woman3,
  "woman-4": woman4,
};

interface AvatarProps {
  /** Something stable about the person — an id, an email, a full name. */
  seed?: string | null;
  /** Only when the person's gender is actually known. See `avatarFor`. */
  variant?: AvatarVariant;
  /** Full name, used for the initials fallback and the alt text. */
  name?: string;
  size?: number;
  className?: string;
}

function initialsOf(name?: string) {
  return (name ?? "")
    .split(/\s+/)
    .filter(Boolean)
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

/**
 * A person's portrait.
 *
 * Falls back to their initials on a tinted disc rather than showing a stranger's
 * face — an unknown record getting someone else's photo is worse than no photo.
 * Carries the same raised treatment the initials disc had, so the two states sit
 * the same way in a row.
 */
export function Avatar({ seed, variant, name, size = 46, className = "" }: AvatarProps) {
  const key = avatarFor(seed ?? name, variant);
  const initials = initialsOf(name);

  if (!key) {
    return (
      <span
        className={`mh-avatar mh-avatar-raised flex items-center justify-center flex-shrink-0 ${className}`}
        style={{ width: size, height: size, fontSize: size * 0.33, color: "var(--mh-brand-deep)" }}
        aria-hidden="true"
      >
        {initials || "?"}
      </span>
    );
  }

  return (
    <span
      className={`mh-avatar-raised flex-shrink-0 overflow-hidden ${className}`}
      /* `display: block` is load-bearing: a span is inline by default, and an
         inline box ignores width/height — the image then stretches to whatever
         its parent is and overflows. It sized correctly inside a flex row,
         which is what made this look fine on Home and wrong on Profile. */
      style={{ display: "block", width: size, height: size, borderRadius: 999 }}
    >
      <img
        src={SRC[key]}
        alt={name ? `${name}'s photo` : ""}
        width={size}
        height={size}
        style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
        loading="lazy"
      />
    </span>
  );
}
