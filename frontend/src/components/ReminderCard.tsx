import * as Linking from "expo-linking";
import { BellRinging, CheckCircle, GearSix } from "phosphor-react-native";
import { useEffect, useState } from "react";
import { ActivityIndicator, AppState, Pressable, Text, View } from "react-native";

import { enableReminders } from "../api";
import { fonts, radius, space } from "../fonts";
import { getPushPermission, PushPermission, pushSupported, registerForPush } from "../push";
import { makeStyles, useTheme } from "../theme";
import { storage } from "../utils/storage";

type Props = { orderId: string; enabled: boolean; onEnabled: () => void };

export function ReminderCard({ orderId, enabled, onEnabled }: Props) {
  const styles = useStyles();
  const { colors } = useTheme();
  const [perm, setPerm] = useState<PushPermission>("undetermined");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const check = () => getPushPermission().then(setPerm);
    check();
    const sub = AppState.addEventListener("change", (s) => s === "active" && check());
    return () => sub.remove();
  }, []);

  if (!pushSupported) {
    return (
      <View style={styles.card} testID="reminder-card-web">
        <BellRinging size={22} color={colors.brandPrimary} weight="duotone" />
        <Text style={styles.body}>Open BioRNA on your phone to get nightly patch reminders and reorder alerts.</Text>
      </View>
    );
  }

  if (enabled) {
    return (
      <View style={styles.card} testID="reminder-card-enabled">
        <CheckCircle size={22} color={colors.success} weight="fill" />
        <Text style={styles.body}>Reminders on — we&apos;ll nudge you at 9:30pm nightly and before you run low.</Text>
      </View>
    );
  }

  const enable = async () => {
    setError("");
    setBusy(true);
    try {
      const uid = await registerForPush(true);
      const next = await getPushPermission();
      setPerm(next);
      if (!uid) {
        if (next === "granted") setError("Couldn't connect this device for reminders. Please try again.");
        return;
      }
      await enableReminders(orderId, uid);
      await storage.setItem("pushOptedIn", true);
      onEnabled();
    } catch {
      setError("Couldn't turn on reminders. Please try again.");
    } finally {
      setBusy(false);
    }
  };

  const blocked = perm === "blocked";
  return (
    <View style={styles.wrap} testID="reminder-card">
      <View style={styles.row}>
        <View style={styles.icon}>
          <BellRinging size={22} color={colors.onBrandPrimary} weight="bold" />
        </View>
        <View style={styles.flex}>
          <Text style={styles.title}>Never miss a nightly patch</Text>
          <Text style={styles.sub}>
            {blocked
              ? "Notifications are turned off for BioRNA. Turn them on in Settings to get your reminders."
              : perm === "denied"
                ? "Consistency matters for results. Allow notifications so we can remind you each night at 9:30pm."
                : "Get your order confirmation, a 9:30pm bedtime reminder and a heads-up before your patches run out."}
          </Text>
        </View>
      </View>
      {error ? <Text style={styles.error}>{error}</Text> : null}
      {blocked ? (
        <Pressable testID="reminder-open-settings-button" onPress={() => Linking.openSettings()} style={({ pressed }) => [styles.btn, pressed && styles.pressed]}>
          <GearSix size={16} color={colors.onBrandPrimary} weight="bold" />
          <Text style={styles.btnText}>Open Settings</Text>
        </Pressable>
      ) : (
        <Pressable testID="reminder-enable-button" onPress={enable} disabled={busy} style={({ pressed }) => [styles.btn, (pressed || busy) && styles.pressed]}>
          {busy ? <ActivityIndicator color={colors.onBrandPrimary} /> : <Text style={styles.btnText}>Turn on reminders</Text>}
        </Pressable>
      )}
    </View>
  );
}

const useStyles = makeStyles((c) => ({
  wrap: { width: "100%", backgroundColor: c.brandTertiary, borderRadius: radius.lg, padding: space.lg + 2, marginTop: space.xl },
  card: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    gap: space.md,
    backgroundColor: c.surface,
    borderRadius: radius.lg,
    padding: space.lg,
    borderWidth: 1,
    borderColor: c.border,
    marginTop: space.xl,
  },
  row: { flexDirection: "row", gap: space.md, alignItems: "flex-start" },
  icon: { width: 44, height: 44, borderRadius: radius.md, backgroundColor: c.brandPrimary, alignItems: "center", justifyContent: "center" },
  flex: { flex: 1 },
  title: { fontFamily: fonts.bold, fontSize: 16, color: c.onSurface },
  sub: { fontFamily: fonts.regular, fontSize: 14, lineHeight: 20, color: c.onSurfaceTertiary, marginTop: 2 },
  body: { flex: 1, fontFamily: fonts.medium, fontSize: 14, lineHeight: 20, color: c.onSurface },
  error: { fontFamily: fonts.medium, fontSize: 13, color: c.error, marginTop: space.sm },
  btn: {
    height: 48,
    borderRadius: radius.pill,
    backgroundColor: c.brandPrimary,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: space.sm,
    marginTop: space.lg,
  },
  pressed: { opacity: 0.85 },
  btnText: { fontFamily: fonts.bold, fontSize: 15, color: c.onBrandPrimary },
}));
