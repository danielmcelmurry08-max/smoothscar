import * as Device from "expo-device";
import * as Notifications from "expo-notifications";
import { Platform } from "react-native";

import { storage } from "./utils/storage";

const BASE = `${process.env.EXPO_PUBLIC_BACKEND_URL}/api`;

export const pushSupported = Platform.OS !== "web";

export type PushPermission = "granted" | "undetermined" | "denied" | "blocked" | "unsupported";

export async function getPushUserId(): Promise<string> {
  const existing = await storage.getItem("pushUserId", null as string | null);
  if (existing) return existing;
  const id = `dev_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 12)}`;
  await storage.setItem("pushUserId", id);
  return id;
}

export async function getPushPermission(): Promise<PushPermission> {
  if (!pushSupported) return "unsupported";
  const { status, canAskAgain } = await Notifications.getPermissionsAsync();
  if (status === "granted") return "granted";
  if (status === "denied") return canAskAgain ? "denied" : "blocked";
  return "undetermined";
}

/** Registers this device's native token with the backend. Returns the push user id, or null if not possible. */
export async function registerForPush(askPermission: boolean): Promise<string | null> {
  if (!pushSupported || !Device.isDevice) return null;
  let { status } = await Notifications.getPermissionsAsync();
  if (status !== "granted" && askPermission) {
    status = (await Notifications.requestPermissionsAsync()).status;
  }
  if (status !== "granted") return null;
  const userId = await getPushUserId();
  try {
    const token = await Notifications.getDevicePushTokenAsync();
    const res = await fetch(`${BASE}/register-push`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user_id: userId, platform: Platform.OS, device_token: String(token.data) }),
    });
    if (!res.ok) return null;
  } catch (e) {
    console.warn("[push] registration failed", e);
    return null;
  }
  return userId;
}
