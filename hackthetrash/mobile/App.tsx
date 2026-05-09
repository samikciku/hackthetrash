import "react-native-gesture-handler";
import React, { useEffect, useRef, useState } from "react";
import { AppState } from "react-native";
import { StatusBar } from "expo-status-bar";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import HomeScreen from "./src/screens/HomeScreen";
import ReportScreen from "./src/screens/ReportScreen";
import MapScreen from "./src/screens/MapScreen";
import SuccessScreen from "./src/screens/SuccessScreen";
import SettingsScreen from "./src/screens/SettingsScreen";
import { initI18n, t } from "./src/lib/i18n";
import { flushQueue } from "./src/lib/queue";
import {
  registerForPushNotificationsAsync,
  registerDevice,
  addResponseListener
} from "./src/lib/notifications";

export type RootStackParamList = {
  Home: undefined;
  Report: undefined;
  Map: { lat?: number; lng?: number; id?: string } | undefined;
  Success: { lat: number; lng: number; id?: string; queued?: boolean };
  Settings: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function App() {
  const [ready, setReady] = useState(false);
  const navRef = useRef<any>(null);

  useEffect(() => {
    (async () => {
      await initI18n();

      // Register push token (best effort)
      const token = await registerForPushNotificationsAsync();
      if (token) registerDevice(token).catch(() => {});

      // Try to flush any reports that were queued offline
      flushQueue().catch(() => {});

      setReady(true);
    })();

    // Handle taps on push notifications: navigate to the report on the map
    const sub = addResponseListener((data: any) => {
      if (data?.lat && data?.lng) {
        navRef.current?.navigate("Map", { lat: data.lat, lng: data.lng, id: data.id });
      }
    });

    // Flush queue every time the app comes back to foreground
    const onAppState = (state: string) => {
      if (state === "active") flushQueue().catch(() => {});
    };
    const stateSub = AppState.addEventListener("change", onAppState);

    return () => {
      sub?.remove?.();
      stateSub.remove();
    };
  }, []);

  if (!ready) return null;

  return (
    <NavigationContainer ref={navRef}>
      <StatusBar style="dark" />
      <Stack.Navigator
        screenOptions={{
          headerStyle: { backgroundColor: "#16A34A" },
          headerTintColor: "#fff",
          headerTitleStyle: { fontWeight: "700" }
        }}
      >
        <Stack.Screen name="Home" component={HomeScreen} options={{ title: t("app.name") }} />
        <Stack.Screen name="Report" component={ReportScreen} options={{ title: t("report.title") }} />
        <Stack.Screen name="Map" component={MapScreen} options={{ title: t("nav.map") }} />
        <Stack.Screen name="Success" component={SuccessScreen} options={{ title: t("success.title") }} />
        <Stack.Screen name="Settings" component={SettingsScreen} options={{ title: t("nav.signIn") }} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
