import * as Haptics from "expo-haptics";
import { ArrowRight, Buildings, CheckCircle, CircleIcon as Circle, Handshake, Lock, Repeat } from "phosphor-react-native";
import { useState } from "react";
import { Platform, Pressable, Text, View } from "react-native";

import { formatSGD, PlanId, PRICING, SUB_TIERS, unitPriceFor } from "../content";
import { fonts, radius, space } from "../fonts";
import { makeStyles, useTheme } from "../theme";
import { PayBadges } from "./PayBadges";
import { SectionHeader } from "./SectionHeader";

export type Selection = { plan: PlanId; qty: number };
type Props = { value: Selection; onChange: (s: Selection) => void; onProceed: () => void; onApply: () => void };

const tap = () => Platform.OS !== "web" && Haptics.selectionAsync();

export function CheckoutWidget({ value, onChange, onProceed, onApply }: Props) {
  const styles = useStyles();
  const { colors } = useTheme();
  const [mode, setMode] = useState<"personal" | "partner">("personal");
  const total = unitPriceFor(value.plan, value.qty) * value.qty;
  const selectedKey = value.plan === "subscribe" ? "autoship" : value.qty >= 2 ? "bundle" : "single";
  const bundleSave = (PRICING.one_time.unit - PRICING.one_time.bundle) * 2;

  const Option = ({ id, sel, title, sub, price, priceNote, badge }: { id: string; sel: Selection; title: string; sub: string; price: string; priceNote: string; badge?: string }) => {
    const selected = selectedKey === id;
    return (
      <Pressable
        testID={`plan-option-${id}`}
        role="radio"
        aria-checked={selected}
        onPress={() => {
          tap();
          onChange(sel);
        }}
        style={[styles.option, selected && styles.optionActive]}
      >
        {selected ? <CheckCircle size={22} color={colors.brandPrimary} weight="fill" /> : <Circle size={22} color={colors.borderStrong} />}
        <View style={styles.flex}>
          <View style={styles.optionTitleRow}>
            <Text style={styles.optionTitle}>{title}</Text>
            {badge ? (
              <View style={styles.saveBadge}>
                <Text style={styles.saveText}>{badge}</Text>
              </View>
            ) : null}
          </View>
          <Text style={styles.optionSub}>{sub}</Text>
        </View>
        <View style={styles.priceCol}>
          <Text style={styles.optionPrice}>{price}</Text>
          <Text style={styles.priceNote}>{priceNote}</Text>
        </View>
      </Pressable>
    );
  };

  return (
    <View role="region" aria-label="Choose how to buy" style={styles.section} testID="checkout-widget">
      <SectionHeader eyebrow="One product · Multiple ways to buy" title="Start your scar care." />
      <View style={styles.card}>
        <View style={styles.tabs} role="tablist">
          <Pressable
            testID="buy-tab-personal"
            role="tab"
            aria-selected={mode === "personal"}
            onPress={() => {
              tap();
              setMode("personal");
            }}
            style={[styles.tab, mode === "personal" && styles.tabActive]}
          >
            <Repeat size={16} color={mode === "personal" ? colors.onBrandPrimary : colors.muted} weight="bold" />
            <Text style={[styles.tabText, mode === "personal" && styles.tabTextActive]}>Buy & Auto-Ship</Text>
          </Pressable>
          <Pressable
            testID="buy-tab-clinic"
            role="tab"
            aria-selected={mode === "partner"}
            onPress={() => {
              tap();
              setMode("partner");
            }}
            style={[styles.tab, mode === "partner" && styles.tabActive]}
          >
            <Buildings size={16} color={mode === "partner" ? colors.onBrandPrimary : colors.muted} weight="bold" />
            <Text style={[styles.tabText, mode === "partner" && styles.tabTextActive]}>Provider Partners</Text>
          </Pressable>
        </View>

        {mode === "personal" ? (
          <View style={styles.body}>
            <Text style={styles.heading}>Continuous Scar Care</Text>
            <Text style={styles.desc}>7 patches per box — one patch nightly. Bundle or auto-ship to keep your regimen going.</Text>
            <View style={styles.options} role="radiogroup">
              <Option id="single" sel={{ plan: "one_time", qty: 1 }} title="Single box" sub={PRICING.one_time.note} price={formatSGD(PRICING.one_time.unit)} priceNote="1 box" />
              <Option
                id="bundle"
                sel={{ plan: "one_time", qty: 2 }}
                title="2-box bundle"
                sub={`${formatSGD(PRICING.one_time.bundle)} each · 2 weeks of nightly use`}
                price={formatSGD(PRICING.one_time.bundle * 2)}
                priceNote="2 boxes"
                badge={`SAVE ${formatSGD(bundleSave)}`}
              />
              <Option
                id="autoship"
                sel={{ plan: "subscribe", qty: value.plan === "subscribe" ? value.qty : SUB_TIERS[0] }}
                title="Auto-Ship every 2 weeks"
                sub={`${formatSGD(PRICING.subscribe.unit)} per box · multi-box · cancel anytime`}
                price={formatSGD(PRICING.subscribe.unit)}
                priceNote="/ box"
                badge="BEST VALUE"
              />
            </View>
            {value.plan === "subscribe" ? (
              <View style={styles.subRow} testID="autoship-qty-row">
                <Text style={styles.subLabel}>Boxes per shipment</Text>
                <View style={styles.subChips}>
                  {SUB_TIERS.map((q) => (
                    <Pressable
                      key={q}
                      testID={`autoship-qty-${q}`}
                      onPress={() => {
                        tap();
                        onChange({ plan: "subscribe", qty: q });
                      }}
                      style={[styles.subChip, value.qty === q && styles.optionActive]}
                    >
                      <Text style={[styles.subChipText, value.qty === q && styles.subChipTextActive]}>{q} boxes</Text>
                    </Pressable>
                  ))}
                </View>
              </View>
            ) : null}

            <View style={styles.summary}>
              <Text style={styles.summaryLabel}>{value.plan === "subscribe" ? "Every 2 weeks" : "Total today"}</Text>
              <Text style={styles.summaryValue} testID="widget-total">{formatSGD(total)}</Text>
            </View>

            <Pressable
              testID="proceed-checkout-button"
              onPress={() => {
                if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                onProceed();
              }}
              style={({ pressed }) => [styles.cta, pressed && styles.pressed]}
            >
              <Lock size={16} color={colors.onBrandPrimary} weight="bold" />
              <Text style={styles.ctaText}>Proceed to Secure Checkout</Text>
              <ArrowRight size={16} color={colors.onBrandPrimary} weight="bold" />
            </Pressable>
            <View style={styles.badges}>
              <PayBadges />
            </View>
          </View>
        ) : (
          <View style={styles.body}>
            <Text style={styles.heading}>Provider Partner Program</Text>
            <Text style={styles.desc}>
              For clinics, aesthetic practices, pharmacies and healthcare businesses. Apply once and our team will contact you to set up your partner account.
            </Text>
            <View style={styles.partnerList}>
              {["Exclusive partner terms", "Peer-reviewed clinical evidence to share", "Dedicated partnerships contact"].map((t) => (
                <View key={t} style={styles.partnerItem}>
                  <CheckCircle size={18} color={colors.brandPrimary} weight="fill" />
                  <Text style={styles.partnerText}>{t}</Text>
                </View>
              ))}
            </View>
            <Pressable testID="apply-partner-link" onPress={onApply} style={({ pressed }) => [styles.cta, pressed && styles.pressed]}>
              <Handshake size={18} color={colors.onBrandPrimary} weight="bold" />
              <Text style={styles.ctaText}>Become a Provider Partner</Text>
              <ArrowRight size={16} color={colors.onBrandPrimary} weight="bold" />
            </Pressable>
          </View>
        )}
      </View>
    </View>
  );
}

