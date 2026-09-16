# React Native / Expo — theme layer

The design system lives in [`src/tokens`](../tokens). Those files are plain
TypeScript: no CSS, no DOM, no framework imports, sizes as unitless numbers.
This folder adapts them to React Native.

**Rule: never redefine a value here.** If something should look different,
change the token — that's what keeps web and native from drifting.

```tsx
import { theme, text, shadow, linearGradient, tint } from "../rn/theme";
import { LinearGradient } from "expo-linear-gradient";

<View style={theme.card}>
  <Text style={text.sectionTitle}>Today's Vitals</Text>
</View>

// Green hero: RN has no gradient primitive, so compose one
<LinearGradient {...linearGradient("greenCard")} style={theme.heroCard}>
  <Text style={text.onGreen}>Your health looks stable</Text>
</LinearGradient>

// Metric icon with its category tint
<View style={[theme.icon, theme.iconMedium, tint("heartRate")]}>
  <HeartIcon />
</View>
```

## What maps 1:1

| Token group | Notes |
|---|---|
| `colors` | Plain hex/rgba strings — identical on both platforms. |
| `semantic` | Same role names (`textPrimary`, `cardSurface`, `accent`…). |
| `typography.scale` | Sizes/weights/lineHeights are logical pixels. |
| `spacing`, `radii` | Numbers; use directly in styles. |
| `gradients` (stops) | Feed `colors` + `locations` + `start`/`end` to `expo-linear-gradient`. |
| `metricTint()` | Same function, same output. |

## What does _not_ map 1:1

| Web feature | Native approach |
|---|---|
| `box-shadow` | iOS takes `shadowColor/Offset/Opacity/Radius`; Android takes a single `elevation`. `shadow()` returns the right one per platform — the two are approximations of each other, not identical. |
| Multi-layer shadows | Native supports one shadow per view. `shadow()` uses the top layer; the ambient layer is dropped. |
| Inset highlights (`inset 0 1px 0`) | Not supported. Approximate with an absolutely-positioned overlay `View` at the top edge, or `borderTopColor` a shade lighter. |
| `linear-gradient()` in CSS | No gradient primitive. Use `expo-linear-gradient` with `linearGradient(name)`. |
| `backdrop-filter` (scrim blur, glass) | Use `expo-blur` `<BlurView>`. Android support is weaker — prefer an opaque scrim there. |
| CSS transitions | Use `Animated` / `react-native-reanimated`. Durations and easing are in `motion`. |
| Chart styling (`recharts`) | Recharts is web-only. `victory-native` or `react-native-svg` charts are needed; reuse the same colours (`colors.green600` line, `colors.hairlineSoft` grid) and the same dot/band treatment. |
| `:hover`, `:focus-visible`, `:active` CSS states | Use `Pressable` with a pressed style. The pressed recipe is: darken ~4%, drop elevation one step, scale 0.985. |

## Wire-up checklist for a new Expo app

1. `npx create-expo-app` and copy `src/tokens` and `src/rn` in.
2. Load Inter with `expo-font` (`@expo-google-fonts/inter`) — `typography.fontFamilyRN` is the name to register, and RN needs a separate registered face per weight in some setups.
3. `yarn add expo-linear-gradient expo-blur react-native-safe-area-context`.
4. Wrap the root in `SafeAreaProvider`. The floating nav needs `useSafeAreaInsets().bottom` — web gets this from `env(safe-area-inset-bottom)`, which has no native equivalent.
5. Set the status bar style per screen; the app is light-only (no dark mode variant exists).
6. Screens should start from `theme.screenPadding` and end with `theme.contentBottom` so the floating nav never covers content — the same 104px clearance the web shell uses.

## Not carried over

There is no dark mode in the design system, and no dark token set to port.
`src/rn/theme.ts` is light-only by design.
