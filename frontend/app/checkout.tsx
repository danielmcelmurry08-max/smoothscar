import * as Haptics from "expo-haptics";
import { useLocalSearchParams, useRouter } from "expo-router";
import { AppleLogo, ArrowLeft, CreditCard, GoogleLogo, Lock, Minus, Plus } from "phosphor-react-native";
import { useEffect, useRef, useState } from "react";
import { ActivityIndicator, Platform, Pressable, Text, TextInput, View } from "react-native";
import { KeyboardAwareScrollView, KeyboardStickyView } from "react-native-keyboard-controller";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { createOrder, CodePreview } from "@/src/api";
import { PromoCodeField } from "@/src/components/PromoCodeField";
import { useAuth } from "@/src/auth";
import { CLINIC_TIERS, formatSGD, PlanId, PRICING, SUB_TIERS, unitPriceFor } from "@/src/content";
import { fonts, MAX_WIDTH, radius, space } from "@/src/fonts";
import { makeStyles, useTheme } from "@/src/theme";

type Pay = "apple_pay" | "google_pay" | "card";
const PLAN_NAMES: Record<PlanId, string> = {
  subscribe: "Auto-Ship · Every 2 Weeks",
  one_time: "BioRNA-C · One-time purchase",
  clinic: "Clinic & Multi-Pack Program",
};
const MAX_QTY: Record<PlanId, number> = { one_time: 10, subscribe: 4, clinic: 10 };
const TIERS: Partial<Record<PlanId, number[]>> = { clinic: CLINIC_TIERS, subscribe: SUB_TIERS };

type FieldKey = "full_name" | "email" | "phone" | "address" | "postal_code" | "clinic_name";

