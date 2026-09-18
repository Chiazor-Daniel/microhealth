import { Redirect } from "expo-router";

/** The app opens on Home; the shell decides whether you're allowed to see it. */
export default function Index() {
  return <Redirect href="/home" />;
}
