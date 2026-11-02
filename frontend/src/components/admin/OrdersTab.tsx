import { useQuery } from "@tanstack/react-query";
import { DownloadSimple, MagnifyingGlass, UserCircle } from "phosphor-react-native";
import { useMemo, useState } from "react";
import { ActivityIndicator, FlatList, Platform, Pressable, RefreshControl, Share, Text, TextInput, View } from "react-native";

import { AdminOrder, getAdminOrders } from "../../api";
import { formatSGD } from "../../content";
import { fonts, radius, space } from "../../fonts";
import { makeStyles, useTheme } from "../../theme";
import { OrderStats } from "./OrderStats";
import { ContactButtons, useAdminStyles } from "./shared";

const PERIODS = [
  { days: 7, label: "7 days" },
  { days: 30, label: "30 days" },
  { days: 90, label: "90 days" },
  { days: 0, label: "All time" },
];
const PAY: Record<string, string> = { apple_pay: "Apple Pay", google_pay: "Google Pay", card: "Card" };

const csvCell = (v: unknown) => `"${String(v ?? "").replace(/"/g, '""')}"`;
function toCsv(rows: AdminOrder[]) {
  const head = ["Order number", "Date (SGT)", "Time of day", "Plan", "Boxes", "Unit price", "Discount", "Total", "Code", "Payment", "Name", "Email", "Phone", "Address", "Postal code", "Region", "Account", "Auto-Ship status", "Next ship date"];
  const body = rows.map((o) => [
    o.order_number, o.sgt_time, o.time_slot, o.plan_name, o.quantity, o.unit_price, o.discount, o.total, o.applied_code, PAY[o.payment_method] ?? o.payment_method,
    o.customer.full_name, o.customer.email, o.customer.phone, o.customer.address, o.customer.postal_code, o.region,
    o.account ? `${o.account.provider ?? ""} ${o.account.email ?? ""}`.trim() : "Guest", o.autoship_status, o.next_ship_date?.slice(0, 10),
  ]);
  return [head, ...body].map((r) => r.map(csvCell).join(",")).join("\n");
}

