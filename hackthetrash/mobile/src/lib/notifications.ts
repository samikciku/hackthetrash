import * as Notifications from "expo-notifications";
import * as Device from "expo-device";
import { Platform } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { API_URL } from "./api";

const TOKEN_KEY = "@htt/expoPushToken";

// Foreground display behavior
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false
  })
});

export async function ensureAndroidChannel() {
  if (Platform.OS !== "android") return;
  await Notifications.setNotificationChannelAsync("cleanups", {
    name: "Cleanup updates",
    importance: Notifications.AndroidImportance.HIGH,
    vibrationPattern: [0, 200, 100, 200],
    lightColor: "#16A34A"
  });
}

export async function registerForPushNotificationsAsync(): Promise<string | null> {
  if (!Device.isDevice) {
    console.log("[push] not a physical device, skipping");
    return null;
  }

  await ensureAndroidChannel();

  const { status: existing } = await Notifications.getPermissionsAsync();
  let finalStatus = existing;
  if (existing !== "granted") {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }
  if (finalStatus !== "granted") {
    console.warn("[push] permission denied");
    return null;
  }

  try {
    const tokenObj = await Notifications.getExpoPushTokenAsync();
    const token = tokenObj.data;
    await AsyncStorage.setItem(TOKEN_KEY, token);
    return token;
  } catch (e) {
    console.warn("[push] could not get token", e);
    return null;
  }
}

export async function getStoredToken(): Promise<string | null> {
  return AsyncStorage.getItem(TOKEN_KEY);
}

/** Tell the backend about this device so it can target push notifications. */
export async function registerDevice(token: string, region?: string) {
  try {
    await fetch(`${API_URL}/api/devices`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, platform: Platform.OS, region })
    });
  } catch (e) {
    console.warn("[push] registerDevice failed", e);
  }
}

/** Subscribe to local notifications when a report you submitted is updated. */
export function addStatusListener(cb: (data: any) => void) {
  return Notifications.addNotificationReceivedListener((n) => {
    cb(n.request.content.data);
  });
}

/** Tap-to-open. */
export function addResponseListener(cb: (data: any) => void) {
  return Notifications.addNotificationResponseReceivedListener((r) => {
    cb(r.notification.request.content.data);
  });
}
