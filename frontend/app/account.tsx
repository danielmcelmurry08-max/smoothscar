import { useQuery } from "@tanstack/react-query";
import * as AppleAuthentication from "expo-apple-authentication";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { ArrowLeft, CaretRight, GoogleLogo, Package, SignOut } from "phosphor-react-native";
import { useEffect, useState } from "react";
import { ActivityIndicator, Platform, Pressable, ScrollView, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { getMyAutoShips, getMyOrders, getMyReferral } from "@/src/api";
import { useAuth } from "@/src/auth";
import { AutoShipCard } from "@/src/components/AutoShipCard";
import { ReferralCard } from "@/src/components/ReferralCard";
import { formatSGD } from "@/src/content";
import { fonts, MAX_WIDTH, radius, space } from "@/src/fonts";
import { makeStyles, useTheme } from "@/src/theme";

function SignInPanel() {
  const styles = useStyles();
  const { colors } = useTheme();
  const { signInWithGoogle, signInWithApple, authError, clearAuthError } = useAuth();
  const [appleAvailable, setAppleAvailable] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const shownError = error || authError;

  useEffect(() => {
    if (Platform.OS === "ios") AppleAuthentication.isAvailableAsync().then(setAppleAvailable);
  }, []);

  const run = async (fn: () => Promise<void>) => {
    setError("");
    clearAuthError();
    setBusy(true);
    try {
      await fn();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Sign-in failed. Please try again.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <View style={styles.column} testID="account-sign-in">
      <Text style={styles.title} role="heading" aria-level={1}>Your BioRNA account</Text>
      <Text style={styles.body}>Sign in to see your orders and Auto-Ship, track your referral rewards, and check out faster.</Text>
      {appleAvailable ? (
        <AppleAuthentication.AppleAuthenticationButton
          testID="apple-sign-in-button"
          buttonType={AppleAuthentication.AppleAuthenticationButtonType.SIGN_IN}
          buttonStyle={AppleAuthentication.AppleAuthenticationButtonStyle.BLACK}
          cornerRadius={radius.pill}
          style={styles.appleBtn}
          onPress={() => run(signInWithApple)}
        />
      ) : null}
      <Pressable testID="google-sign-in-button" disabled={busy} onPress={() => run(signInWithGoogle)} style={({ pressed }) => [styles.googleBtn, (pressed || busy) && styles.pressed]}>
        {busy ? <ActivityIndicator color={colors.onSurface} /> : (
          <>
            <GoogleLogo size={20} color={colors.onSurface} weight="bold" />
            <Text style={styles.googleText}>Continue with Google</Text>
          </>
        )}
      </Pressable>
      {shownError ? <Text style={styles.error} testID="account-sign-in-error">{shownError}</Text> : null}
      <Text style={styles.note}>No account needed to buy — guest checkout is always available.</Text>
    </View>
  );
}

function AccountPanel() {
  const styles = useStyles();
  const { colors } = useTheme();
  const router = useRouter();
  const { user, signOut } = useAuth();
  const orders = useQuery({ queryKey: ["my-orders", user?.user_id], queryFn: getMyOrders });
  const referral = useQuery({ queryKey: ["my-referral", user?.user_id], queryFn: getMyReferral });
  const autoShipKey = ["my-autoships", user?.user_id] as const;
  const autoShips = useQuery({ queryKey: autoShipKey, queryFn: getMyAutoShips });

  return (
    <View style={styles.column} testID="account-panel">
      <View style={styles.profile}>
        {user?.picture ? <Image source={{ uri: user.picture }} style={styles.avatar} /> : (
          <View style={[styles.avatar, styles.avatarFallback]}>
            <Text style={styles.avatarText}>{(user?.name || user?.email || "B")[0].toUpperCase()}</Text>
          </View>
        )}
        <View style={styles.flex}>
          <Text style={styles.name} testID="account-name">{user?.name || "BioRNA customer"}</Text>
          {user?.email ? <Text style={styles.email} testID="account-email">{user.email}</Text> : null}
        </View>
        <Pressable testID="account-sign-out-button" onPress={signOut} style={styles.iconBtn} hitSlop={6}>
          <SignOut size={20} color={colors.muted} weight="bold" />
        </Pressable>
      </View>

      {autoShips.isLoading ? <ActivityIndicator style={styles.loader} color={colors.brandPrimary} testID="account-autoship-loading" /> : null}
      {autoShips.isError ? (
        <Pressable onPress={() => autoShips.refetch()} testID="account-autoship-retry" style={styles.order}>
          <Text style={styles.orderMeta}>Couldn&apos;t load your Auto-Ship. Tap to retry.</Text>
        </Pressable>
      ) : null}
      {autoShips.data?.length ? (
        <View testID="account-autoship">
          <Text style={[styles.sectionLabel, styles.ordersLabel]}>Manage Auto-Ship</Text>
          {autoShips.data.map((p) => (
            <AutoShipCard key={p.id} plan={p} queryKey={autoShipKey} />
          ))}
        </View>
      ) : null}

      {referral.data ? <ReferralCard code={referral.data.code} /> : null}
      {referral.data?.reward_codes?.filter((r) => !r.used).map((r) => (
        <View key={r.code} style={styles.reward} testID={`account-reward-${r.code}`}>
          <Text style={styles.rewardText}>Free box code: <Text style={styles.rewardCode}>{r.code}</Text></Text>
        </View>
      ))}

      <Text style={[styles.sectionLabel, styles.ordersLabel]}>My orders</Text>
      {orders.isLoading ? <ActivityIndicator color={colors.brandPrimary} /> : orders.data?.length ? (
        orders.data.map((o) => (
          <Pressable key={o.id} testID={`account-order-${o.id}`} onPress={() => router.push({ pathname: "/order/[id]", params: { id: o.id } })} style={styles.order}>
            <Package size={22} color={colors.brandPrimary} weight="duotone" />
            <View style={styles.flex}>
              <Text style={styles.orderTitle}>{o.order_number}</Text>
              <Text style={styles.orderMeta}>
                {new Date(o.created_at).toLocaleDateString("en-SG", { day: "numeric", month: "short", year: "numeric" })} · {o.quantity} box{o.quantity > 1 ? "es" : ""} · {formatSGD(o.total)}
              </Text>
            </View>
            <CaretRight size={16} color={colors.muted} weight="bold" />
          </Pressable>
        ))
      ) : (
        <Text style={styles.body} testID="account-no-orders">No orders yet. Orders placed with {user?.email || "your email"} will show up here.</Text>
      )}
    </View>
  );
}

export default function Account() {
  const styles = useStyles();
  const { colors } = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user, loading } = useAuth();

  return (
    <View style={styles.root} testID="account-screen">
      <View style={[styles.header, { paddingTop: insets.top + space.sm }]}>
        <View style={styles.headerInner}>
          <Pressable testID="account-back-button" onPress={() => (router.canGoBack() ? router.back() : router.replace("/"))} style={styles.iconBtn} hitSlop={8}>
            <ArrowLeft size={22} color={colors.onSurface} weight="bold" />
          </Pressable>
          <Text style={styles.headerTitle}>Account</Text>
        </View>
      </View>
      <ScrollView contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + space.xl }]}>
        {loading ? <ActivityIndicator style={styles.loader} color={colors.brandPrimary} testID="account-loading" /> : user ? <AccountPanel /> : <SignInPanel />}
      </ScrollView>
    </View>
  );
}

