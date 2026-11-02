import { useMutation, useQueryClient } from "@tanstack/react-query";
import * as Haptics from "expo-haptics";
import { CalendarBlank, FastForward, Pause, Play, XCircle } from "phosphor-react-native";
import { useState } from "react";
import { ActivityIndicator, Platform, Pressable, Text, View } from "react-native";

import { AutoShip, updateAutoShip } from "../api";
import { formatSGD, SUB_TIERS } from "../content";
import { fonts, radius, space } from "../fonts";
import { makeStyles, useTheme } from "../theme";

type Action = "pause" | "resume" | "skip" | "change_qty" | "cancel";

const fmtDate = (iso: string) => new Date(iso).toLocaleDateString("en-SG", { weekday: "short", day: "numeric", month: "short" });

export function AutoShipCard({ plan, queryKey }: { plan: AutoShip; queryKey: readonly unknown[] }) {
  const styles = useStyles();
  const { colors } = useTheme();
  const qc = useQueryClient();
  const [confirmCancel, setConfirmCancel] = useState(false);
  const [notice, setNotice] = useState("");
  const [noticeIsError, setNoticeIsError] = useState(false);
  const [pending, setPending] = useState<Action | null>(null);

  const m = useMutation({
    mutationFn: ({ action, qty }: { action: Action; qty?: number }) => updateAutoShip(plan.id, action, qty),
    onMutate: ({ action }) => {
      setPending(action);
      setNotice("");
      setNoticeIsError(false);
    },
    onSuccess: (updated, { action }) => {
      if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      qc.setQueryData<AutoShip[]>(queryKey, (old) => old?.map((p) => (p.id === updated.id ? updated : p)));
      qc.invalidateQueries({ queryKey: ["my-orders"] });
      setNotice(
        action === "skip" ? `Skipped — next shipment ${updated.next_ship_date ? fmtDate(updated.next_ship_date) : ""}`
          : action === "pause" ? "Auto-Ship paused. Resume anytime."
            : action === "resume" ? "Auto-Ship resumed."
              : action === "cancel" ? "Auto-Ship cancelled."
                : `Now ${updated.quantity} boxes per shipment.`,
      );
      setConfirmCancel(false);
    },
    onError: (e) => {
      setNotice(e instanceof Error ? e.message : "Something went wrong");
      setNoticeIsError(true);
      qc.invalidateQueries({ queryKey });
    },
    onSettled: () => setPending(null),
  });

  const act = (action: Action, qty?: number) => m.mutate({ action, qty });
  const status = plan.status;
  const statusStyle = status === "active" ? styles.pillActive : status === "paused" ? styles.pillPaused : styles.pillCancelled;
  const busy = (a: Action) => pending === a;

  return (
    <View style={styles.card} testID={`autoship-card-${plan.id}`}>
      <View style={styles.head}>
        <View style={styles.flex}>
          <Text style={styles.title}>Auto-Ship · every 2 weeks</Text>
          <Text style={styles.meta}>{plan.order_number}{status !== "cancelled" ? ` · ${formatSGD(plan.per_shipment)} per shipment` : ""}</Text>
        </View>
        <View style={[styles.pill, statusStyle]} testID={`autoship-status-${plan.id}`}>
          <Text style={styles.pillText}>{status === "active" ? "Active" : status === "paused" ? "Paused" : "Cancelled"}</Text>
        </View>
      </View>

      {status === "active" && plan.next_ship_date ? (
        <View style={styles.nextRow}>
          <CalendarBlank size={18} color={colors.brandPrimary} weight="bold" />
          <Text style={styles.nextText} testID={`autoship-next-${plan.id}`}>Next shipment: {fmtDate(plan.next_ship_date)}</Text>
        </View>
      ) : null}

      {status !== "cancelled" ? (
        <>
          <Text style={styles.label}>Boxes per shipment</Text>
          <View style={styles.qtyRow}>
            {SUB_TIERS.map((q) => {
              const sel = plan.quantity === q;
              return (
                <Pressable
                  key={q}
                  testID={`autoship-change-qty-${q}-${plan.id}`}
                  disabled={sel || !!pending}
                  onPress={() => act("change_qty", q)}
                  style={[styles.qty, sel && styles.qtyActive]}
                >
                  {busy("change_qty") && !sel ? <ActivityIndicator color={colors.brandPrimary} /> : (
                    <Text style={[styles.qtyText, sel && styles.qtyTextActive]}>{q} boxes · {formatSGD(q * plan.unit_price)}</Text>
                  )}
                </Pressable>
              );
            })}
          </View>

          <View style={styles.actions}>
            {status === "active" ? (
              <Pressable testID={`autoship-skip-${plan.id}`} disabled={!!pending} onPress={() => act("skip")} style={styles.action}>
                {busy("skip") ? <ActivityIndicator color={colors.brandPrimary} /> : <FastForward size={18} color={colors.brandPrimary} weight="bold" />}
                <Text style={styles.actionText}>Skip next</Text>
              </Pressable>
            ) : null}
            <Pressable
              testID={`autoship-${status === "active" ? "pause" : "resume"}-${plan.id}`}
              disabled={!!pending}
              onPress={() => act(status === "active" ? "pause" : "resume")}
              style={styles.action}
            >
              {busy("pause") || busy("resume") ? <ActivityIndicator color={colors.brandPrimary} /> : status === "active" ? (
                <Pause size={18} color={colors.brandPrimary} weight="bold" />
              ) : (
                <Play size={18} color={colors.brandPrimary} weight="bold" />
              )}
              <Text style={styles.actionText}>{status === "active" ? "Pause" : "Resume"}</Text>
            </Pressable>
          </View>

          {confirmCancel ? (
            <View style={styles.confirm} testID={`autoship-cancel-confirm-${plan.id}`}>
              <Text style={styles.confirmText}>Cancel this Auto-Ship? You can always start a new one later.</Text>
              <View style={styles.confirmRow}>
                <Pressable testID={`autoship-cancel-keep-${plan.id}`} onPress={() => setConfirmCancel(false)} style={[styles.confirmBtn, styles.keepBtn]}>
                  <Text style={styles.keepText}>Keep it</Text>
                </Pressable>
                <Pressable testID={`autoship-cancel-yes-${plan.id}`} disabled={!!pending} onPress={() => act("cancel")} style={[styles.confirmBtn, styles.cancelBtn]}>
                  {busy("cancel") ? <ActivityIndicator color={colors.onError} /> : <Text style={styles.cancelText}>Yes, cancel</Text>}
                </Pressable>
              </View>
            </View>
          ) : (
            <Pressable testID={`autoship-cancel-${plan.id}`} onPress={() => { setNotice(""); setConfirmCancel(true); }} style={styles.cancelLink}>
              <XCircle size={16} color={colors.muted} weight="bold" />
              <Text style={styles.cancelLinkText}>Cancel Auto-Ship</Text>
            </Pressable>
          )}
        </>
      ) : null}

      {notice ? <Text style={[styles.notice, noticeIsError && styles.noticeError]} testID={`autoship-notice-${plan.id}`}>{notice}</Text> : null}
    </View>
  );
}

