import { Redirect, Stack, usePathname } from "expo-router";
import { Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuth } from "@app/hooks/useAuth";
import { useLiveVitals } from "@app/patient/hooks/useLiveVitals";
import { useLiveInsights } from "@app/patient/hooks/useLiveInsights";
import { usePatientData } from "@app/hooks/usePatientData";
import { semantic } from "@tokens";
import { useIsOffline } from "@/lib/connectivity";
import { WifiOffIcon } from "@/icons";
import { BottomNavigation } from "@/ui/BottomNavigation";
import { NavClearanceProvider } from "@/ui/navClearance";

/**
 * Screens that take the whole frame.
 *
 * The Health Agent is a conversation: it ends in a composer that belongs on the
 * bottom edge, and a floating nav sitting on top of that is two things fighting
 * for the same strip of screen. Everywhere else the nav is how you move around
 * the app, so it stays. Kept in step with FULL_FRAME in the web build's
 * PatientShell so the two platforms present the same screen the same way.
 */
const FULL_FRAME = ["/ai"];

/**
 * The signed-in shell.
 *
 * This owns two things the whole app shares:
 *
 *   The navigation stack. It has to be a real `Stack`, not a `Slot`. A Slot
 *   renders whichever route matched and keeps no history, so `router.push`
 *   replaces what is on screen without pushing anything — there is nothing for
 *   the system back gesture to pop, and every screen looks like it was reached
 *   by teleporting. A Stack gives each screen a real entry, so back works the
 *   way the platform expects and the transition animates.
 *
 *   The two live feeds: `useLiveVitals` refreshes patient data when the backend
 *   pushes a reading, `useLiveInsights` when the agent emits an insight. Both
 *   run once here rather than per screen, so the app stays in step.
 *
 * The nav bar sits *outside* the stack, so it stays put while screens push and
 * pop, and publishes its measured height through NavClearanceProvider for the
 * screens to pad against.
 */
export default function MainLayout() {
  const { isAuthenticated, loading } = useAuth();
  const pathname = usePathname();
  const fullFrame = FULL_FRAME.includes(pathname);

  return (
    <NavClearanceProvider>
      <View style={{ flex: 1 }}>
        <AuthedContent authenticated={isAuthenticated} loading={loading} />
        {/* The bar floats over the screen's own scroll view. */}
        {!fullFrame && <BottomNavigation />}
      </View>
    </NavClearanceProvider>
  );
}

function AuthedContent({ authenticated, loading }: { authenticated: boolean; loading: boolean }) {
  const pathname = usePathname();
  const { refresh } = usePatientData();

  useLiveVitals();
  useLiveInsights(refresh);

  /* Nothing to decide until the stored token has been checked. */
  if (loading) return null;

  if (!authenticated) {
    return <Redirect href={{ pathname: "/login", params: { from: pathname } }} />;
  }

  return (
    <View style={{ flex: 1 }}>
      <OfflineRibbon />
      <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: semantic.pageBackground },
        /* No transition on navigation.

           This used to slide in from the right, which meant every tab switch
           and every drill-in spent a beat sliding a screen you had already
           asked for. On a set of tabs a patient flips between twenty times a
           day that reads as the app being slow to respond, not as polish —
           and the web build has no route transition at all, so the two felt
           different in the hand for no reason.

           `none`, not a shorter duration: the point is that the screen is
           simply there when you arrive. */
        animation: "none",
      }}
    />
    </View>
  );
}

/** Thin slate ribbon under the status area while the phone is offline. */
function OfflineRibbon() {
  const insets = useSafeAreaInsets();
  const offline = useIsOffline();
  if (!offline) return null;
  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: 6,
        paddingTop: Math.max(insets.top, 8),
        paddingBottom: 8,
        backgroundColor: "#334155",
      }}
    >
      <WifiOffIcon size={13} color="#E2E8F0" />
      <Text style={{ fontSize: 12, fontWeight: "600", color: "#F1F5F8" }}>You're offline — showing saved data</Text>
    </View>
  );
}
