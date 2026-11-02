import { Text, View } from "react-native";

import { AdminStats } from "../../api";
import { formatSGD } from "../../content";
import { fonts, radius, space } from "../../fonts";
import { makeStyles } from "../../theme";

const hourLabel = (h: number) => `${h % 12 === 0 ? 12 : h % 12}${h < 12 ? "am" : "pm"}`;

function Bars({ title, rows }: { title: string; rows: { label: string; value: number; note?: string }[] }) {
  const styles = useStyles();
  const max = Math.max(1, ...rows.map((r) => r.value));
  return (
    <View style={styles.panel}>
      <Text style={styles.panelTitle}>{title}</Text>
      {rows.map((r) => (
        <View key={r.label} style={styles.barRow}>
          <Text style={styles.barLabel}>{r.label}</Text>
          <View style={styles.track}>
            <View style={[styles.fill, { width: `${(r.value / max) * 100}%` }]} />
          </View>
          <Text style={styles.barValue}>{r.value}{r.note ? ` · ${r.note}` : ""}</Text>
        </View>
      ))}
    </View>
  );
}

export function OrderStats({ stats }: { stats: AdminStats }) {
  const styles = useStyles();
  const tiles = [
    { label: "Orders", value: String(stats.orders) },
    { label: "Revenue", value: formatSGD(stats.revenue) },
    { label: "Boxes", value: String(stats.boxes) },
    { label: "Avg. order", value: formatSGD(stats.average_order) },
    { label: "Customers", value: String(stats.unique_customers) },
    { label: "Active Auto-Ships", value: String(stats.active_autoships) },
  ];
  return (
    <View style={{ gap: space.md }} testID="admin-order-stats">
      <View style={styles.tiles}>
        {tiles.map((t) => (
          <View key={t.label} style={styles.tile}>
            <Text style={styles.tileValue} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.6}>{t.value}</Text>
            <Text style={styles.tileLabel}>{t.label}</Text>
          </View>
        ))}
      </View>
      <Bars
        title="Shipping by region (from postal code)"
        rows={stats.by_region.map((r) => ({ label: r.region, value: r.orders, note: `${r.boxes} box${r.boxes === 1 ? "" : "es"}` }))}
      />
      <Bars title="Time of day ordered (SGT)" rows={stats.by_time_slot.map((s) => ({ label: s.slot, value: s.orders }))} />
      <View style={styles.panel}>
        <Text style={styles.panelTitle}>Orders by hour (SGT)</Text>
        <View style={styles.hours}>
          {stats.by_hour.map((n, h) => (
            <View key={h} style={styles.hourCol}>
              <View style={[styles.hourBar, { height: 4 + (n / Math.max(1, ...stats.by_hour)) * 56 }]} />
            </View>
          ))}
        </View>
        <View style={styles.hourAxis}>
          {["12am", "6am", "12pm", "6pm", "11pm"].map((l) => <Text key={l} style={styles.axisText}>{l}</Text>)}
        </View>
        {stats.peak_hour !== null ? <Text style={styles.peak}>Busiest hour: {hourLabel(stats.peak_hour)}–{hourLabel((stats.peak_hour + 1) % 24)}</Text> : null}
      </View>
      <Text style={styles.footnote}>
        {stats.signed_in_orders} of {stats.orders} orders placed while signed in · One-time {stats.by_plan.one_time ?? 0} · Auto-Ship {stats.by_plan.subscribe ?? 0}
      </Text>
    </View>
  );
}

const useStyles = makeStyles((c) => ({
  tiles: { flexDirection: "row", flexWrap: "wrap", gap: space.sm },
  tile: { flexGrow: 1, flexBasis: "30%", backgroundColor: c.surface, borderRadius: radius.md, padding: space.md, borderWidth: 1, borderColor: c.border },
  tileValue: { fontFamily: fonts.black, fontSize: 18, color: c.onSurface },
  tileLabel: { fontFamily: fonts.medium, fontSize: 12, color: c.muted, marginTop: 2 },
  panel: { backgroundColor: c.surface, borderRadius: radius.lg, padding: space.lg, borderWidth: 1, borderColor: c.border, gap: space.sm },
  panelTitle: { fontFamily: fonts.bold, fontSize: 14, color: c.onSurface, marginBottom: space.xs },
  barRow: { flexDirection: "row", alignItems: "center", gap: space.sm },
  barLabel: { width: 84, fontFamily: fonts.medium, fontSize: 13, color: c.onSurfaceTertiary },
  track: { flex: 1, height: 10, borderRadius: radius.pill, backgroundColor: c.surfaceSecondary, overflow: "hidden" },
  fill: { height: 10, borderRadius: radius.pill, backgroundColor: c.brandPrimary },
  barValue: { minWidth: 72, textAlign: "right", fontFamily: fonts.bold, fontSize: 12, color: c.onSurface },
  hours: { flexDirection: "row", alignItems: "flex-end", height: 64, gap: 2 },
  hourCol: { flex: 1, justifyContent: "flex-end" },
  hourBar: { borderRadius: 2, backgroundColor: c.brandPrimary },
  hourAxis: { flexDirection: "row", justifyContent: "space-between" },
  axisText: { fontFamily: fonts.regular, fontSize: 10, color: c.muted },
  peak: { fontFamily: fonts.medium, fontSize: 13, color: c.onSurfaceTertiary },
  footnote: { fontFamily: fonts.regular, fontSize: 12, color: c.muted },
}));