async function exportCsv(rows: AdminOrder[]) {
  const csv = toCsv(rows);
  if (Platform.OS === "web") {
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = `biorna-orders-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  } else {
    await Share.share({ message: csv, title: "BioRNA orders" });
  }
}

export function OrdersTab({ passcode }: { passcode: string }) {
  const styles = useAdminStyles();
  const own = useStyles();
  const { colors } = useTheme();
  const [days, setDays] = useState(30);
  const [search, setSearch] = useState("");
  const { data, isLoading, isFetching, isError, refetch } = useQuery({ queryKey: ["admin-orders", passcode, days], queryFn: () => getAdminOrders(passcode, days) });

  const rows = useMemo(() => {
    const q = search.trim().toLowerCase();
    const all = data?.orders ?? [];
    if (!q) return all;
    return all.filter((o) =>
      [o.order_number, o.customer.full_name, o.customer.email, o.customer.phone, o.customer.postal_code, o.customer.address, o.region].some((v) => v.toLowerCase().includes(q)),
    );
  }, [data, search]);

  const header = (
    <View style={{ gap: space.md }}>
      <View style={styles.chips}>
        {PERIODS.map((p) => (
          <Pressable key={p.days} testID={`admin-orders-period-${p.days}`} onPress={() => setDays(p.days)} style={[styles.chip, days === p.days && styles.chipActive]}>
            <Text style={[styles.chipText, days === p.days && styles.chipTextActive]}>{p.label}</Text>
          </Pressable>
        ))}
      </View>
      {isError ? <Text style={styles.error}>Couldn&apos;t load orders. Pull to retry.</Text> : null}
      {data ? <OrderStats stats={data.stats} /> : null}
      <View style={own.searchRow}>
        <MagnifyingGlass size={18} color={colors.muted} />
        <TextInput
          testID="admin-orders-search"
          value={search}
          onChangeText={setSearch}
          placeholder="Search name, email, order, postal code"
          placeholderTextColor={colors.muted}
          autoCapitalize="none"
          style={own.search}
        />
      </View>
      <View style={own.listHead}>
        <Text style={styles.count} testID="admin-orders-count">{rows.length} order{rows.length === 1 ? "" : "s"}</Text>
        <Pressable testID="admin-orders-export" disabled={!rows.length} onPress={() => exportCsv(rows)} style={[own.export, !rows.length && { opacity: 0.5 }]}>
          <DownloadSimple size={16} color={colors.brandPrimary} weight="bold" />
          <Text style={own.exportText}>Export CSV</Text>
        </Pressable>
      </View>
    </View>
  );

  if (isLoading) return <ActivityIndicator style={{ marginTop: 48 }} color={colors.brandPrimary} />;

  return (
    <FlatList
      data={rows}
      keyExtractor={(o) => o.id}
      contentContainerStyle={styles.list}
      keyboardShouldPersistTaps="handled"
      refreshControl={<RefreshControl refreshing={isFetching} onRefresh={() => { refetch(); }} tintColor={colors.brandPrimary} />}
      ListHeaderComponent={header}
      ListEmptyComponent={<Text style={styles.body}>No orders in this period.</Text>}
      renderItem={({ item: o }) => (
        <View style={styles.card} testID={`admin-order-${o.order_number}`}>
          <View style={styles.cardHead}>
            <Text style={styles.cardTitle}>{o.order_number}</Text>
            <Text style={own.total}>{formatSGD(o.total)}</Text>
          </View>
          <Text style={styles.meta}>{o.sgt_time} SGT · {o.time_slot}</Text>
          <Text style={styles.meta}>
            {o.plan_name} · {o.quantity} box{o.quantity === 1 ? "" : "es"} × {formatSGD(o.unit_price)}
            {o.discount ? ` · −${formatSGD(o.discount)} (${o.applied_code})` : ""} · {PAY[o.payment_method] ?? o.payment_method}
          </Text>
          {o.autoship_status ? (
            <Text style={own.auto}>
              Auto-Ship {o.autoship_status}
              {o.next_ship_date ? ` · next ${new Date(o.next_ship_date).toLocaleDateString("en-SG", { day: "numeric", month: "short" })}` : ""}
              {o.shipments_sent ? ` · ${o.shipments_sent} shipped` : ""}
            </Text>
          ) : null}
          <View style={own.customer}>
            <Text style={own.name}>{o.customer.full_name}</Text>
            <Text style={styles.meta}>{o.customer.address}, Singapore {o.customer.postal_code}</Text>
            <Text style={styles.meta}>Region: {o.region}</Text>
            <View style={own.accountRow}>
              <UserCircle size={16} color={o.account ? colors.success : colors.muted} weight="fill" />
              <Text style={own.account}>{o.account ? `Account: ${o.account.name ?? ""} (${o.account.provider ?? "signed in"})`.replace("  ", " ") : "Guest checkout"}</Text>
            </View>
          </View>
          <ContactButtons email={o.customer.email} phone={o.customer.phone} testIDPrefix={`admin-order-${o.order_number}`} />
        </View>
      )}
    />
  );
}

const useStyles = makeStyles((c) => ({
  searchRow: { flexDirection: "row", alignItems: "center", gap: space.sm, height: 48, borderRadius: radius.md, borderWidth: 1, borderColor: c.border, backgroundColor: c.surface, paddingHorizontal: space.md },
  search: { flex: 1, height: 48, fontFamily: fonts.regular, fontSize: 15, color: c.onSurface },
  listHead: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  export: { minHeight: 44, flexDirection: "row", alignItems: "center", gap: space.xs, paddingHorizontal: space.md, borderRadius: radius.pill, backgroundColor: c.brandTertiary },
  exportText: { fontFamily: fonts.bold, fontSize: 13, color: c.onBrandTertiary },
  total: { fontFamily: fonts.black, fontSize: 17, color: c.onSurface },
  auto: { fontFamily: fonts.bold, fontSize: 13, color: c.brandPrimary, marginTop: space.xs },
  customer: { marginTop: space.md, paddingTop: space.md, borderTopWidth: 1, borderTopColor: c.divider },
  name: { fontFamily: fonts.bold, fontSize: 15, color: c.onSurface },
  accountRow: { flexDirection: "row", alignItems: "center", gap: space.xs, marginTop: space.xs },
  account: { fontFamily: fonts.medium, fontSize: 13, color: c.onSurfaceTertiary },
}));
