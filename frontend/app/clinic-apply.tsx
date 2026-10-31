import { useRouter } from "expo-router";
import { ArrowLeft, CheckCircle, Handshake } from "phosphor-react-native";
import { useRef, useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { KeyboardAwareScrollView, KeyboardStickyView } from "react-native-keyboard-controller";
import Animated, { ZoomIn } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { createClinicApplication } from "@/src/api";
import { formatSGD, PRICING } from "@/src/content";
import { fonts, MAX_WIDTH, radius, space } from "@/src/fonts";
import { makeStyles, useTheme } from "@/src/theme";

const PRACTICE_TYPES = ["Aesthetic clinic", "Dermatology", "O&G / Maternity", "Plastic surgery", "General practice", "Pharmacy / Retail", "Other"];
const VOLUMES = ["2–5 boxes", "6–20 boxes", "21–50 boxes", "50+ boxes"];

type Key = "clinic_name" | "credentials" | "contact_name" | "role" | "email" | "phone" | "location" | "message";
const FIELDS: { key: Key; label: string; placeholder: string; keyboard?: "email-address" | "phone-pad"; optional?: boolean; multiline?: boolean }[] = [
  { key: "clinic_name", label: "Name of practice / business", placeholder: "e.g. Orchard Aesthetics Clinic" },
  { key: "email", label: "Email", placeholder: "hello@clinic.sg", keyboard: "email-address" },
  { key: "phone", label: "Phone number", placeholder: "+65 6123 4567", keyboard: "phone-pad" },
  { key: "credentials", label: "Credentials", placeholder: "e.g. MBBS, SMC Reg. No. / Pharmacy licence / UEN", multiline: true },
  { key: "contact_name", label: "Contact person (optional)", placeholder: "Dr Jane Tan", optional: true },
  { key: "role", label: "Role (optional)", placeholder: "e.g. Medical Director", optional: true },
  { key: "location", label: "City / country (optional)", placeholder: "Singapore", optional: true },
];

export default function ClinicApply() {
  const styles = useStyles();
  const { colors } = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [form, setForm] = useState<Record<Key, string>>({ clinic_name: "", credentials: "", contact_name: "", role: "", email: "", phone: "", location: "", message: "" });
  const [practice, setPractice] = useState("");
  const [volume, setVolume] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState<string | null>(null);
  const refs = useRef<Partial<Record<Key, TextInput | null>>>({});

  const goBack = () => (router.canGoBack() ? router.back() : router.replace("/"));

  const validate = () => {
    const e: Record<string, string> = {};
    if (form.clinic_name.trim().length < 2) e.clinic_name = "Enter your practice or business name";
    if (form.credentials.trim().length < 3) e.credentials = "Enter your professional or business credentials";
    if (!/^\S+@\S+\.\S+$/.test(form.email.trim())) e.email = "Enter a valid email";
    if (form.phone.replace(/\D/g, "").length < 6) e.phone = "Enter a valid phone number";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const submit = async () => {
    setSubmitError("");
    if (!validate()) return;
    setLoading(true);
    try {
      await createClinicApplication({
        clinic_name: form.clinic_name.trim(),
        credentials: form.credentials.trim(),
        contact_name: form.contact_name.trim() || null,
        role: form.role.trim() || null,
        email: form.email.trim(),
        phone: form.phone.trim(),
        location: form.location.trim() || null,
        practice_type: practice || null,
        monthly_volume: volume || null,
        message: form.message.trim() || null,
      });
      setDone(form.clinic_name.trim());
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const header = (
    <View style={[styles.header, { paddingTop: insets.top + space.sm }]}>
      <View style={styles.headerInner}>
        <Pressable testID="clinic-back-button" onPress={goBack} style={styles.back} hitSlop={8}>
          <ArrowLeft size={22} color={colors.onSurface} weight="bold" />
        </Pressable>
        <Text style={styles.headerTitle}>Provider Partner Program</Text>
      </View>
    </View>
  );

  if (done) {
    return (
      <View style={styles.root} testID="clinic-apply-success">
        {header}
        <ScrollView contentContainerStyle={[styles.scroll, styles.successWrap, { paddingBottom: insets.bottom + space.xl }]}>
          <View style={[styles.column, styles.center]}>
            <Animated.View entering={ZoomIn.springify()}>
              <CheckCircle size={56} color={colors.success} weight="fill" />
            </Animated.View>
            <Text style={styles.successTitle}>Application received</Text>
            <Text style={styles.successBody}>
              Thank you — our partnerships team will contact {done} within 2 working days with your partner account and onboarding details.
            </Text>
            <Pressable testID="clinic-success-home-button" onPress={() => router.dismissTo("/")} style={({ pressed }) => [styles.cta, styles.fullWidth, pressed && styles.pressed]}>
              <Text style={styles.ctaText}>Back to BioRNA Antiscar</Text>
            </Pressable>
          </View>
        </ScrollView>
      </View>
    );
  }

  const Chips = ({ items, value, onSelect, prefix }: { items: string[]; value: string; onSelect: (v: string) => void; prefix: string }) => (
    <View style={styles.chips}>
      {items.map((it) => {
        const sel = value === it;
        return (
          <Pressable key={it} testID={`${prefix}-${it.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`} onPress={() => onSelect(it)} style={[styles.chip, sel && styles.chipActive]}>
            <Text style={[styles.chipText, sel && styles.chipTextActive]}>{it}</Text>
          </Pressable>
        );
      })}
    </View>
  );

  return (
    <View style={styles.root} testID="clinic-apply-screen">
      {header}
      <KeyboardAwareScrollView bottomOffset={120} contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <View style={styles.column}>
          <Text style={styles.eyebrow}>For clinics & healthcare businesses</Text>
          <Text style={styles.pageTitle} role="heading" aria-level={1}>Become a BioRNA Provider Partner</Text>
          <Text style={styles.pageBody}>
            Offer your patients a steroid-free, painless option for C-section, keloid and hypertrophic scars, backed by peer-reviewed clinical data.
          </Text>
          <View style={styles.intro}>
            <View style={styles.introIcon}>
              <Handshake size={22} color={colors.onBrandPrimary} weight="bold" />
            </View>
            <View style={styles.flex}>
              <Text style={styles.introTitle}>{formatSGD(PRICING.clinic.unit)} per box for partners</Text>
              <Text style={styles.introBody}>vs {formatSGD(PRICING.one_time.unit)} retail · minimum 2 boxes · for clinics & healthcare providers</Text>
            </View>
          </View>

          {FIELDS.map((f, i) => (
            <View key={f.key} style={styles.field}>
              <Text style={styles.label}>{f.label}</Text>
              <TextInput
                ref={(r) => {
                  refs.current[f.key] = r;
                }}
                testID={`clinic-input-${f.key}`}
                value={form[f.key]}
                onChangeText={(t) => {
                  setForm((s) => ({ ...s, [f.key]: t }));
                  if (errors[f.key]) setErrors((e) => ({ ...e, [f.key]: "" }));
                }}
                placeholder={f.placeholder}
                placeholderTextColor={colors.muted}
                keyboardType={f.keyboard}
                autoCapitalize={f.key === "email" ? "none" : "words"}
                returnKeyType="next"
                onSubmitEditing={() => refs.current[FIELDS[i + 1]?.key ?? "message"]?.focus()}
                multiline={f.multiline}
                style={[styles.input, f.multiline ? styles.textareaSm : null, errors[f.key] ? styles.inputError : null]}
              />
              {errors[f.key] ? <Text style={styles.errorText} testID={`clinic-error-${f.key}`}>{errors[f.key]}</Text> : null}
            </View>
          ))}

          <Text style={styles.label}>Practice type (optional)</Text>
          <Chips items={PRACTICE_TYPES} value={practice} onSelect={(v) => { setPractice(v); setErrors((e) => ({ ...e, practice: "" })); }} prefix="practice" />
          {errors.practice ? <Text style={styles.errorText} testID="clinic-error-practice">{errors.practice}</Text> : null}

          <Text style={[styles.label, styles.gapTop]}>Estimated boxes per month (optional)</Text>
          <Chips items={VOLUMES} value={volume} onSelect={(v) => { setVolume(v); setErrors((e) => ({ ...e, volume: "" })); }} prefix="volume" />
          {errors.volume ? <Text style={styles.errorText} testID="clinic-error-volume">{errors.volume}</Text> : null}

          <View style={[styles.field, styles.gapTop]}>
            <Text style={styles.label}>Message (optional)</Text>
            <TextInput
              ref={(r) => {
                refs.current.message = r;
              }}
              testID="clinic-input-message"
              value={form.message}
              onChangeText={(t) => setForm((s) => ({ ...s, message: t }))}
              placeholder="Tell us about your patients and scar cases"
              placeholderTextColor={colors.muted}
              multiline
              maxLength={1500}
              style={[styles.input, styles.textarea]}
            />
          </View>
        </View>
      </KeyboardAwareScrollView>

      <KeyboardStickyView offset={{ opened: insets.bottom }}>
        <View style={[styles.bottom, { paddingBottom: insets.bottom + space.md }]}>
          <View style={styles.column}>
            {submitError ? <Text style={styles.submitError} testID="clinic-submit-error">{submitError}</Text> : null}
            <Pressable testID="clinic-submit-button" onPress={submit} disabled={loading} style={({ pressed }) => [styles.cta, (pressed || loading) && styles.pressed]}>
              {loading ? <ActivityIndicator color={colors.onBrandPrimary} /> : <Text style={styles.ctaText}>Submit Application</Text>}
            </Pressable>
          </View>
        </View>
      </KeyboardStickyView>
    </View>
  );
}

const useStyles = makeStyles((c) => ({
  root: { flex: 1, backgroundColor: c.surfaceSecondary },
  header: { backgroundColor: c.surface, borderBottomWidth: 1, borderBottomColor: c.border, paddingBottom: space.sm },
  headerInner: { width: "100%", maxWidth: MAX_WIDTH, alignSelf: "center", flexDirection: "row", alignItems: "center", paddingHorizontal: space.md, gap: space.sm },
  back: { width: 44, height: 44, alignItems: "center", justifyContent: "center" },
  headerTitle: { flex: 1, fontFamily: fonts.bold, fontSize: 17, color: c.onSurface },
  scroll: { paddingHorizontal: space.xl, paddingTop: space.xl, paddingBottom: space.xxl },
  column: { width: "100%", maxWidth: MAX_WIDTH, alignSelf: "center" },
  center: { alignItems: "center" },
  flex: { flex: 1 },
  intro: { flexDirection: "row", gap: space.lg, alignItems: "center", backgroundColor: c.brandTertiary, borderRadius: radius.lg, padding: space.lg, marginBottom: space.xl },
  introIcon: { width: 44, height: 44, borderRadius: radius.md, backgroundColor: c.brandPrimary, alignItems: "center", justifyContent: "center" },
  introTitle: { fontFamily: fonts.bold, fontSize: 16, color: c.onSurface },
  introBody: { fontFamily: fonts.regular, fontSize: 13, lineHeight: 18, color: c.onSurfaceTertiary, marginTop: 2 },
  field: { marginBottom: space.md },
  label: { fontFamily: fonts.medium, fontSize: 13, color: c.onSurfaceTertiary, marginBottom: space.xs + 2 },
  gapTop: { marginTop: space.lg },
  input: {
    height: 52,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: c.border,
    backgroundColor: c.surface,
    paddingHorizontal: space.lg,
    fontFamily: fonts.regular,
    fontSize: 16,
    color: c.onSurface,
  },
  textareaSm: { height: 80, paddingTop: space.md, textAlignVertical: "top" },
  eyebrow: { fontFamily: fonts.bold, fontSize: 12, letterSpacing: 1.4, textTransform: "uppercase", color: c.brandPrimary },
  pageTitle: { fontFamily: fonts.black, fontSize: 28, lineHeight: 33, letterSpacing: -0.6, color: c.onSurface, marginTop: space.sm },
  pageBody: { fontFamily: fonts.regular, fontSize: 15, lineHeight: 22, color: c.muted, marginTop: space.sm, marginBottom: space.xl },
  textarea: { height: 120, paddingTop: space.md, textAlignVertical: "top" },
  inputError: { borderColor: c.error },
  errorText: { fontFamily: fonts.medium, fontSize: 12, color: c.error, marginTop: space.xs },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: space.sm },
  chip: { height: 44, paddingHorizontal: space.md, borderRadius: radius.pill, borderWidth: 1, borderColor: c.border, backgroundColor: c.surface, justifyContent: "center" },
  chipActive: { borderColor: c.brandPrimary, backgroundColor: c.brandTertiary },
  chipText: { fontFamily: fonts.medium, fontSize: 13, color: c.onSurfaceTertiary },
  chipTextActive: { color: c.onBrandTertiary },
  bottom: { backgroundColor: c.surface, borderTopWidth: 1, borderTopColor: c.border, paddingTop: space.md, paddingHorizontal: space.lg },
  submitError: { fontFamily: fonts.medium, fontSize: 13, color: c.error, marginBottom: space.sm, textAlign: "center" },
  cta: { height: 56, borderRadius: radius.pill, backgroundColor: c.brandPrimary, alignItems: "center", justifyContent: "center" },
  fullWidth: { width: "100%", marginTop: space.xl },
  pressed: { opacity: 0.85 },
  ctaText: { fontFamily: fonts.bold, fontSize: 16, color: c.onBrandPrimary },
  successWrap: { paddingTop: space.xxxl },
  successTitle: { fontFamily: fonts.black, fontSize: 28, color: c.onSurface, marginTop: space.lg },
  successBody: { fontFamily: fonts.regular, fontSize: 15, lineHeight: 22, color: c.muted, textAlign: "center", marginTop: space.sm },
}));
