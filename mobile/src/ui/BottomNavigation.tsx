import { useEffect, type ReactNode } from "react";
import { Pressable, Text, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { usePathname, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import Svg, { Defs, RadialGradient, Rect, Stop } from "react-native-svg";
import { colors, semantic } from "@tokens";
import { linearGradient, font } from "@rn/theme";
import { navBar, navHalo } from "./styles";
import { useNavClearance } from "./navClearance";
import { BrandMark } from "./BrandMark";
import {
  HomeFilledIcon,
  HomeOutlineIcon,
  PulseIcon,
  HeartOutlineIcon,
  PersonFilledIcon,
  type GlyphProps,
} from "@/icons";

/**
 * The AI slot carries no icon — its control is drawn as the brand mark above.
 *
 * Home and Profile are solid and Vitals and Care are outlined, which is the
 * register the design system fixes for each destination; only the colour
 * changes with selection.
 */
const NAV: {
  path: string;
  icon: ((p: GlyphProps) => React.ReactElement) | null;
  altIcon?: (p: GlyphProps) => React.ReactElement;
  label: string;
}[] = [
  { path: "/home", icon: HomeFilledIcon, altIcon: HomeOutlineIcon, label: "Home" },
  { path: "/vitals", icon: PulseIcon, label: "Vitals" },
  { path: "/ai", icon: null, label: "AI" },
  { path: "/care", icon: HeartOutlineIcon, label: "Care" },
  { path: "/profile", icon: PersonFilledIcon, label: "Profile" },
];

const AI_PATH = "/ai";

/**
 * How far the AI control rises above the bar, in points.
 *
 * Also the amount of space reserved above the bar for it — the two have to
 * agree, or the control is clipped (Android) or the bar gains a gap (all).
 */
const NAV_RAISE = 30;

/**
 * Floating navigation control.
 *
 * The bar is an elevated surface the content scrolls beneath; the centre AI
 * destination rises out of it as a physical green control — the visual
 * centrepiece — while the other four stay quiet.
 *
 * Selection is carried by colour alone (green icon + green label), so the bar
 * never sprouts a background behind one destination and unbalances.
 */
export function BottomNavigation() {
  const pathname = usePathname();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { report } = useNavClearance();

  const isActive = (path: string) => pathname === path || pathname.startsWith(`${path}/`);
  const aiActive = isActive(AI_PATH);

  /**
   * Move to a destination in the bar.
   *
   * The four destinations are siblings — the bar says so — so moving between
   * them must not build a history. Pushing would make the back gesture walk
   * from one tab to another, which contradicts what the bar just told the
   * patient about where they are, and it is why back appeared to "work" on
   * screens that have no parent to go back to.
   *
   * `replace` swaps the current screen rather than stacking on it. Any pushed
   * detail screens are collapsed first, so arriving at a tab from a detail
   * leaves that tab alone in the stack instead of sitting it on top of the one
   * the patient just left.
   *
   * The agent is the exception: it is a full-frame screen with its own back
   * control rather than a tab you live in, so it pushes and pops normally.
   */
  const goTo = (path: string) => {
    /* Already *at* this destination — nothing to do. Compared exactly rather
       than with `isActive`, because a detail screen under a tab ("/care" while
       on "/care/appointment/x") is not the tab itself: tapping that tab should
       return to its root, not be swallowed. */
    if (pathname === path) return;

    if (path === AI_PATH) {
      router.push(path);
      return;
    }

    if (router.canDismiss()) router.dismissAll();
    router.replace(path);
  };

  return (
    <View
      style={{ position: "absolute", left: 0, right: 0, bottom: 0 }}
      /* The height the content has to clear — see navClearance. */
      onLayout={(e) => report(e.nativeEvent.layout.height)}
    >
      {/* Space for the raised control, *inside* this view rather than above it.
          The control used to be positioned at a negative offset from the bar,
          which drew it outside the bar's bounds: Android clips children at the
          parent's edge, and the bar carries elevation (from `shadow()`), which
          clips regardless — so the top of the button was sliced off. Reserving
          the room keeps every pixel inside a box that is allowed to paint. */}
      <View style={{ height: NAV_RAISE }} pointerEvents="none" />

      <LinearGradient
        {...linearGradient("navBar")}
        style={[navBar, { paddingBottom: Math.max(insets.bottom, 4) + 6 }]}
      >
        {/* ---- The four quiet destinations + the AI slot ---- */}
        <View style={{ flexDirection: "row", alignItems: "flex-end", justifyContent: "space-between", paddingHorizontal: 8, paddingTop: 10, paddingBottom: 6 }}>
          {NAV.map(({ path, icon: Icon, altIcon: AltIcon, label }) => {
            const on = isActive(path);
            const isAI = label === "AI";
            const tint = on ? semantic.accentDeep : semantic.textMuted;
            /* Home swaps to its outlined form only when it is not the current
               destination — the solid house is the resting state. */
            const Glyph = on || !AltIcon ? Icon : AltIcon;

            return (
              <NavDestination
                key={path}
                on={on}
                label={label}
                onPress={() => goTo(path)}
                isAI={isAI}
              >
                {isAI || !Glyph ? null : <Glyph size={22} color={tint} />}
              </NavDestination>
            );
          })}
        </View>
      </LinearGradient>

      {/* ---- Raised AI control: rises out of the bar ----
          A sibling of the bar, not a child of it, and anchored to the top of
          this container so the whole control sits within the reserved space. */}
      <View
        style={{ position: "absolute", top: 0, left: 0, right: 0, alignItems: "center" }}
        pointerEvents="box-none"
      >
        <View style={{ position: "absolute", top: 0, width: navHalo.width, height: navHalo.height }} pointerEvents="none">
          <Svg width={navHalo.width} height={navHalo.height}>
            <Defs>
              <RadialGradient id="mhNavHalo" cx="0.5" cy="0.5" r="0.5">
                <Stop offset={0} stopColor="#86EFAC" stopOpacity={0.42} />
                <Stop offset={0.55} stopColor="#86EFAC" stopOpacity={0.16} />
                <Stop offset={1} stopColor="#86EFAC" stopOpacity={0} />
              </RadialGradient>
            </Defs>
            <Rect x={0} y={0} width={navHalo.width} height={navHalo.height} fill="url(#mhNavHalo)" />
          </Svg>
        </View>
        <BreathingAIButton onPress={() => goTo(AI_PATH)} active={aiActive} />
      </View>
    </View>
  );
}

/**
 * The raised control, breathing gently so the agent reads as present rather
 * than as a button waiting to be found (`.mh-breathe` on web).
 */
function BreathingAIButton({ onPress, active }: { onPress: () => void; active: boolean }) {
  const breath = useSharedValue(0);

  useEffect(() => {
    breath.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 1800, easing: Easing.inOut(Easing.quad) }),
        withTiming(0, { duration: 1800, easing: Easing.inOut(Easing.quad) }),
      ),
      -1,
      false,
    );
  }, [breath]);

  const animated = useAnimatedStyle(() => ({ transform: [{ scale: 1 + breath.value * 0.045 }] }));

  return (
    <Animated.View style={animated}>
      <Pressable onPress={onPress} accessibilityRole="button" accessibilityLabel="AI" accessibilityState={{ selected: active }}>
        <LinearGradient
          {...linearGradient("iconGreen")}
          style={{ width: 54, height: 54, borderRadius: 999, alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: "rgba(255,255,255,0.28)" }}
        >
          <BrandMark size={25} color={colors.onGreen} />
        </LinearGradient>
      </Pressable>
    </Animated.View>
  );
}

