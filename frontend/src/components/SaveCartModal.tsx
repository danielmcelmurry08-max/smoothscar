import { CheckSquare, Square, X } from "phosphor-react-native";
import { useEffect, useState } from "react";
import { Modal, Platform, Pressable, Text, TextInput, View } from "react-native";

import { fonts, radius, space } from "../fonts";
import { makeStyles, useTheme } from "../theme";
import { storage } from "../utils/storage";
import { Button } from "./Store";

const SEEN_KEY = "smoothscar.saveCartSeenAt";
const WEEK = 7 * 24 * 60 * 60 * 1000;
const IDLE_MS = 45_000;
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

/** Exit-intent (desktop) / idle (touch) prompt to email a link back to the site. Web only, at most once a week. */
export function SaveCartModal() {
  const styles = useStyles();
  const { colors } = useTheme();
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [consent, setConsent] = useState(false);
  const [state, setState] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [error, setError] = useState("");

  useEffect(() => {
    if (Platform.OS !== "web" || typeof window === "undefined") return;
    let armed = false;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const fire = () => {
      if (!armed) return;
      armed = false;
      storage.setItem(SEEN_KEY, Date.now());
      setOpen(true);
      cleanup();
    };
    const onOut = (e: MouseEvent) => {
      if (!e.relatedTarget && e.clientY <= 0) fire();
    };
    const resetIdle = () => {
      clearTimeout(timer);
      timer = setTimeout(fire, IDLE_MS);
    };
    const touch = window.matchMedia?.("(pointer: coarse)").matches;
    const cleanup = () => {
      clearTimeout(timer);
      document.removeEventListener("mouseout", onOut);
      ["touchstart", "scroll"].forEach((ev) => window.removeEventListener(ev, resetIdle, true));
    };
    storage.getItem(SEEN_KEY, 0).then((last) => {
      if (last && Date.now() - Number(last) < WEEK) return;
      armed = true;
      if (touch) {
        ["touchstart", "scroll"].forEach((ev) => window.addEventListener(ev, resetIdle, true));
        resetIdle();
      } else document.addEventListener("mouseout", onOut);
    });
    return cleanup;
  }, []);

  const submit = async () => {
    if (!EMAIL.test(email.trim())) return (setState("error"), setError("Enter a valid email address."));
    if (!consent) return (setState("error"), setError("Please tick the box to agree to receive this email."));
    setState("sending");
    try {
      const body = new URLSearchParams({ "form-name": "save-cart", "bot-field": "", email: email.trim(), page: window.location.pathname, consent: "yes" });
      const res = await fetch("/__forms.html", { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" }, body: body.toString() });
      if (!res.ok) throw new Error(String(res.status));
      setState("sent");
    } catch {
      setState("error");
      setError("We couldn't save that just now. Please try again.");
    }
  };

  return (
    <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
      <View style={styles.scrim}>
        <View style={styles.card} role="dialog" aria-modal aria-label="Save your place" testID="save-cart-modal">
          <Pressable onPress={() => setOpen(false)} style={styles.close} accessibilityLabel="Close">
            <X size={22} color={colors.onSurface} />
          </Pressable>
          {state === "sent" ? (
            <>
              <Text style={styles.h}>You’re all set.</Text>
              <Text style={styles.copy}>We’ll email you a link back to SmoothScar. Your cart stays saved on this device.</Text>
              <Button label="Keep browsing" onPress={() => setOpen(false)} />
            </>
          ) : (
            <>
              <Text role="heading" aria-level={2} style={styles.h}>
                Resting up? We’ll save your place.
              </Text>
              <Text style={styles.copy}>
                We know postpartum life means constant interruptions. Leave your email and we’ll send you a link back to SmoothScar, so you can pick up where you left off.
              </Text>
              <TextInput
                value={email}
                onChangeText={setEmail}
                aria-label="Email address"
                placeholder="you@example.com"
                placeholderTextColor={colors.muted}
                keyboardType="email-address"
                autoCapitalize="none"
                autoComplete="email"
                style={styles.input}
                testID="save-cart-email"
              />
              <Pressable accessibilityRole="checkbox" accessibilityState={{ checked: consent }} onPress={() => setConsent(!consent)} style={styles.consent}>
                {consent ? <CheckSquare size={22} color={colors.accentText} weight="fill" /> : <Square size={22} color={colors.muted} />}
                <Text style={styles.fine}>Email me a link back to the site. I can unsubscribe anytime. See our Privacy Policy.</Text>
              </Pressable>
              {state === "error" ? (
                <Text style={styles.err} role="alert">
                  {error}
                </Text>
              ) : null}
              <Button label={state === "sending" ? "Saving…" : "Save My Place"} onPress={submit} disabled={state === "sending"} testID="save-cart-submit" />
            </>
          )}
        </View>
      </View>
    </Modal>
  );
}

const useStyles = makeStyles((c) => ({
  scrim: { flex: 1, backgroundColor: c.scrim, alignItems: "center", justifyContent: "center", padding: space.xl },
  card: { width: "100%", maxWidth: 440, backgroundColor: c.surface, borderRadius: radius.lg, padding: space.xxl, gap: space.lg, borderWidth: 1, borderColor: c.border, shadowColor: c.brandSecondary, shadowOpacity: 0.2, shadowRadius: 30, shadowOffset: { width: 0, height: 12 } },
  close: { position: "absolute", top: space.sm, right: space.sm, width: 44, height: 44, alignItems: "center", justifyContent: "center", zIndex: 1 },
  h: { fontFamily: fonts.black, fontSize: 26, lineHeight: 32, color: c.onSurface, paddingRight: space.xl },
  copy: { fontFamily: fonts.regular, fontSize: 16, lineHeight: 26, color: c.onSurface },
  input: { minHeight: 52, borderWidth: 1, borderColor: c.borderStrong, borderRadius: radius.md, paddingHorizontal: space.md, fontFamily: fonts.regular, fontSize: 16, color: c.onSurface },
  consent: { flexDirection: "row", gap: space.sm, alignItems: "flex-start" },
  fine: { flex: 1, fontFamily: fonts.regular, fontSize: 13, lineHeight: 20, color: c.muted },
  err: { fontFamily: fonts.medium, fontSize: 14, color: c.error },
}));