const useStyles = makeStyles((c) => ({
  section: { paddingHorizontal: space.xl, paddingVertical: space.xxxl, backgroundColor: c.surfaceSecondary },
  card: {
    backgroundColor: c.surface,
    borderRadius: radius.lg,
    padding: space.md,
    borderWidth: 1,
    borderColor: c.border,
    shadowColor: c.surfaceInverse,
    shadowOpacity: 0.06,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 10 },
    elevation: 3,
  },
  tabs: { flexDirection: "row", backgroundColor: c.surfaceSecondary, borderRadius: radius.md, padding: 4, gap: 4 },
  tab: {
    flex: 1,
    height: 44,
    borderRadius: radius.md - 2,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: space.xs + 2,
  },
  tabActive: { backgroundColor: c.brandPrimary },
  tabText: { fontFamily: fonts.bold, fontSize: 12, color: c.muted },
  tabTextActive: { color: c.onBrandPrimary },
  body: { paddingHorizontal: space.xs, paddingTop: space.xl },
  heading: { fontFamily: fonts.bold, fontSize: 19, color: c.onSurface },
  desc: { fontFamily: fonts.regular, fontSize: 14, lineHeight: 20, color: c.muted, marginTop: space.xs },
  options: { gap: space.md, marginTop: space.lg },
  option: {
    flexDirection: "row",
    alignItems: "center",
    gap: space.md,
    borderWidth: 1.5,
    borderColor: c.border,
    borderRadius: radius.md,
    padding: space.lg,
  },
  optionActive: { borderColor: c.brandPrimary, backgroundColor: c.brandTertiary },
  flex: { flex: 1 },
  optionTitleRow: { flexDirection: "row", alignItems: "center", gap: space.sm, flexWrap: "wrap" },
  optionTitle: { fontFamily: fonts.bold, fontSize: 15, color: c.onSurface },
  saveBadge: { backgroundColor: c.success, borderRadius: radius.sm, paddingHorizontal: 6, height: 18, justifyContent: "center" },
  saveText: { fontFamily: fonts.bold, fontSize: 10, color: c.onSuccess, letterSpacing: 0.4 },
  optionSub: { fontFamily: fonts.regular, fontSize: 12, lineHeight: 17, color: c.muted, marginTop: 2 },
  priceCol: { alignItems: "flex-end" },
  optionPrice: { fontFamily: fonts.black, fontSize: 18, color: c.onSurface },
  priceNote: { fontFamily: fonts.regular, fontSize: 11, color: c.muted },
  tiers: { flexDirection: "row", gap: space.sm, marginTop: space.lg },
  tier: {
    flex: 1,
    alignItems: "center",
    borderWidth: 1.5,
    borderColor: c.border,
    borderRadius: radius.md,
    paddingVertical: space.lg,
  },
  tierQty: { fontFamily: fonts.black, fontSize: 28, color: c.onSurface },
  tierLabel: { fontFamily: fonts.medium, fontSize: 12, color: c.muted },
  tierPrice: { fontFamily: fonts.bold, fontSize: 14, color: c.brandPrimary, marginTop: space.sm },
  partnerRow: { flexDirection: "row", alignItems: "center", gap: space.sm, marginTop: space.md },
  partnerText: { fontFamily: fonts.bold, fontSize: 14, color: c.onSurface },
  strike: { fontFamily: fonts.regular, fontSize: 13, color: c.muted, textDecorationLine: "line-through" },
  partnerSave: { fontFamily: fonts.bold, fontSize: 13, color: c.success },
  partnerList: { gap: space.md, marginTop: space.lg, marginBottom: space.sm },
  partnerItem: { flexDirection: "row", alignItems: "center", gap: space.sm },
  subRow: { marginTop: space.md },
  subLabel: { fontFamily: fonts.medium, fontSize: 13, color: c.onSurfaceTertiary, marginBottom: space.sm },
  subChips: { flexDirection: "row", gap: space.sm },
  subChip: { flex: 1, height: 44, borderRadius: radius.md, borderWidth: 1.5, borderColor: c.border, alignItems: "center", justifyContent: "center" },
  subChipText: { fontFamily: fonts.bold, fontSize: 14, color: c.muted },
  subChipTextActive: { color: c.onBrandTertiary },
  applyRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: space.sm,
    minHeight: 48,
    marginTop: space.md,
    paddingHorizontal: space.md,
    borderRadius: radius.md,
    backgroundColor: c.brandTertiary,
  },
  applyText: { flex: 1, fontFamily: fonts.bold, fontSize: 14, color: c.onBrandTertiary },
  summary: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "baseline",
    marginTop: space.xl,
    paddingTop: space.lg,
    paddingHorizontal: space.xs,
    borderTopWidth: 1,
    borderTopColor: c.divider,
  },
  summaryLabel: { fontFamily: fonts.medium, fontSize: 15, color: c.muted },
  summaryValue: { fontFamily: fonts.black, fontSize: 26, color: c.onSurface },
  cta: {
    height: 56,
    borderRadius: radius.pill,
    backgroundColor: c.brandPrimary,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: space.sm,
    marginTop: space.lg,
  },
  pressed: { opacity: 0.85, transform: [{ scale: 0.985 }] },
  ctaText: { fontFamily: fonts.bold, fontSize: 16, color: c.onBrandPrimary },
  badges: { marginTop: space.md, marginBottom: space.xs },
}));
