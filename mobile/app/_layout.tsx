import { useEffect, useState } from "react";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { useFonts, Inter_400Regular, Inter_500Medium, Inter_600SemiBold, Inter_700Bold } from "@expo-google-fonts/inter";
import { semantic } from "@tokens";
import { AuthProvider } from "@app/hooks/useAuth";
import { PatientDataProvider } from "@app/hooks/usePatientData";
import { hydratePlatform } from "@/lib/platform";
import { ConnectivityProvider } from "@/lib/connectivity";
import { Splash } from "@/ui/Splash";

/**
 * Root layout.
 *
 * Fonts are loaded at runtime with `useFonts` rather than through the
 * `expo-font` config plugin. The plugin is more efficient, but it embeds fonts
 * at build time — which means it needs a development build, and would stop the
 * app from running in Expo Go. Runtime loading keeps the QR-code workflow.
 */
export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
  });
  const [storageReady, setStorageReady] = useState(false);

  useEffect(() => {
    hydratePlatform().finally(() => setStorageReady(true));
  }, []);

  /* Hold the first paint until Inter is in place and the stored token has been
     read, so nothing reflows from a fallback face or flashes a signed-out
     state into a signed-in one. The splash is what covers that wait. */
  if (!fontsLoaded || !storageReady) {
    return <Splash />;
  }

  return (
    <SafeAreaProvider>
      <StatusBar style="dark" />
      <AuthProvider>
        <PatientDataProvider>
          <ConnectivityProvider>
            <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: semantic.pageBackground } }} />
          </ConnectivityProvider>
        </PatientDataProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}
