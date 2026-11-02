import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { ActivityIndicator, Pressable, Text, TextInput, View } from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-controller";

import { getAdminPricing, setAdminPricing } from "../../api";
import { formatSGD, Prices } from "../../content";
import { fonts, radius, space } from "../../fonts";
import { makeStyles, useTheme } from "../../theme";
import { useAdminStyles } from "./shared";

const FIELDS: { key: keyof Prices; label: string; hint: string }[] = [
  { key: "single", label: "Single box", hint: "One-time purchase of 1 box" },
  { key: "bundle", label: "2-box bundle (per box)", hint: "One-time purchase of 2 or more boxes" },
  { key: "autoship", label: "Auto-Ship (per box)", hint: "New Auto-Ship plans; existing plans keep their price" },
];

export function PricingTab({ passcode }: { passcode: string }) {
  const styles = useAdminStyles();
  const own = useStyles();
  const { colors } = useTheme();
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({ queryKey: ["admin-pricing", passcode], queryFn: () => getAdminPricing(passcode) });
  const [form, setForm] = useState<Record<keyof Prices, string>>({ single: "", bundle: "", autoship: "" });
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  useEffect(() => {
    if (data) setForm({ single: String(data.single), bundle: String(data.bundle), autoship: String(data.autoship) });
  }, [data]);

  const parsed = { single: parseInt(form.single, 10), bundle: parseInt(form.bundle, 10), autoship: parseInt(form.autoship, 10) };
  const inRange = Object.values(parsed).every((n) => Number.isFinite(n) && n >= 1 && n <= 5000);
  const valid = inRange && parsed.bundle <= parsed.single;
  const changed = !!data && (parsed.single !== data.single || parsed.bundle !== data.bundle || parsed.autoship !== data.autoship);

  const save = async () => {
    setMsg(null);
    setSaving(true);
    try {
      const next = await setAdminPricing(passcode, parsed);
      qc.setQueryData(["admin-pricing", passcode], next);
      await qc.invalidateQueries({ queryKey: ["pricing"] });
      setMsg({ ok: true, text: "Prices updated. The website and checkout now use the new prices." });
    } catch (e) {
      setMsg({ ok: false, text: e instanceof Error ? e.message : "Something went wrong" });
    } finally {
      setSaving(false);
    }
  };

  if (isLoading || !data) return <ActivityIndicator style={{ marginTop: 48 }} color={colors.brandPrimary} />;

  return (
    <KeyboardAwareScrollView bottomOffset={40} contentContainerStyle={styles.list} keyboardShouldPersistTaps="handled">
      <Text style={styles.count}>Live prices (SGD)</Text>
      <Text style={[styles.body, { marginTop: 0 }]}>Changes apply immediately to the landing page and to new orders.</Text>
      {FIELDS.map((f) => (
        <View key={f.key} style={styles.card}>
          <Text style={own.label}>{f.label}</Text>
          <Text style={own.hint}>{f.hint}</Text>
          <View style={own.inputRow}>
            <Text style={own.dollar}>$</Text>
            <TextInput
              testID={`admin-price-${f.key}`}
              value={form[f.key]}
              onChangeText={(t) => { setForm((s) => ({ ...s, [f.key]: t.replace(/\D/g, "").slice(0, 4) })); setMsg(null); }}
              keyboardType="number-pad"
              style={own.input}
            />
          </View>
        </View>
      ))}
      {valid ? (
        <Text style={own.preview} testID="admin-price-preview">
          Customers will see: 1 box {formatSGD(parsed.single)} · 2 boxes {formatSGD(parsed.bundle * 2)}
          {parsed.single > parsed.bundle ? ` (save ${formatSGD((parsed.single - parsed.bundle) * 2)})` : ""} · Auto-Ship {formatSGD(parsed.autoship)}/box
        </Text>
      ) : (
        <Text style={styles.error}>
          {inRange ? "The 2-box bundle price per box can't be higher than the single-box price." : "Enter whole-dollar prices between $1 and $5,000."}
        </Text>
      )}
      {msg ? <Text style={msg.ok ? own.ok : styles.error} testID="admin-price-message">{msg.text}</Text> : null}
      <Pressable testID="admin-price-save" disabled={!valid || !changed || saving} onPress={save} style={[own.cta, (!valid || !changed || saving) && own.disabled]}>
        {saving ? <ActivityIndicator color={colors.onBrandPrimary} /> : <Text style={own.ctaText}>Save prices</Text>}
      </Pressable>
    </KeyboardAwareScrollView>
  );
}

const useStyles = makeStyles((c) => ({
  label: { fontFamily: fonts.bold, fontSize: 16, color: c.onSurface },
  hint: { fontFamily: fonts.regular, fontSize: 13, color: c.muted, marginTop: 2 },
  inputRow: { flexDirection: "row", alignItems: "center", marginTop: space.md, height: 52, borderRadius: radius.md, borderWidth: 1, borderColor: c.border, paddingHorizontal: space.lg, backgroundColor: c.surfaceSecondary },
  dollar: { fontFamily: fonts.bold, fontSize: 18, color: c.muted, marginRight: space.xs },
  input: { flex: 1, height: 52, fontFamily: fonts.bold, fontSize: 18, color: c.onSurface },
  preview: { fontFamily: fonts.medium, fontSize: 13, lineHeight: 19, color: c.onSurfaceTertiary },
  ok: { fontFamily: fonts.medium, fontSize: 13, color: c.success },
  cta: { height: 56, borderRadius: radius.pill, backgroundColor: c.brandPrimary, alignItems: "center", justifyContent: "center", marginTop: space.sm },
  disabled: { opacity: 0.5 },
  ctaText: { fontFamily: fonts.bold, fontSize: 16, color: c.onBrandPrimary },
}));
