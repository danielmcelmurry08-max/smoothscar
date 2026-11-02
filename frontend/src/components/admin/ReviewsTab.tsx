import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { ActivityIndicator, FlatList, Pressable, RefreshControl, Text, View } from "react-native";

import { AdminReview, decideReview, getAdminReviews, getAdminViewToken, photoUrl, ReviewStatus } from "../../api";
import { fonts, radius, space } from "../../fonts";
import { makeStyles, useTheme } from "../../theme";
import { ReviewPhotos } from "../ReviewPhotos";
import { Stars } from "../Stars";
import { useAdminStyles } from "./shared";

const FILTERS: { id: ReviewStatus | "all"; label: string }[] = [
  { id: "pending", label: "Waiting" },
  { id: "approved", label: "Live" },
  { id: "rejected", label: "Hidden" },
  { id: "all", label: "All" },
];

export function ReviewsTab({ passcode }: { passcode: string }) {
  const styles = useAdminStyles();
  const own = useStyles();
  const { colors } = useTheme();
  const qc = useQueryClient();
  const [filter, setFilter] = useState<ReviewStatus | "all">("pending");
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState("");
  const { data = [], isLoading, isFetching, refetch } = useQuery({
    queryKey: ["admin-reviews", passcode, filter],
    queryFn: () => getAdminReviews(passcode, filter),
  });

  const { data: view } = useQuery({ queryKey: ["admin-view-token", passcode], queryFn: () => getAdminViewToken(passcode), staleTime: 30 * 60_000 });
  const viewQuery = view ? { admin_token: view.token } : undefined;

  const decide = async (r: AdminReview, status: ReviewStatus) => {
    setError("");
    setBusy(r.id);
    try {
      await decideReview(passcode, r.id, status);
      await Promise.all([qc.invalidateQueries({ queryKey: ["admin-reviews"] }), qc.invalidateQueries({ queryKey: ["reviews"] })]);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setBusy(null);
    }
  };

  return (
    <FlatList
      data={isLoading ? [] : data}
      keyExtractor={(r) => r.id}
      contentContainerStyle={styles.list}
      refreshControl={<RefreshControl refreshing={isFetching && !isLoading} onRefresh={() => { refetch(); }} tintColor={colors.brandPrimary} />}
      ListHeaderComponent={
        <View style={{ gap: space.md }}>
          <View style={styles.chips}>
            {FILTERS.map((f) => (
              <Pressable key={f.id} testID={`admin-reviews-filter-${f.id}`} onPress={() => setFilter(f.id)} style={[styles.chip, filter === f.id && styles.chipActive]}>
                <Text style={[styles.chipText, filter === f.id && styles.chipTextActive]}>{f.label}</Text>
              </Pressable>
            ))}
          </View>
          {error ? <Text style={styles.error}>{error}</Text> : null}
          {isLoading ? <ActivityIndicator color={colors.brandPrimary} /> : null}
        </View>
      }
      ListEmptyComponent={isLoading ? undefined : <Text style={styles.body}>No reviews here.</Text>}
      renderItem={({ item }) => (
        <View style={styles.card} testID={`admin-review-${item.id}`}>
          <View style={styles.cardHead}>
            <Stars value={item.rating} size={16} />
            <Text style={[own.status, item.status === "approved" ? own.live : item.status === "rejected" ? own.hidden : own.waiting]}>
              {item.status === "approved" ? "Live" : item.status === "rejected" ? "Hidden" : "Waiting"}
            </Text>
          </View>
          {item.title ? <Text style={[styles.cardTitle, { marginTop: space.sm }]}>{item.title}</Text> : null}
          <Text style={styles.message}>{item.body}</Text>
          {viewQuery && (item.before_photo_url || item.after_photo_url) ? (
            <View style={{ marginTop: space.sm }}>
              <ReviewPhotos before={photoUrl(item.before_photo_url, viewQuery)} after={photoUrl(item.after_photo_url, viewQuery)} />
            </View>
          ) : null}
          {item.reward_code ? (
            <Text style={styles.meta} testID={`admin-review-code-${item.id}`}>
              25% code {item.reward_code}
              {item.reward_email_status === "sent" ? " · emailed" : item.reward_email_status === "sending" ? " · sending email…" : " · email not delivered"}
            </Text>
          ) : null}
          <Text style={styles.meta}>
            {item.display_name}
            {item.scar_type ? ` · ${item.scar_type}` : ""} · {item.order_number}
          </Text>
          <Text style={styles.meta}>{item.customer_email} · {new Date(item.created_at).toLocaleDateString("en-SG", { day: "numeric", month: "short", year: "numeric" })}</Text>
          <View style={own.row}>
            {item.status !== "approved" ? (
              <Pressable testID={`admin-review-approve-${item.id}`} disabled={busy === item.id} onPress={() => decide(item, "approved")} style={[own.btn, own.approve]}>
                {busy === item.id ? <ActivityIndicator color={colors.onSuccess} /> : <Text style={own.approveText}>Approve</Text>}
              </Pressable>
            ) : null}
            {item.status !== "rejected" ? (
              <Pressable testID={`admin-review-reject-${item.id}`} disabled={busy === item.id} onPress={() => decide(item, "rejected")} style={[own.btn, own.reject]}>
                <Text style={own.rejectText}>{item.status === "approved" ? "Take down" : "Hide"}</Text>
              </Pressable>
            ) : null}
          </View>
        </View>
      )}
    />
  );
}

const useStyles = makeStyles((c) => ({
  status: { fontFamily: fonts.bold, fontSize: 11, letterSpacing: 0.6, textTransform: "uppercase", paddingHorizontal: space.sm, paddingVertical: 2, borderRadius: radius.sm, overflow: "hidden" },
  live: { backgroundColor: c.success, color: c.onSuccess },
  hidden: { backgroundColor: c.surfaceTertiary, color: c.onSurfaceTertiary },
  waiting: { backgroundColor: c.warning, color: c.onWarning },
  row: { flexDirection: "row", gap: space.sm, marginTop: space.md },
  btn: { flex: 1, height: 44, borderRadius: radius.pill, alignItems: "center", justifyContent: "center" },
  approve: { backgroundColor: c.success },
  approveText: { fontFamily: fonts.bold, fontSize: 14, color: c.onSuccess },
  reject: { borderWidth: 1.5, borderColor: c.border, backgroundColor: c.surface },
  rejectText: { fontFamily: fonts.bold, fontSize: 14, color: c.onSurfaceTertiary },
}));
