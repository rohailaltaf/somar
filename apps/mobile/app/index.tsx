import { Redirect, type Href } from "expo-router";

/**
 * Root index redirects to tabs.
 * AuthGuard in _layout.tsx handles auth redirects.
 */
export default function Index() {
  return <Redirect href={"/(tabs)" as Href} />;
}