const useStyles = makeStyles((c) => ({
  root: { flex: 1, backgroundColor: c.surfaceSecondary },
  header: { backgroundColor: c.surface, borderBottomWidth: 1, borderBottomColor: c.border, paddingBottom: space.sm },
  headerInner: { width: "100%", maxWidth: MAX_WIDTH, alignSelf: "center", flexDirection: "row", alignItems: "center", paddingHorizontal: space.md, gap: space.sm },
  iconBtn: { width: 44, height: 44, alignItems: "center", justifyContent: "center" },
  headerTitle: { flex: 1, fontFamily: fonts.bold, fontSize: 17, color: c.onSurface },
  scroll: { padding: space.xl },
  loader: { marginTop: space.xxxl },
  column: { width: "100%", maxWidth: MAX_WIDTH, alignSelf: "center" },
  flex: { flex: 1 },
  title: { fontFamily: fonts.black, fontSize: 28, letterSpacing: -0.6, color: c.onSurface, marginTop: space.lg },
  body: { fontFamily: fonts.regular, fontSize: 15, lineHeight: 22, color: c.muted, marginTop: space.sm, marginBottom: space.xl },
  appleBtn: { width: "100%", height: 52, marginBottom: space.md },
  googleBtn: { height: 52, borderRadius: radius.pill, borderWidth: 1.5, borderColor: c.borderStrong, backgroundColor: c.surface, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: space.sm },
  googleText: { fontFamily: fonts.bold, fontSize: 16, color: c.onSurface },
  pressed: { opacity: 0.8 },
  error: { fontFamily: fonts.medium, fontSize: 13, color: c.error, marginTop: space.md, textAlign: "center" },
  note: { fontFamily: fonts.regular, fontSize: 13, color: c.muted, marginTop: space.xl, textAlign: "center" },
  profile: { flexDirection: "row", alignItems: "center", gap: space.md, backgroundColor: c.surface, borderRadius: radius.lg, padding: space.lg, borderWidth: 1, borderColor: c.border },
  avatar: { width: 52, height: 52, borderRadius: radius.pill },
  avatarFallback: { backgroundColor: c.brandPrimary, alignItems: "center", justifyContent: "center" },
  avatarText: { fontFamily: fonts.black, fontSize: 20, color: c.onBrandPrimary },
  name: { fontFamily: fonts.bold, fontSize: 17, color: c.onSurface },
  email: { fontFamily: fonts.regular, fontSize: 13, color: c.muted, marginTop: 2 },
  sectionLabel: { fontFamily: fonts.bold, fontSize: 12, letterSpacing: 1.2, textTransform: "uppercase", color: c.muted },
  ordersLabel: { marginTop: space.xl, marginBottom: space.md },
  autoShip: { marginTop: space.xl, backgroundColor: c.brandTertiary, borderRadius: radius.lg, padding: space.lg, gap: space.xs },
  autoText: { fontFamily: fonts.medium, fontSize: 14, color: c.onBrandTertiary },
  reward: { marginTop: space.md, backgroundColor: c.surface, borderRadius: radius.md, padding: space.lg, borderWidth: 1.5, borderColor: c.success },
  rewardText: { fontFamily: fonts.medium, fontSize: 14, color: c.onSurface },
  rewardCode: { fontFamily: fonts.black, letterSpacing: 1.5, color: c.success },
  order: { flexDirection: "row", alignItems: "center", gap: space.md, backgroundColor: c.surface, borderRadius: radius.md, padding: space.lg, borderWidth: 1, borderColor: c.border, marginBottom: space.sm, minHeight: 64 },
  orderTitle: { fontFamily: fonts.bold, fontSize: 15, color: c.onSurface },
  orderMeta: { fontFamily: fonts.regular, fontSize: 13, color: c.muted, marginTop: 2 },
}));