/**
 * One destination in the bar.
 *
 * Selection is carried by colour, as the design system specifies — there is no
 * background capsule. To keep a tab change legible without one, the arriving
 * destination springs up a couple of points and its label firms up, so the
 * move registers as movement rather than as a repaint.
 */
function NavDestination({
  on,
  label,
  onPress,
  isAI,
  children,
}: {
  on: boolean;
  label: string;
  onPress: () => void;
  isAI: boolean;
  children: ReactNode;
}) {
  const lift = useSharedValue(on ? 1 : 0);

  useEffect(() => {
    lift.value = withSpring(on ? 1 : 0, { damping: 15, stiffness: 260 });
  }, [on, lift]);

  const iconStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: -2 * lift.value }, { scale: 1 + 0.06 * lift.value }],
  }));

  const tint = on ? semantic.accentDeep : semantic.textMuted;

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ selected: on }}
      style={{ flex: 1, alignItems: "center", justifyContent: "flex-end", paddingTop: 6, paddingBottom: 4 }}
    >
      {isAI ? (
        /* Spacer keeps the grid honest — the control itself floats above, and
           it carries no label: the raised mark is unmistakable, and a word
           under an empty slot reads as a destination you can't reach. */
        <View style={{ height: 30 }} />
      ) : (
        <>
          <Animated.View style={[{ width: 42, height: 30, alignItems: "center", justifyContent: "center" }, iconStyle]}>
            {children}
          </Animated.View>
          <Text style={{ fontSize: 10.5, lineHeight: 16, ...font(on ? 700 : 500), letterSpacing: -0.01 * 10.5, color: tint }}>
            {label}
          </Text>
        </>
      )}
    </Pressable>
  );
}
