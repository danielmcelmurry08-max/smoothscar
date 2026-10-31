import { useRouter } from "expo-router";
import { ArrowLeft, EnvelopeSimple, Phone, SignOut } from "phosphor-react-native";
import { useState } from "react";
import { ActivityIndicator, FlatList, Linking, Pressable, RefreshControl, Text, TextInput, View } from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-controller";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { AdminApplication, getAdminApplications } from "@/src/api";
import { fonts, MAX_WIDTH, radius, space } from "@/src/fonts";
import { makeStyles, useTheme } from "@/src/theme";

export default function Admin() {
  const styles = useStyles();
  const { colors } = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [passcode, setPasscode] = useState("");
  const [authed, setAuthed] = useState<string | null>(null);
  const [apps, setApps] = useState<AdminApplication[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const load = async (code: string) => {
    setError("");
    setLoading(true);
    try {
      setApps(await getAdminApplications(code));
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
        <Text style={styles.headerTitle}>Provider applications</Text>
        {authed ? (
          <Pressable testID="admin-logout-button" onPress={() => { setAuthed(null); setApps([]); setPasscode(""); }} style={styles.iconBtn}>
            <SignOut size={20} color={colors.muted} weight="bold" />
          </Pressable>
        ) : null}
      </View>
    </View>
  );

  if (!authed) {
    return (
      <View style={styles.root} testID="admin-login-screen">
        {header}
        <KeyboardAwareScrollView contentContainerStyle={styles.loginWrap} keyboardShouldPersistTaps="handled">
          <View style={styles.column}>
            <Text style={styles.title}>Team access</Text>
            <Text style={styles.body}>Enter the team passcode to view provider partner applications.</Text>
            <TextInput
              testID="admin-passcode-input"
              value={passcode}
              onChangeText={(t) => { setPasscode(t); if (error) setError(""); }}
              placeholder="Passcode"
              placeholderTextColor={colors.muted}
              secureTextEntry
              autoCapitalize="characters"
              returnKeyType="go"
              onSubmitEditing={() => passcode && load(passcode.trim())}
              style={[styles.input, error ? styles.inputError : null]}
            />
            {error ? <Text style={styles.error} testID="admin-error">{error}</Text> : null}
            <Pressable testID="admin-login-button" disabled={!passcode || loading} onPress={() => load(passcode.trim())} style={[styles.cta, (!passcode || loading) && styles.disabled]}>
              {loading ? <ActivityIndicator color={colors.onBrandPrimary} /> : <Text style={styles.ctaText}>View applications</Text>}
            </Pressable>
          </View>
        </KeyboardAwareScrollView>
      </View>
    );
  }

  return (
    <View style={styles.root} testID="admin-applications-screen">
      {header}
      <FlatList
        data={apps}
        keyExtractor={(a) => a.id}
        contentContainerStyle={[styles.list, { paddingBottom: insets.bottom + space.xl }]}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={() => load(authed)} tintColor={colors.brandPrimary} />}
        ListHeaderComponent={<Text style={styles.count} testID="admin-count">{apps.length} application{apps.length === 1 ? "" : "s"}</Text>}
        ListEmptyComponent={<Text style={styles.body}>No applications yet.</Text>}
        renderItem={({ item }) => (
          <View style={styles.card} testID={`admin-application-${item.id}`}>
            <View style={styles.cardHead}>
              <Text style={styles.cardTitle}>{item.clinic_name}</Text>
              <Text style={styles.date}>{new Date(item.created_at).toLocaleDateString("en-SG", { day: "numeric", month: "short" })}</Text>
            </View>
            {item.credentials ? <Text style={styles.meta}>Credentials: {item.credentials}</Text> : null}
            {[item.contact_name, item.role, item.location, item.practice_type, item.monthly_volume].filter(Boolean).length ? (
              <Text style={styles.meta}>{[item.contact_name, item.role, item.location, item.practice_type, item.monthly_volume].filter(Boolean).join(" · ")}</Text>
            ) : null}
            {item.message ? <Text style={styles.message}>{item.message}</Text> : null}
            <View style={styles.actions}>
              <Pressable onPress={() => Linking.openURL(`mailto:${item.email}`)} style={styles.action} testID={`admin-email-${item.id}`}>
                <EnvelopeSimple size={16} color={colors.brandPrimary} weight="bold" />
                <Text style={styles.actionText} numberOfLines={1}>{item.email}</Text>
              </Pressable>
              <Pressable onPress={() => Linking.openURL(`tel:${item.phone.replace(/\s/g, "")}`)} style={styles.action} testID={`admin-phone-${item.id}`}>
                <Phone size={16} color={colors.brandPrimary} weight="bold" />
                <Text style={styles.actionText}>{item.phone}</Text>
              </Pressable>
            </View>
          </View>
        )}
      />
    </View>
  );
}

const useStyles = makeStyles((c) => ({
  root: { flex: 1, backgroundColor: c.surfaceSecondary },
  header: { backgroundColor: c.surface, borderBottomWidth: 1, borderBottomColor: c.border, paddingBottom: space.sm },
  headerInner: { width: "100%", maxWidth: MAX_WIDTH, alignSelf: "center", flexDirection: "row", alignItems: "center", paddingHorizontal: space.md, gap: space.sm },
  iconBtn: { width: 44, height: 44, alignItems: "center", justifyContent: "center" },
  headerTitle: { flex: 1, fontFamily: fonts.bold, fontSize: 17, color: c.onSurface },
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
  list: { padding: space.xl, gap: space.md, width: "100%", maxWidth: MAX_WIDTH, alignSelf: "center" },
  count: { fontFamily: fonts.bold, fontSize: 13, color: c.muted, textTransform: "uppercase", letterSpacing: 1 },
  card: { backgroundColor: c.surface, borderRadius: radius.lg, padding: space.lg, borderWidth: 1, borderColor: c.border },
  cardHead: { flexDirection: "row", justifyContent: "space-between", alignItems: "baseline", gap: space.sm },
  cardTitle: { flex: 1, fontFamily: fonts.bold, fontSize: 17, color: c.onSurface },
  date: { fontFamily: fonts.regular, fontSize: 12, color: c.muted },
  meta: { fontFamily: fonts.regular, fontSize: 14, lineHeight: 20, color: c.onSurfaceTertiary, marginTop: space.xs },
  message: { fontFamily: fonts.regular, fontSize: 14, lineHeight: 20, color: c.onSurface, marginTop: space.sm, backgroundColor: c.surfaceSecondary, padding: space.md, borderRadius: radius.md },
  actions: { gap: space.sm, marginTop: space.md },
  action: { minHeight: 44, flexDirection: "row", alignItems: "center", gap: space.xs + 2, paddingHorizontal: space.md, borderRadius: radius.md, backgroundColor: c.brandTertiary },
  actionText: { flex: 1, fontFamily: fonts.medium, fontSize: 13, color: c.onBrandTertiary },
}));