export default function Checkout() {
  const styles = useStyles();
  const { colors } = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ plan?: string; qty?: string; code?: string }>();
  const initialPlan: PlanId = params.plan === "subscribe" ? "subscribe" : "one_time";
  const [plan] = useState<PlanId>(initialPlan);
  const [qty, setQty] = useState(() => {
    const q = parseInt(params.qty || "", 10);
    const tiers = TIERS[initialPlan];
    if (tiers) return tiers.includes(q) ? q : tiers[0];
    return q >= 1 && q <= MAX_QTY[initialPlan] ? q : 1;
  });
  const [pay, setPay] = useState<Pay>(Platform.OS === "android" ? "google_pay" : "apple_pay");
  const { user } = useAuth();
  const [form, setForm] = useState<Record<FieldKey, string>>({ full_name: user?.name ?? "", email: user?.email ?? "", phone: "", address: "", postal_code: "", clinic_name: "" });
  useEffect(() => {
    if (!user) return;
    setForm((s) => ({ ...s, full_name: s.full_name || user.name || "", email: s.email || user.email || "" }));
  }, [user]);
  const [errors, setErrors] = useState<Partial<Record<FieldKey, string>>>({});
  const [submitError, setSubmitError] = useState("");
  const [loading, setLoading] = useState(false);
  const refs = useRef<Partial<Record<FieldKey, TextInput | null>>>({});

  const unit = unitPriceFor(plan, qty);
  const tiers = TIERS[plan];
  const [promo, setPromo] = useState<CodePreview | null>(null);
  const subtotal = unit * qty;
  const discount = promo ? Math.min(promo.kind === "referral" ? 25 : unit, subtotal) : 0;
  const total = subtotal - discount;

  const fields: { key: FieldKey; label: string; placeholder: string; keyboard?: "email-address" | "phone-pad" | "number-pad"; auto?: any }[] = [
    ...(plan === "clinic" ? [{ key: "clinic_name" as FieldKey, label: "Clinic / provider name", placeholder: "e.g. Orchard Aesthetics Clinic" }] : []),
    { key: "full_name", label: "Full name", placeholder: "Jane Tan", auto: "name" },
    { key: "email", label: "Email", placeholder: "jane@email.com", keyboard: "email-address", auto: "email" },
    { key: "phone", label: "Mobile number", placeholder: "+65 9123 4567", keyboard: "phone-pad", auto: "tel" },
    { key: "address", label: "Delivery address", placeholder: "Block, street, unit", auto: "street-address" },
    { key: "postal_code", label: "Postal code", placeholder: "308232", keyboard: "number-pad", auto: "postal-code" },
  ];

  const validate = () => {
    const e: Partial<Record<FieldKey, string>> = {};
    if (plan === "clinic" && form.clinic_name.trim().length < 2) e.clinic_name = "Enter your clinic or provider name";
    if (form.full_name.trim().length < 2) e.full_name = "Enter your full name";
    if (!/^\S+@\S+\.\S+$/.test(form.email.trim())) e.email = "Enter a valid email";
    if (form.phone.replace(/\D/g, "").length < 6) e.phone = "Enter a valid mobile number";
    if (form.address.trim().length < 5) e.address = "Enter your delivery address";
    if (form.postal_code.trim().length < 4) e.postal_code = "Enter a valid postal code";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const submit = async () => {
    setSubmitError("");
    if (!validate()) return;
    setLoading(true);
    try {
      const order = await createOrder({
        plan,
        quantity: qty,
        payment_method: pay,
        code: promo?.code ?? null,
        customer: {
          full_name: form.full_name.trim(),
          email: form.email.trim(),
          phone: form.phone.trim(),
          address: form.address.trim(),
          postal_code: form.postal_code.trim(),
          clinic_name: plan === "clinic" ? form.clinic_name.trim() : null,
        },
      });
      if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.replace({ pathname: "/order/[id]", params: { id: order.id } });
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const PayOption = ({ id, label, Icon }: { id: Pay; label: string; Icon: typeof AppleLogo }) => {
    const sel = pay === id;
    return (
      <Pressable testID={`pay-method-${id}`} role="radio" aria-checked={sel} onPress={() => setPay(id)} style={[styles.payOpt, sel && styles.payOptActive]}>
        <Icon size={18} color={colors.onSurface} weight={id === "apple_pay" ? "fill" : "bold"} />
        <Text style={styles.payText}>{label}</Text>
      </Pressable>
    );
  };

  return (
    <View style={styles.root} testID="checkout-screen">
      <View style={[styles.header, { paddingTop: insets.top + space.sm }]}>
        <View style={styles.headerInner}>
          <Pressable testID="checkout-back-button" onPress={() => (router.canGoBack() ? router.back() : router.replace("/"))} style={styles.back} hitSlop={8}>
            <ArrowLeft size={22} color={colors.onSurface} weight="bold" />
          </Pressable>
          <Text style={styles.headerTitle}>Secure Checkout</Text>
          <Lock size={18} color={colors.success} weight="bold" />
        </View>
      </View>

      <KeyboardAwareScrollView bottomOffset={120} contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled" testID="checkout-scroll">
        <View style={styles.column}>
          <View style={styles.summary} testID="order-summary">
            <Text style={styles.kicker}>Order summary</Text>
            <Text style={styles.planName} testID="summary-plan-name">{PLAN_NAMES[plan]}</Text>
            <Text style={styles.planNote}>{PRICING[plan].note}</Text>
            <View style={styles.qtyRow}>
              <Text style={styles.qtyLabel}>{formatSGD(unit)} × {qty} box{qty > 1 ? "es" : ""}</Text>
              {tiers ? (
                <View style={styles.tierRow}>
                  {tiers.map((t) => (
                    <Pressable key={t} testID={`checkout-tier-${t}`} onPress={() => setQty(t)} style={[styles.tierChip, qty === t && styles.tierChipActive]}>
                      <Text style={[styles.tierChipText, qty === t && styles.tierChipTextActive]}>{t}</Text>
                    </Pressable>
                  ))}
                </View>
              ) : (
                <View style={styles.stepper}>
                  <Pressable testID="qty-decrease" onPress={() => setQty((q) => Math.max(1, q - 1))} style={styles.stepBtn} disabled={qty <= 1}>
                    <Minus size={16} color={qty <= 1 ? colors.borderStrong : colors.onSurface} weight="bold" />
                  </Pressable>
                  <Text style={styles.qtyValue} testID="qty-value">{qty}</Text>
                  <Pressable testID="qty-increase" onPress={() => setQty((q) => Math.min(MAX_QTY[plan], q + 1))} style={styles.stepBtn} disabled={qty >= MAX_QTY[plan]}>
                    <Plus size={16} color={qty >= MAX_QTY[plan] ? colors.borderStrong : colors.onSurface} weight="bold" />
                  </Pressable>
                </View>
              )}
            </View>
            <View style={styles.line}>
              <Text style={styles.lineLabel}>Shipping (Singapore)</Text>
              <Text style={styles.lineValue}>Free</Text>
            </View>
            {discount ? (
              <View style={styles.line} testID="discount-line">
                <Text style={styles.lineLabel}>{promo?.kind === "referral" ? "Referral discount" : "Reward: 1 free box"}</Text>
                <Text style={styles.lineValue}>−{formatSGD(discount)}</Text>
              </View>
            ) : null}
            <View style={[styles.line, styles.totalLine]}>
              <Text style={styles.totalLabel}>Total{plan === "subscribe" ? " · every 2 weeks" : ""}</Text>
              <Text style={styles.totalValue} testID="checkout-total">{formatSGD(total)}</Text>
            </View>
          </View>

          <Text style={styles.sectionTitle}>Have a code?</Text>
          <PromoCodeField initialCode={params.code} applied={promo} onApplied={setPromo} />

          <Text style={styles.sectionTitle}>Express checkout</Text>
          <View style={styles.payRow} role="radiogroup">
            <PayOption id="apple_pay" label="Apple Pay" Icon={AppleLogo} />
            <PayOption id="google_pay" label="Google Pay" Icon={GoogleLogo} />
            <PayOption id="card" label="Card" Icon={CreditCard} />
          </View>

          <Text style={styles.sectionTitle}>{plan === "clinic" ? "Clinic & delivery details" : "Delivery details"}</Text>
          {fields.map((f, i) => (
            <View key={f.key} style={styles.field}>
              <Text style={styles.label}>{f.label}</Text>
              <TextInput
                ref={(r) => {
                  refs.current[f.key] = r;
                }}
                testID={`input-${f.key}`}
                value={form[f.key]}
                onChangeText={(t) => {
                  setForm((s) => ({ ...s, [f.key]: t }));
                  if (errors[f.key]) setErrors((e) => ({ ...e, [f.key]: undefined }));
                }}
                placeholder={f.placeholder}
                placeholderTextColor={colors.muted}
                keyboardType={f.keyboard}
                autoComplete={f.auto}
                autoCapitalize={f.key === "email" ? "none" : "words"}
                returnKeyType={i === fields.length - 1 ? "done" : "next"}
                onSubmitEditing={() => (i === fields.length - 1 ? submit() : refs.current[fields[i + 1].key]?.focus())}
                style={[styles.input, errors[f.key] && styles.inputError]}
              />
              {errors[f.key] ? <Text style={styles.errorText} testID={`error-${f.key}`}>{errors[f.key]}</Text> : null}
            </View>
          ))}
          <Text style={styles.note}>Demo checkout — no real payment is taken. Your order is saved and confirmed instantly.</Text>
        </View>
      </KeyboardAwareScrollView>

      <KeyboardStickyView offset={{ opened: insets.bottom }}>
        <View style={[styles.bottom, { paddingBottom: insets.bottom + space.md }]}>
          <View style={styles.column}>
            {submitError ? <Text style={styles.submitError} testID="checkout-submit-error">{submitError}</Text> : null}
            <Pressable testID="place-order-button" onPress={submit} disabled={loading} style={({ pressed }) => [styles.cta, (pressed || loading) && styles.pressed]}>
              {loading ? (
                <ActivityIndicator color={colors.onBrandPrimary} />
              ) : (
                <>
                  <Lock size={16} color={colors.onBrandPrimary} weight="bold" />
                  <Text style={styles.ctaText}>
                    {pay === "apple_pay" ? "Pay with Apple Pay" : pay === "google_pay" ? "Pay with Google Pay" : "Place Order"} · {formatSGD(total)}
                  </Text>
                </>
              )}
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
  summary: { backgroundColor: c.surface, borderRadius: radius.lg, padding: space.lg + 2, borderWidth: 1, borderColor: c.border },
  kicker: { fontFamily: fonts.bold, fontSize: 11, letterSpacing: 1.2, textTransform: "uppercase", color: c.brandPrimary },
  planName: { fontFamily: fonts.bold, fontSize: 17, color: c.onSurface, marginTop: space.xs },
  planNote: { fontFamily: fonts.regular, fontSize: 13, color: c.muted, marginTop: 2 },
  qtyRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: space.lg },
  qtyLabel: { fontFamily: fonts.medium, fontSize: 14, color: c.onSurfaceTertiary },
  stepper: { flexDirection: "row", alignItems: "center", borderWidth: 1, borderColor: c.border, borderRadius: radius.pill },
  stepBtn: { width: 44, height: 40, alignItems: "center", justifyContent: "center" },
  qtyValue: { fontFamily: fonts.bold, fontSize: 15, color: c.onSurface, minWidth: 20, textAlign: "center" },
  tierRow: { flexDirection: "row", gap: space.xs + 2 },
  tierChip: { minWidth: 52, height: 44, borderRadius: radius.pill, borderWidth: 1, borderColor: c.border, alignItems: "center", justifyContent: "center" },
  tierChipActive: { borderColor: c.brandPrimary, backgroundColor: c.brandTertiary },
  tierChipText: { fontFamily: fonts.bold, fontSize: 14, color: c.muted },
  tierChipTextActive: { color: c.onBrandTertiary },
  line: { flexDirection: "row", justifyContent: "space-between", marginTop: space.md },
  lineLabel: { fontFamily: fonts.regular, fontSize: 14, color: c.muted },
  lineValue: { fontFamily: fonts.medium, fontSize: 14, color: c.success },
  totalLine: { borderTopWidth: 1, borderTopColor: c.divider, paddingTop: space.md, alignItems: "baseline" },
  totalLabel: { fontFamily: fonts.bold, fontSize: 15, color: c.onSurface },
  totalValue: { fontFamily: fonts.black, fontSize: 24, color: c.onSurface },
  sectionTitle: { fontFamily: fonts.bold, fontSize: 15, color: c.onSurface, marginTop: space.xl, marginBottom: space.md },
  payRow: { flexDirection: "row", gap: space.sm },
  payOpt: {
    flex: 1,
    height: 52,
    borderRadius: radius.md,
    borderWidth: 1.5,
    borderColor: c.border,
    backgroundColor: c.surface,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: space.xs + 2,
  },
  payOptActive: { borderColor: c.brandPrimary, backgroundColor: c.brandTertiary },
  payText: { fontFamily: fonts.bold, fontSize: 13, color: c.onSurface },
  field: { marginBottom: space.md },
  label: { fontFamily: fonts.medium, fontSize: 13, color: c.onSurfaceTertiary, marginBottom: space.xs + 2 },
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
  inputError: { borderColor: c.error },
  errorText: { fontFamily: fonts.medium, fontSize: 12, color: c.error, marginTop: space.xs },
  note: { fontFamily: fonts.regular, fontSize: 12, lineHeight: 18, color: c.muted, marginTop: space.sm },
  bottom: { backgroundColor: c.surface, borderTopWidth: 1, borderTopColor: c.border, paddingTop: space.md, paddingHorizontal: space.lg },
  submitError: { fontFamily: fonts.medium, fontSize: 13, color: c.error, marginBottom: space.sm, textAlign: "center" },
  cta: {
    height: 56,
    borderRadius: radius.pill,
    backgroundColor: c.brandPrimary,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: space.sm,
  },
  pressed: { opacity: 0.85 },
  ctaText: { fontFamily: fonts.bold, fontSize: 16, color: c.onBrandPrimary },
}));
