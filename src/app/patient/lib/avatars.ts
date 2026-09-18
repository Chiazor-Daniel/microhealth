/**
 * Which portrait a person gets.
 *
 * Framework-free on purpose: the web build and the native build must show the
 * *same* face for the same person, and the only thing that legitimately differs
 * between them is how an image asset is referenced (a URL on web, a module id
 * on native). That mapping lives in each platform's Avatar component; this file
 * decides *which* one.
 */

export const AVATAR_KEYS = [
  "man-1",
  "man-2",
  "man-3",
  "man-4",
  "woman-1",
  "woman-2",
  "woman-3",
  "woman-4",
] as const;

export type AvatarKey = (typeof AVATAR_KEYS)[number];

/** Lets a caller narrow the pool when the person's gender is actually known. */
export type AvatarVariant = "man" | "woman";

/**
 * djb2. Any stable string hash would do — the requirement is only that the
 * same name always lands on the same face, on every platform and every run.
 */
function hash(input: string): number {
  let h = 5381;
  for (let i = 0; i < input.length; i++) {
    h = ((h << 5) + h + input.charCodeAt(i)) >>> 0;
  }
  return h;
}

/**
 * The portrait for a person.
 *
 * `seed` should be something stable about them — a user id, an email, a full
 * name. Two people with the same name collide, which is acceptable for
 * placeholder art; pass an id where one is available.
 *
 * Pass `variant` only when the person's gender is genuinely known — a family
 * member recorded as a daughter, say. Guessing it from a name would be wrong
 * often enough to be worse than the alternative, and the mixed pool is fine
 * everywhere the app has no such signal.
 *
 * An empty seed returns null so the caller falls back to initials rather than
 * assigning a stranger's face to an unknown record.
 */
export function avatarFor(seed?: string | null, variant?: AvatarVariant): AvatarKey | null {
  const key = (seed ?? "").trim();
  if (!key) return null;

  const pool = variant ? AVATAR_KEYS.filter((k) => k.startsWith(variant)) : AVATAR_KEYS;
  return pool[hash(key) % pool.length];
}

/**
 * The gender a family record states, if it states one.
 *
 * The relation is the only signal the data carries — there is no gender field —
 * so this reads what the patient themselves typed.
 */
export function variantForRelation(relation?: string | null): AvatarVariant | undefined {
  const r = (relation ?? "").toLowerCase();
  if (/daughter|sister|mother|mum|mom|wife|aunt|niece|grandmother|grandma/.test(r)) return "woman";
  if (/son|brother|father|dad|husband|uncle|nephew|grandfather|grandpa/.test(r)) return "man";
  return undefined;
}