const useStyles = makeStyles((c) => ({
  card: { marginTop: space.md, backgroundColor: c.surface, borderRadius: radius.lg, padding: space.lg, borderWidth: 1, borderColor: c.border },
  head: { flexDirection: "row", alignItems: "flex-start", gap: space.md },
  flex: { flex: 1 },
  title: { fontFamily: fonts.bold, fontSize: 16, color: c.onSurface },
  meta: { fontFamily: fonts.regular, fontSize: 13, color: c.muted, marginTop: 2 },
  pill: { height: 26, paddingHorizontal: space.md, borderRadius: radius.pill, justifyContent: "center" },
  pillActive: { backgroundColor: c.success },
  pillPaused: { backgroundColor: c.warning },
  pillCancelled: { backgroundColor: c.muted },
  pillText: { fontFamily: fonts.bold, fontSize: 12, color: c.onSuccess },
  nextRow: { flexDirection: "row", alignItems: "center", gap: space.sm, marginTop: space.md, backgroundColor: c.brandTertiary, borderRadius: radius.md, paddingHorizontal: space.md, minHeight: 44 },
  nextText: { fontFamily: fonts.bold, fontSize: 14, color: c.onBrandTertiary },
  label: { fontFamily: fonts.medium, fontSize: 13, color: c.onSurfaceTertiary, marginTop: space.lg, marginBottom: space.sm },
  qtyRow: { flexDirection: "row", gap: space.sm },
  qty: { flex: 1, height: 48, borderRadius: radius.md, borderWidth: 1.5, borderColor: c.border, alignItems: "center", justifyContent: "center" },
  qtyActive: { borderColor: c.brandPrimary, backgroundColor: c.brandTertiary },
  qtyText: { fontFamily: fonts.bold, fontSize: 14, color: c.muted },
  qtyTextActive: { color: c.onBrandTertiary },
  actions: { flexDirection: "row", gap: space.sm, marginTop: space.md },
  action: { flex: 1, height: 48, borderRadius: radius.pill, borderWidth: 1.5, borderColor: c.brandPrimary, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: space.sm },
  actionText: { fontFamily: fonts.bold, fontSize: 14, color: c.brandPrimary },
  cancelLink: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: space.xs + 2, minHeight: 44, marginTop: space.sm },
  cancelLinkText: { fontFamily: fonts.medium, fontSize: 13, color: c.muted },
  confirm: { marginTop: space.md, backgroundColor: c.surfaceSecondary, borderRadius: radius.md, padding: space.md },
  confirmText: { fontFamily: fonts.medium, fontSize: 14, lineHeight: 20, color: c.onSurface },
  confirmRow: { flexDirection: "row", gap: space.sm, marginTop: space.md },
  confirmBtn: { flex: 1, height: 44, borderRadius: radius.pill, alignItems: "center", justifyContent: "center" },
  keepBtn: { backgroundColor: c.surface, borderWidth: 1, borderColor: c.border },
  keepText: { fontFamily: fonts.bold, fontSize: 14, color: c.onSurface },
  cancelBtn: { backgroundColor: c.error },
  cancelText: { fontFamily: fonts.bold, fontSize: 14, color: c.onError },
  notice: { fontFamily: fonts.medium, fontSize: 13, color: c.success, marginTop: space.md, textAlign: "center" },
  noticeError: { color: c.error },
}));
