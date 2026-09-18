# MicroHealth Design System — Rebuild Handoff

This project is mid-rebuild. A previous agent (Claude Code) decoded a mockup,
started executing a 9-task plan, and was interrupted by an API outage partway
through Task 1. **You have no memory of this work — rebuild context from this
file, `git status`/`git diff`, and the code.**

## Reference mockup (source of truth)

- Full mockup: `/home/buzz/Downloads/e6daa69c-f3ad-43c1-9e62-52e393c67a0e.png`
- Screen crops decoded earlier by the previous agent: `/tmp/mh-mock/*.png`
  (may still exist; regenerate with ImageMagick `-crop` if needed)
- Open/view the mockup before writing UI code (attach the PNG or use `<file>`).

## Design spec (decoded from the mockup)

The current app is warm sage-green / Work Sans / glassy. The mockup is a
**crisp cool-slate + vibrant-green / Inter** system:

- Background: light cool-slate (`#F8FAFC`-family), white flat cards
- Text: primary `#0F172A`, secondary `#64748B`, borders `#E2E8F0`-family
- Accent: vibrant green (gradient green hero + green CTAs/score circle)
- Cards: flat white, 16px radius, soft subtle shadow (not glassy)
- Typography: switch from Work Sans to **Inter**
- Screens (5 tabs): Home, Vitals, AI, Care, Profile + corner notification card

## Task plan (from previous agent) — status

1. Rebuild design tokens in `src/app/patient/theme.ts` + `patient.css`, and
   fonts in `src/styles/fonts.css` — **IN PROGRESS / partially done**
2. Rebuild shell + bottom navigation (`src/app/patient/PatientShell.tsx`)
   — recolor desktop backdrop slate/green; rebuild BottomNavigation to mockup
3. Rebuild shared components (white cards, VitalCard w/ icon circle + big
   number + delta badge, SectionHeader, etc.)
4. Rebuild Home page (greeting + bell, green gradient health-status hero with
   View Report, Today's Vitals 2x2 grid, AI Insights)
5. Rebuild Vitals page (title + add icon, Day/Week/Month tabs, hero vital card
   w/ sparkline + range pill + delta)
6. Rebuild AI page (green hero greeting card, suggestion chips, chat bubbles,
   input bar)
7. Rebuild Care page (All/Upcoming/Past/Cancelled tabs, appointment cards w/
   doctor avatar + status)
8. Rebuild Profile page (avatar + name + Patient ID, info list, connections)
9. **Verify**: `pnpm build`, screenshot all 5 screens mobile+desktop, compare
   against mockup crops, iterate — only done when screens match the mockup

## Current WIP (uncommitted) — review first

- `src/app/patient/PatientShell.tsx`
- `src/app/patient/patient.css`
- `src/app/patient/theme.ts`
- `src/app/patient/fonts.css` (via `src/styles/fonts.css` -> Inter)

Start with `git status` + `git diff`, then continue from Task 1/2 where the
previous agent stopped.