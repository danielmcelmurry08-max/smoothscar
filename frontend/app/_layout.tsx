import { QueryClientProvider } from "@tanstack/react-query";
import { useFonts } from "expo-font";
import * as Linking from "expo-linking";
import * as Notifications from "expo-notifications";
import { Stack, useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect, useState } from "react";
import { LogBox, Platform, StyleSheet } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { KeyboardProvider } from "react-native-keyboard-controller";

import { ErrorBoundary } from "@/src/components/error-boundary";
import { AuthProvider } from "@/src/auth";
import { CartProvider } from "@/src/cart";
import { PushNudge } from "@/src/components/PushNudge";
import { fontAssets } from "@/src/fonts";
import { registerForPush } from "@/src/push";
import { queryClient } from "@/src/query-client";
import { storage } from "@/src/utils/storage";

// Disable logbox errors etc so that users can see the app
// and agent works as expected.
LogBox.ignoreAllLogs(true)

// Foreground display handler — module scope
if (Platform.OS !== "web") {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
    }),
  });
}

// Android channel — module scope, exists before any push arrives
if (Platform.OS === "android") {
  Notifications.setNotificationChannelAsync("default", {
    name: "Default",
    importance: Notifications.AndroidImportance.MAX,
    sound: "default",
  });
}

const WEEK = 7 * 24 * 60 * 60 * 1000;

export default function RootLayout() {
  const [loaded, error] = useFonts(fontAssets);
  const router = useRouter();
  const [showNudge, setShowNudge] = useState(false);

  useEffect(() => {
    if (Platform.OS === "web") return;

    const open = (data: Record<string, unknown>) => {
      const url = (data?.deeplink || data?.action_url) as string | undefined;
      if (!url) return;
      if (url.startsWith("http")) Linking.openURL(url);
      else router.push(url as never);
    };

    // Warm tap
    const tapSub = Notifications.addNotificationResponseReceivedListener((response) => {
      open(response.notification.request.content.data || {});
    });

    // Cold-start tap
    Notifications.getLastNotificationResponseAsync().then((response) => {
      if (response) open(response.notification.request.content.data || {});
    });

    // Re-register on every app open (tokens rotate); never prompts here
    registerForPush(false);

    // Weekly nudge for users who blocked notifications after opting in
    (async () => {
      const optedIn = await storage.getItem("pushOptedIn", false);
      if (!optedIn) return;
      const { status, canAskAgain } = await Notifications.getPermissionsAsync();
      if (status !== "denied" || canAskAgain) return;
      const last = await storage.getItem("pushNudgeAt", 0);
      if (last && Date.now() - Number(last) <= WEEK) return;
      setShowNudge(true);
    })();

    return () => tapSub.remove();
  }, [router]);

  const closeNudge = async (openSettings: boolean) => {
    await storage.setItem("pushNudgeAt", Date.now());
    setShowNudge(false);
    if (openSettings) Linking.openSettings();
  };

  if (!loaded && !error) return null;
  // One app level ErrorBoundary; a render crash shows a reload screen
  // instead of a blank app. GestureHandlerRootView must wrap the whole tree
  // or any gesture/swipe/drawer screen crashes in Expo Go.
  return (
    <GestureHandlerRootView style={styles.root}>
      <ErrorBoundary>
          <QueryClientProvider client={queryClient}>
          <AuthProvider>
          <CartProvider>
          <KeyboardProvider>
            <StatusBar style="dark" />
            <Stack screenOptions={{ headerShown: false }} />
            <PushNudge visible={showNudge} onOpenSettings={() => closeNudge(true)} onLater={() => closeNudge(false)} />
          </KeyboardProvider>
          </CartProvider>
          </AuthProvider>
        </QueryClientProvider>
      </ErrorBoundary>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
});
