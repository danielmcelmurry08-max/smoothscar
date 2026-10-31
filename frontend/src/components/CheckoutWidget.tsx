import * as Haptics from "expo-haptics";
import { ArrowRight, Buildings, CheckCircle, CircleIcon as Circle, Lock, Repeat } from "phosphor-react-native";
import { Platform, Pressable, Text, View } from "react-native";

import { CLINIC_TIERS, formatSGD, PlanId, PRICING } from "../content";
import { fonts, radius, space } from "../fonts";
import { makeStyles, useTheme } from "../theme";
import { PayBadges } from "./PayBadges";
import { SectionHeader } from "./SectionHeader";

export type Selection = { plan: PlanId; qty: number };
type Props = { value: Selection; onChange: (s: Selection) => void; onProceed: () => void };

const tap = () => Platform.OS !== "web" && Haptics.selectionAsync();

export function CheckoutWidget({ value, onChange, onProceed }: Props) {
  const styles = useStyles();
  const { colors } = useTheme();
  const mode = value.plan === "clinic" ? "clinic" : "personal";
  const total = PRICING[value.plan].unit * value.qty;

  const Option = ({ plan, title, sub, price, priceNote, badge }: { plan: PlanId; title: string; sub: string; price: string; priceNote: string; badge?: string }) => {
    const selected = value.plan === plan;
    return (
      <Pressable
        testID={`plan-option-${plan}`}
        role="radio"
        aria-checked={selected}
        onPress={() => {
          tap();
          onChange({ plan, qty: 1 });
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
              onChange({ plan: "subscribe", qty: 1 });
            }}
            style={[styles.tab, mode === "personal" && styles.tabActive]}
          >
            <Repeat size={16} color={mode === "personal" ? colors.onBrandPrimary : colors.muted} weight="bold" />
            <Text style={[styles.tabText, mode === "personal" && styles.tabTextActive]}>Subscribe & Save</Text>
          </Pressable>
          <Pressable
            testID="buy-tab-clinic"
            role="tab"
            aria-selected={mode === "clinic"}
            onPress={() => {
              tap();
              onChange({ plan: "clinic", qty: CLINIC_TIERS[0] });
            }}
            style={[styles.tab, mode === "clinic" && styles.tabActive]}
          >
            <Buildings size={16} color={mode === "clinic" ? colors.onBrandPrimary : colors.muted} weight="bold" />
            <Text style={[styles.tabText, mode === "clinic" && styles.tabTextActive]}>Clinic & Multi-Pack</Text>
          </Pressable>
        </View>

        {mode === "personal" ? (
          <View style={styles.body}>
            <Text style={styles.heading}>Continuous Scar Care</Text>
            <Text style={styles.desc}>6–8 week recommended regimen. Most users complete 2 boxes.</Text>
            <View style={styles.options} role="radiogroup">
              <Option plan="subscribe" title="Subscribe & Save" sub={PRICING.subscribe.note} price={formatSGD(PRICING.subscribe.unit)} priceNote="/ 4 weeks" badge="SAVE 10%" />
              <Option plan="one_time" title="One-time purchase" sub={PRICING.one_time.note} price={formatSGD(PRICING.one_time.unit)} priceNote="/ box" />
            </View>
          </View>
        ) : (
          <View style={styles.body}>
            <Text style={styles.heading}>Clinic & Multi-Pack Program</Text>
            <Text style={styles.desc}>Provider partner pricing for clinics, aesthetic practices and multi-pack buyers.</Text>
            <View style={styles.tiers} role="radiogroup">
              {CLINIC_TIERS.map((q) => {
                const selected = value.qty === q;
                return (
                  <Pressable
                    key={q}
                    testID={`clinic-tier-${q}`}
                    role="radio"
                    aria-checked={selected}
                    onPress={() => {
                      tap();
                      onChange({ plan: "clinic", qty: q });
                    }}
                    style={[styles.tier, selected && styles.optionActive]}
                  >
                    <Text style={styles.tierQty}>{q}</Text>
                    <Text style={styles.tierLabel}>boxes</Text>
                    <Text style={styles.tierPrice}>{formatSGD(PRICING.clinic.unit * q)}</Text>
                  </Pressable>
                );
              })}
            </View>
            <View style={styles.partnerRow}>
              <Text style={styles.partnerText}>{formatSGD(PRICING.clinic.unit)} per box</Text>
              <Text style={styles.strike}>{formatSGD(PRICING.one_time.unit)}</Text>
              <Text style={styles.partnerSave}>Save {Math.round((1 - PRICING.clinic.unit / PRICING.one_time.unit) * 100)}%</Text>
            </View>
          </View>
        )}

        <View style={styles.summary}>
          <Text style={styles.summaryLabel}>Total today</Text>
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
