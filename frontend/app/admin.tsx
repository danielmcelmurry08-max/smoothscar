import { useRouter } from "expo-router";
import { ArrowLeft, SignOut } from "phosphor-react-native";
import { useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-controller";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { getAdminPricing } from "@/src/api";
import { OrdersTab } from "@/src/components/admin/OrdersTab";
import { PartnersTab } from "@/src/components/admin/PartnersTab";
import { PricingTab } from "@/src/components/admin/PricingTab";
import { ProductsTab } from "@/src/components/admin/ProductsTab";
import { ReviewsTab } from "@/src/components/admin/ReviewsTab";
import { fonts, MAX_WIDTH, radius, space } from "@/src/fonts";
import { makeStyles, useTheme } from "@/src/theme";

type Tab = "orders" | "reviews" | "partners" | "pricing" | "products";
const TABS: { id: Tab; label: string }[] = [
  { id: "orders", label: "Orders" },
  { id: "reviews", label: "Reviews" },
  { id: "partners", label: "Partners" },
  { id: "pricing", label: "Pricing" },
  { id: "products", label: "Products" },
];

export default function Admin() {
  const styles = useStyles();
  const { colors } = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [passcode, setPasscode] = useState("");
  const [authed, setAuthed] = useState<string | null>(null);
  const [tab, setTab] = useState<Tab>("orders");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const login = async () => {
    const code = passcode.trim();
    if (!code) return;
    setError("");
    setLoading(true);
    try {
      await getAdminPricing(code);
      setAuthed(code);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const header = (
    <View style={[styles.header, { paddingTop: insets.top + space.sm }]}>
      <View style={styles.headerInner}>
        <Pressable testID="admin-back-button" onPress={() => (router.canGoBack() ? router.back() : router.replace("/"))} style={styles.iconBtn} hitSlop={8}>
          <ArrowLeft size={22} color={colors.onSurface} weight="bold" />
        </Pressable>
        <Text style={styles.headerTitle}>SmoothScar team portal</Text>
        {authed ? (
          <Pressable testID="admin-logout-button" onPress={() => { setAuthed(null); setPasscode(""); setTab("orders"); }} style={styles.iconBtn}>
            <SignOut size={20} color={colors.muted} weight="bold" />
          </Pressable>
        ) : null}
      </View>
      {authed ? (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabs} role="tablist">
          {TABS.map((t) => (
            <Pressable key={t.id} testID={`admin-tab-${t.id}`} role="tab" aria-selected={tab === t.id} onPress={() => setTab(t.id)} style={[styles.tab, tab === t.id && styles.tabActive]}>
              <Text style={[styles.tabText, tab === t.id && styles.tabTextActive]}>{t.label}</Text>
            </Pressable>
          ))}
        </ScrollView>
      ) : null}
    </View>
  );

  if (!authed) {
    return (
      <View style={styles.root} testID="admin-login-screen">
        {header}
        <KeyboardAwareScrollView contentContainerStyle={styles.loginWrap} keyboardShouldPersistTaps="handled">
          <View style={styles.column}>
            <Text style={styles.title}>Team access</Text>
            <Text style={styles.body}>Enter the portal password to manage orders, reviews, partner applications, pricing and products.</Text>
            <TextInput
              testID="admin-passcode-input"
              value={passcode}
              onChangeText={(t) => { setPasscode(t); if (error) setError(""); }}
              placeholder="Password"
              placeholderTextColor={colors.muted}
              secureTextEntry
              autoCapitalize="none"
              autoCorrect={false}
              returnKeyType="go"
              onSubmitEditing={login}
              style={[styles.input, error ? styles.inputError : null]}
            />
            {error ? <Text style={styles.error} testID="admin-error">{error}</Text> : null}
            <Pressable testID="admin-login-button" disabled={!passcode || loading} onPress={login} style={[styles.cta, (!passcode || loading) && styles.disabled]}>
              {loading ? <ActivityIndicator color={colors.onBrandPrimary} /> : <Text style={styles.ctaText}>Open dashboard</Text>}
            </Pressable>
          </View>
        </KeyboardAwareScrollView>
      </View>
    );
  }

  return (
    <View style={[styles.root, { paddingBottom: insets.bottom }]} testID="admin-dashboard-screen">
      {header}
      <View style={styles.content}>
        {tab === "orders" ? <OrdersTab passcode={authed} /> : null}
        {tab === "reviews" ? <ReviewsTab passcode={authed} /> : null}
        {tab === "partners" ? <PartnersTab passcode={authed} /> : null}
        {tab === "pricing" ? <PricingTab passcode={authed} /> : null}
        {tab === "products" ? <ProductsTab passcode={authed} /> : null}
      </View>
    </View>
  );
}

const useStyles = makeStyles((c) => ({
  root: { flex: 1, backgroundColor: c.surfaceSecondary },
  header: { backgroundColor: c.surface, borderBottomWidth: 1, borderBottomColor: c.border, paddingBottom: space.sm },
  headerInner: { width: "100%", maxWidth: MAX_WIDTH, alignSelf: "center", flexDirection: "row", alignItems: "center", paddingHorizontal: space.md, gap: space.sm },
  iconBtn: { width: 44, height: 44, alignItems: "center", justifyContent: "center" },
  headerTitle: { flex: 1, fontFamily: fonts.bold, fontSize: 17, color: c.onSurface },
  tabs: { gap: space.xs + 2, paddingHorizontal: space.lg, paddingTop: space.sm },
  tab: { minHeight: 44, paddingHorizontal: space.md + 2, borderRadius: radius.pill, alignItems: "center", justifyContent: "center", backgroundColor: c.surfaceSecondary },
  tabActive: { backgroundColor: c.brandPrimary },
  tabText: { fontFamily: fonts.bold, fontSize: 14, color: c.muted },
  tabTextActive: { color: c.onBrandPrimary },
  content: { flex: 1, width: "100%", maxWidth: MAX_WIDTH, alignSelf: "center" },
  loginWrap: { padding: space.xl, paddingTop: space.xxxl },
  column: { width: "100%", maxWidth: MAX_WIDTH, alignSelf: "center" },
  title: { fontFamily: fonts.black, fontSize: 26, color: c.onSurface },
  body: { fontFamily: fonts.regular, fontSize: 15, lineHeight: 22, color: c.muted, marginTop: space.sm, marginBottom: space.xl },
  input: { height: 52, borderRadius: radius.md, borderWidth: 1, borderColor: c.border, backgroundColor: c.surface, paddingHorizontal: space.lg, fontFamily: fonts.bold, fontSize: 16, color: c.onSurface },
  inputError: { borderColor: c.error },
  error: { fontFamily: fonts.medium, fontSize: 13, color: c.error, marginTop: space.xs },
  cta: { height: 56, borderRadius: radius.pill, backgroundColor: c.brandPrimary, alignItems: "center", justifyContent: "center", marginTop: space.lg },
  disabled: { opacity: 0.5 },
  ctaText: { fontFamily: fonts.bold, fontSize: 16, color: c.onBrandPrimary },
}));
