import { useQuery } from "@tanstack/react-query";
import { useLocalSearchParams, useRouter } from "expo-router";
import { CheckCircle, EnvelopeSimple } from "phosphor-react-native";
import { ActivityIndicator, Pressable, ScrollView, Text, View } from "react-native";
import Animated, { ZoomIn } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { getOrder } from "@/src/api";
import { CONTACT_EMAIL, formatSGD } from "@/src/content";
import { fonts, MAX_WIDTH, radius, space } from "@/src/fonts";
import { makeStyles, useTheme } from "@/src/theme";

const PAY_LABEL: Record<string, string> = { apple_pay: "Apple Pay", google_pay: "Google Pay", card: "Card" };

export default function OrderConfirmation() {
  const styles = useStyles();
  const { colors } = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data, isLoading, isError, refetch } = useQuery({ queryKey: ["order", id], queryFn: () => getOrder(id), retry: false });

  if (isLoading) {
    return (
      <View style={[styles.root, styles.center]} testID="order-loading">
        <ActivityIndicator color={colors.brandPrimary} />
      </View>
    );
  }
  if (isError || !data) {
    return (
      <View style={[styles.root, styles.center]}>
        <Text style={styles.body}>We couldn&apos;t load your order.</Text>
        <Pressable onPress={() => refetch()} style={styles.secondary} testID="order-retry-button">
          <Text style={styles.secondaryText}>Tap to retry</Text>
        </Pressable>
        <Pressable onPress={() => router.replace("/")} style={styles.secondary} testID="order-error-home-button">
          <Text style={styles.secondaryText}>Back to home</Text>
        </Pressable>
      </View>
    );
  }

  const rows: [string, string][] = [
    ["Plan", data.plan_name],
    ...(data.interval ? ([["Delivery", data.interval]] as [string, string][]) : []),
    ["Quantity", `${data.quantity} box${data.quantity > 1 ? "es" : ""} × ${formatSGD(data.unit_price)}`],
    ["Payment", `${PAY_LABEL[data.payment_method]} (demo)`],
    ["Ship to", `${data.customer.full_name}, ${data.customer.address}, S${data.customer.postal_code}`],
  ];
  if (data.customer.clinic_name) rows.unshift(["Clinic", data.customer.clinic_name]);

  return (
    <View style={styles.root} testID="order-confirmation-screen">
      <ScrollView contentContainerStyle={[styles.scroll, { paddingTop: insets.top + space.xxl, paddingBottom: insets.bottom + space.xl }]}>
        <View style={styles.column}>
          <Animated.View entering={ZoomIn.springify()} style={styles.iconWrap}>
            <CheckCircle size={56} color={colors.success} weight="fill" />
          </Animated.View>
          <Text style={styles.title} role="heading" aria-level={1}>Order confirmed</Text>
          <Text style={styles.body}>Thank you, {data.customer.full_name.split(" ")[0]}. A confirmation will be sent to {data.customer.email}.</Text>
          <View style={styles.numberPill}>
            <Text style={styles.numberText} testID="order-number">{data.order_number}</Text>
          </View>

          <View style={styles.card} testID="order-details">
            {rows.map(([k, v]) => (
              <View key={k} style={styles.row}>
                <Text style={styles.rowKey}>{k}</Text>
                <Text style={styles.rowVal}>{v}</Text>
              </View>
            ))}
            <View style={[styles.row, styles.totalRow]}>
              <Text style={styles.totalKey}>Total paid</Text>
              <Text style={styles.totalVal} testID="order-total">{formatSGD(data.total)}</Text>
            </View>
          </View>

          <View style={styles.help}>
            <EnvelopeSimple size={18} color={colors.brandPrimary} />
            <Text style={styles.helpText}>Questions? {CONTACT_EMAIL}</Text>
          </View>

          <Pressable testID="back-home-button" onPress={() => router.replace("/")} style={({ pressed }) => [styles.cta, pressed && styles.pressed]}>
            <Text style={styles.ctaText}>Back to BioRNA Antiscar</Text>
          </Pressable>
        </View>
      </ScrollView>
    </View>
  );
}

const useStyles = makeStyles((c) => ({
  root: { flex: 1, backgroundColor: c.surfaceSecondary },
  center: { alignItems: "center", justifyContent: "center", padding: space.xl },
  scroll: { paddingHorizontal: space.xl },
  column: { width: "100%", maxWidth: MAX_WIDTH, alignSelf: "center", alignItems: "center" },
  iconWrap: { marginBottom: space.lg },
  title: { fontFamily: fonts.black, fontSize: 30, letterSpacing: -0.6, color: c.onSurface },
  body: { fontFamily: fonts.regular, fontSize: 15, lineHeight: 22, color: c.muted, textAlign: "center", marginTop: space.sm },
  numberPill: { marginTop: space.lg, backgroundColor: c.brandTertiary, borderRadius: radius.pill, paddingHorizontal: space.lg, height: 34, justifyContent: "center" },
  numberText: { fontFamily: fonts.bold, fontSize: 14, color: c.onBrandTertiary, letterSpacing: 0.6 },
  card: { width: "100%", backgroundColor: c.surface, borderRadius: radius.lg, padding: space.lg + 2, marginTop: space.xl, borderWidth: 1, borderColor: c.border },
  row: { flexDirection: "row", justifyContent: "space-between", gap: space.lg, paddingVertical: space.sm },
  rowKey: { fontFamily: fonts.regular, fontSize: 14, color: c.muted },
  rowVal: { flex: 1, fontFamily: fonts.medium, fontSize: 14, color: c.onSurface, textAlign: "right" },
  totalRow: { borderTopWidth: 1, borderTopColor: c.divider, marginTop: space.sm, paddingTop: space.md, alignItems: "baseline" },
  totalKey: { fontFamily: fonts.bold, fontSize: 15, color: c.onSurface },
  totalVal: { fontFamily: fonts.black, fontSize: 24, color: c.onSurface },
  help: { flexDirection: "row", alignItems: "center", gap: space.sm, marginTop: space.xl },
  helpText: { fontFamily: fonts.medium, fontSize: 14, color: c.onSurfaceTertiary },
  cta: { width: "100%", height: 56, borderRadius: radius.pill, backgroundColor: c.brandPrimary, alignItems: "center", justifyContent: "center", marginTop: space.xl },
  pressed: { opacity: 0.85 },
  ctaText: { fontFamily: fonts.bold, fontSize: 16, color: c.onBrandPrimary },
  secondary: { marginTop: space.lg, minHeight: 44, justifyContent: "center", paddingHorizontal: space.lg },
  secondaryText: { fontFamily: fonts.bold, fontSize: 15, color: c.brandPrimary },
}));
