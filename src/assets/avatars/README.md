# Portrait avatars

Bundled portraits used wherever the app shows a person — the patient, doctors,
family members. Source: [Unsplash](https://unsplash.com), whose
[licence](https://unsplash.com/license) permits commercial and non-commercial
use with no permission or attribution required.

They are downloaded into the repo rather than hotlinked from the CDN on
purpose:

- the app works offline and on a flaky connection, which matters for something
  a patient may open anywhere;
- a patient's device never makes a request to a third-party image host just to
  draw its own header;
- the exact crop is pinned, so a portrait can't silently change under us.

## What the set has to be

Every file is a 240×240 face-centred crop — enough for a 56px avatar at 3×
density. They appear as small circles (40–56px, plus one at 84px on Profile),
so a face has to survive being shrunk to 48px: anything that turns to mud there
is not usable, however good it looks full size.

The set is chosen to read as **one collection with a single treatment**, because
a row of mismatched portraits is what makes an interface look cheap. A portrait
is only in if it passes all of:

- **plain backdrop** — a neutral grey or white studio seamless, no colour cast
  and nothing behind the subject. No offices, streets, foliage or props;
- **even, soft lighting** — frontal and diffuse, with no visible shadow
  direction and no falloff. No low-key, moody or side-lit shots;
- **head-and-shoulders framing**, at a consistent head size and headroom.
  The source crops were re-cropped by hand to normalise this, since the CDN's
  own face crop frames each source differently;
- **looking at the camera** — a profile or off-camera gaze reads as aloof and
  breaks the row. `woman-4` is the one exception: a three-quarter view looking
  off-frame. It was kept because it is otherwise the strongest of the women's
  portraits and no replacement was found that met the rest of the criteria —
  the alternatives were black-and-white, fashion-posed, or on a coloured
  backdrop. It is the weakest file in the set and the first to swap if a better
  neutral-backdrop studio frame turns up.
- **plain, presentable clothing** — a shirt, blouse or knit. No hats,
  sunglasses or heavy jewellery;
- **Black subjects**, since the product is for Nigerian patients.

A consistent colour temperature and contrast across the set matters as much as
the framing. A single mild desaturation is applied to all eight to even out the
skin and fabric rendering; nothing else is graded.

## What was rejected, and why

Candidates were downloaded in bulk, tiled into contact sheets and judged by
eye, first at ~240px and then at 48px. Roughly 350 candidates were looked at.

- **Profile and off-camera gazes** — a large share of Unsplash's Black portrait
  work is fashion-editorial, shot three-quarter or in profile. These read as
  cold and, at avatar size, as a featureless smudge of cheek. Rejected on
  sight, not on description.
- **Dramatic and low-key lighting** — moody single-source portraits. The face
  loses all its modelling once it is 48px wide.
- **Coloured or busy backdrops** — mustards, teals, brick, offices, streets,
  foliage, coloured geometric flats. Even a mild teal cast was enough to drop
  an otherwise good portrait, because it made the circle disagree with its
  neighbours.
- **Headwear and heavy accessories** — headwraps, turbans, hats, sunglasses,
  large hoop earrings. Wrong on a clinician, and they change the silhouette.
- **The whole search-result long tail** — Unsplash's tagging is loose, so
  "black doctor" and "african portrait" searches return mostly non-Black or
  non-portrait subjects. Those were discarded after looking.
- **Same person twice** — several promising shoots turned out to be one model
  photographed repeatedly (a four-frame series of the same woman, two frames of
  the same man in a suit). They are internally consistent but give the app only
  one face, so at most one frame from such a series is used.

The men's four are one photographer's single studio shoot, which is why they
match so closely. No equivalent shoot of Black women on a neutral seamless
exists in Unsplash's free library — every women's series found was either
coloured-backdrop, editorial, or one model repeated. The four women are
therefore matched individually against the same criteria and normalised to the
men's framing, rather than drawn from one shoot.

`src/app/patient/lib/avatars.ts` picks which one a given person gets, by
hashing something stable about them. It is deliberately framework-free so the
two platforms cannot show a different face for the same person; only the asset
reference differs (a URL on web, a module id on native).

These are stand-ins. Swap them for real staff and patient photography before
this goes near production.
