import { useLocalSearchParams, useRouter } from "expo-router";
import { ArrowLeft } from "phosphor-react-native";
import { useState } from "react";
import { ActivityIndicator, Pressable, Text, TextInput, View } from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-controller";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { lookupReviewOrder, OrderPhotos, photoUrl, uploadReviewPhoto } from "@/src/api";
import { PhotoSlot } from "@/src/components/PhotoSlot";
import { fonts, MAX_WIDTH, radius, space } from "@/src/fonts";
import { makeStyles, useTheme } from "@/src/theme";

const SLOTS = [
  { key: "before", label: "Before", kind: "before" as const, week: undefined },
  { key: "w1", label: "Week 1", kind: "progress" as const, week: 1 },
  { key: "w2", label: "Week 2", kind: "progress" as const, week: 2 },
  { key: "w3", label: "Week 3", kind: "progress" as const, week: 3 },
];

export default function Progress() {
  const styles = useStyles();
  const { colors } = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ order?: string; email?: string }>();
  const [order, setOrder] = useState(params.order ?? "");
  const [email, setEmail] = useState(params.email ?? "");
  const [info, setInfo] = useState<OrderPhotos | null>(null);
  const [local, setLocal] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const open = async () => {
    setError("");
    setLoading(true);
    try {
      setInfo(await lookupReviewOrder(order.trim(), email.trim()));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const existing = (s: (typeof SLOTS)[number]) => {
    const p = [...(info?.photos ?? [])].reverse().find((x) => x.kind === s.kind && (s.kind === "before" || x.week === s.week));
    return p && info ? photoUrl(`/api/photos/${p.id}`, { token: info.photo_token }) : null;
  };

  const pick = async (s: (typeof SLOTS)[number], uri: string) => {
    setError("");
    setBusy(s.key);
    try {
      await uploadReviewPhoto(order.trim(), email.trim(), s.kind, uri, s.week);
      setLocal((l) => ({ ...l, [s.key]: uri }));
    } catch (e) {
      setError(e instanceof Error ? e.message : "We couldn't upload your photo.");
    } finally {
      setBusy(null);
    }
  };

  return (
    <View style={styles.root} testID="progress-screen">
      <View style={[styles.header, { paddingTop: insets.top + space.sm }]}>
        <View style={styles.headerInner}>
          <Pressable testID="progress-back-button" onPress={() => (router.canGoBack() ? router.back() : router.replace("/"))} style={styles.iconBtn} hitSlop={8}>
            <ArrowLeft size={22} color={colors.onSurface} weight="bold" />
          </Pressable>
          <Text style={styles.headerTitle}>My scar progress</Text>
        </View>
      </View>
      <KeyboardAwareScrollView bottomOffset={40} contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + space.xxl }]} keyboardShouldPersistTaps="handled">
        <View style={styles.column}>
          <Text style={styles.title}>Track your results</Text>
          <Text style={styles.body}>Take a photo each week in the same light and from the same angle. Your photos are private unless you add them to a review.</Text>
          {!info ? (
            <>
              <Text style={styles.label}>Order number</Text>
              <TextInput testID="progress-order" value={order} onChangeText={setOrder} autoCapitalize="characters" placeholder="BRNA-260601-0001" placeholderTextColor={colors.muted} style={styles.input} />
              <Text style={styles.label}>Email used for the order</Text>
              <TextInput testID="progress-email" value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" placeholder="jane@email.com" placeholderTextColor={colors.muted} style={styles.input} />
              <Pressable testID="progress-open" disabled={loading || order.trim().length < 6 || !email.includes("@")} onPress={open} style={[styles.cta, (loading || order.trim().length < 6 || !email.includes("@")) && styles.disabled]}>
                {loading ? <ActivityIndicator color={colors.onBrandPrimary} /> : <Text style={styles.ctaText}>Open my photos</Text>}
              </Pressable>
            </>
          ) : (
            <>
              <View style={styles.grid}>
                {SLOTS.map((s) => (
                  <View key={s.key} style={styles.cell}>
                    <PhotoSlot label={s.label} uri={local[s.key] ?? existing(s)} busy={busy === s.key} onPicked={(u) => pick(s, u)} testID={`progress-${s.key}`} />
                  </View>
                ))}
              </View>
              <Pressable
                testID="progress-review"
                onPress={() => router.push({ pathname: "/review", params: { order: order.trim(), email: email.trim() } })}
                style={styles.cta}
              >
                <Text style={styles.ctaText}>Review BioRNA for 25% off a box</Text>
              </Pressable>
            </>
          )}
          {error ? <Text style={styles.error} testID="progress-error">{error}</Text> : null}
        </View>
      </KeyboardAwareScrollView>
    </View>
  );
}

const useStyles = makeStyles((c) => ({
  root: { flex: 1, backgroundColor: c.surfaceSecondary },
  header: { backgroundColor: c.surface, borderBottomWidth: 1, borderBottomColor: c.border, paddingBottom: space.sm },
  headerInner: { width: "100%", maxWidth: MAX_WIDTH, alignSelf: "center", flexDirection: "row", alignItems: "center", paddingHorizontal: space.md, gap: space.sm },
  iconBtn: { width: 44, height: 44, alignItems: "center", justifyContent: "center" },
  headerTitle: { flex: 1, fontFamily: fonts.bold, fontSize: 17, color: c.onSurface },
  scroll: { paddingHorizontal: space.xl, paddingTop: space.xl },
  column: { width: "100%", maxWidth: MAX_WIDTH, alignSelf: "center" },
  title: { fontFamily: fonts.black, fontSize: 26, color: c.onSurface },
  body: { fontFamily: fonts.regular, fontSize: 15, lineHeight: 22, color: c.muted, marginTop: space.sm, marginBottom: space.xl },
  label: { fontFamily: fonts.medium, fontSize: 13, color: c.onSurfaceTertiary, marginBottom: space.xs, marginTop: space.md },
  input: { height: 52, borderRadius: radius.md, borderWidth: 1, borderColor: c.border, backgroundColor: c.surface, paddingHorizontal: space.lg, fontFamily: fonts.regular, fontSize: 16, color: c.onSurface },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: space.md },
  cell: { width: "47%" },
  cta: { height: 56, borderRadius: radius.pill, backgroundColor: c.brandPrimary, alignItems: "center", justifyContent: "center", marginTop: space.xl },
  disabled: { opacity: 0.5 },
  ctaText: { fontFamily: fonts.bold, fontSize: 16, color: c.onBrandPrimary },
  error: { fontFamily: fonts.medium, fontSize: 13, color: c.error, marginTop: space.md, textAlign: "center" },
}));
