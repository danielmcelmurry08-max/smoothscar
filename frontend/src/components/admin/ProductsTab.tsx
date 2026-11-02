import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { ActivityIndicator, Pressable, Switch, Text, TextInput, View } from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-controller";

import { createAdminProduct, deleteAdminProduct, getAdminProducts, Product, ProductInput, updateAdminProduct } from "../../api";
import { fonts, radius, space } from "../../fonts";
import { makeStyles, useTheme } from "../../theme";
import { useAdminStyles } from "./shared";

type Draft = { name: string; patches: string; price: string; description: string; badge: string; image_url: string; active: boolean };
const EMPTY: Draft = { name: "", patches: "", price: "", description: "", badge: "", image_url: "", active: true };
const toDraft = (p: Product): Draft => ({
  name: p.name, patches: String(p.patches), price: String(p.price), description: p.description ?? "", badge: p.badge ?? "", image_url: p.image_url ?? "", active: p.active,
});

function ProductForm({ initial, onSave, onCancel, onDelete, testID }: { initial: Draft; onSave: (d: ProductInput) => Promise<void>; onCancel?: () => void; onDelete?: () => Promise<void>; testID: string }) {
  const styles = useAdminStyles();
  const own = useStyles();
  const { colors } = useTheme();
  const [d, setD] = useState(initial);
  const [busy, setBusy] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [error, setError] = useState("");
  const patches = parseInt(d.patches, 10);
  const price = parseInt(d.price, 10);
  const valid = d.name.trim().length >= 2 && patches >= 1 && price >= 1;

  const run = async (fn: () => Promise<void>) => {
    setError("");
    setBusy(true);
    try {
      await fn();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setBusy(false);
    }
  };
  const field = (key: keyof Draft, label: string, opts: { numeric?: boolean; multiline?: boolean; placeholder?: string } = {}) => (
    <View style={own.field}>
      <Text style={own.label}>{label}</Text>
      <TextInput
        testID={`${testID}-${key}`}
        value={d[key] as string}
        onChangeText={(t) => setD((s) => ({ ...s, [key]: opts.numeric ? t.replace(/\D/g, "").slice(0, 5) : t }))}
        keyboardType={opts.numeric ? "number-pad" : "default"}
        multiline={opts.multiline}
        placeholder={opts.placeholder}
        placeholderTextColor={colors.muted}
        autoCapitalize={key === "image_url" ? "none" : "sentences"}
        style={[own.input, opts.multiline && own.textarea]}
      />
    </View>
  );

  return (
    <View style={styles.card} testID={testID}>
      {field("name", "Product name", { placeholder: "e.g. BioRNA-C Starter Pack" })}
      <View style={own.pair}>
        <View style={own.half}>{field("patches", "Patches per box", { numeric: true })}</View>
        <View style={own.half}>{field("price", "Price (SGD)", { numeric: true })}</View>
      </View>
      {field("description", "Short description", { multiline: true })}
      {field("badge", "Badge (optional)", { placeholder: "e.g. NEW ARRIVAL" })}
      {field("image_url", "Image link (optional)", { placeholder: "https://…" })}
      <View style={own.switchRow}>
        <Text style={own.label}>Show on website</Text>
        <Switch testID={`${testID}-active`} value={d.active} onValueChange={(v) => setD((s) => ({ ...s, active: v }))} trackColor={{ true: colors.brandPrimary, false: colors.borderStrong }} />
      </View>
      {error ? <Text style={styles.error}>{error}</Text> : null}
      <View style={own.actions}>
        {onCancel ? (
          <Pressable onPress={onCancel} style={[own.btn, own.secondary]} testID={`${testID}-cancel`}>
            <Text style={own.secondaryText}>Cancel</Text>
          </Pressable>
        ) : null}
        <Pressable
          testID={`${testID}-save`}
          disabled={!valid || busy}
          onPress={() => run(() => onSave({ name: d.name.trim(), patches, price, description: d.description.trim() || null, badge: d.badge.trim() || null, image_url: d.image_url.trim() || null, active: d.active, sort: 0 }))}
          style={[own.btn, own.primary, (!valid || busy) && own.disabled]}
        >
          {busy ? <ActivityIndicator color={colors.onBrandPrimary} /> : <Text style={own.primaryText}>Save</Text>}
        </Pressable>
      </View>
      {onDelete ? (
        confirmDelete ? (
          <View style={own.actions}>
            <Pressable onPress={() => setConfirmDelete(false)} style={[own.btn, own.secondary]}>
              <Text style={own.secondaryText}>Keep</Text>
            </Pressable>
            <Pressable testID={`${testID}-delete-confirm`} onPress={() => run(onDelete)} style={[own.btn, own.danger]}>
              <Text style={own.primaryText}>Remove product</Text>
            </Pressable>
          </View>
        ) : (
          <Pressable testID={`${testID}-delete`} onPress={() => setConfirmDelete(true)} style={own.linkBtn}>
            <Text style={own.dangerText}>Remove this product</Text>
          </Pressable>
        )
      ) : null}
    </View>
  );
}

export function ProductsTab({ passcode }: { passcode: string }) {
  const styles = useAdminStyles();
  const own = useStyles();
  const { colors } = useTheme();
  const qc = useQueryClient();
  const [editing, setEditing] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const { data = [], isLoading } = useQuery({ queryKey: ["admin-products", passcode], queryFn: () => getAdminProducts(passcode) });
  const refresh = () => Promise.all([qc.invalidateQueries({ queryKey: ["admin-products"] }), qc.invalidateQueries({ queryKey: ["products"] })]);

  if (isLoading) return <ActivityIndicator style={{ marginTop: 48 }} color={colors.brandPrimary} />;
  return (
    <KeyboardAwareScrollView bottomOffset={40} contentContainerStyle={styles.list} keyboardShouldPersistTaps="handled">
      <Text style={styles.count}>{data.length} product{data.length === 1 ? "" : "s"}</Text>
      <Text style={[styles.body, { marginTop: 0 }]}>These packs appear under “More BioRNA packs” on the website. The main box, bundle and Auto-Ship prices are set in Pricing.</Text>
      {adding ? (
        <ProductForm testID="product-new" initial={EMPTY} onCancel={() => setAdding(false)} onSave={async (b) => { await createAdminProduct(passcode, b); await refresh(); setAdding(false); }} />
      ) : (
        <Pressable testID="admin-product-add" onPress={() => setAdding(true)} style={[own.btn, own.primary]}>
          <Text style={own.primaryText}>Add product</Text>
        </Pressable>
      )}
      {data.map((p) =>
        editing === p.id ? (
          <ProductForm
            key={p.id}
            testID={`product-edit-${p.id}`}
            initial={toDraft(p)}
            onCancel={() => setEditing(null)}
            onSave={async (b) => { await updateAdminProduct(passcode, p.id, { ...b, sort: p.sort }); await refresh(); setEditing(null); }}
            onDelete={async () => { await deleteAdminProduct(passcode, p.id); await refresh(); setEditing(null); }}
          />
        ) : (
          <Pressable key={p.id} testID={`admin-product-${p.id}`} onPress={() => setEditing(p.id)} style={styles.card}>
            <View style={styles.cardHead}>
              <Text style={styles.cardTitle}>{p.name}</Text>
              <Text style={own.price}>${p.price.toLocaleString("en-SG")}</Text>
            </View>
            <Text style={styles.meta}>{p.patches} patch{p.patches > 1 ? "es" : ""} per box{p.badge ? ` · ${p.badge}` : ""} · {p.active ? "Shown on website" : "Hidden"}</Text>
            <Text style={own.editHint}>Tap to edit</Text>
          </Pressable>
        ),
      )}
    </KeyboardAwareScrollView>
  );
}

const useStyles = makeStyles((c) => ({
  field: { marginBottom: space.md },
  label: { fontFamily: fonts.medium, fontSize: 13, color: c.onSurfaceTertiary, marginBottom: space.xs },
  input: { minHeight: 48, borderRadius: radius.md, borderWidth: 1, borderColor: c.border, backgroundColor: c.surfaceSecondary, paddingHorizontal: space.md, fontFamily: fonts.regular, fontSize: 15, color: c.onSurface },
  textarea: { minHeight: 88, paddingTop: space.sm, textAlignVertical: "top" },
  pair: { flexDirection: "row", gap: space.md },
  half: { flex: 1 },
  switchRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", minHeight: 44 },
  actions: { flexDirection: "row", gap: space.sm, marginTop: space.md },
  btn: { flex: 1, minHeight: 48, borderRadius: radius.pill, alignItems: "center", justifyContent: "center" },
  primary: { backgroundColor: c.brandPrimary },
  primaryText: { fontFamily: fonts.bold, fontSize: 14, color: c.onBrandPrimary },
  secondary: { borderWidth: 1.5, borderColor: c.border, backgroundColor: c.surface },
  secondaryText: { fontFamily: fonts.bold, fontSize: 14, color: c.onSurfaceTertiary },
  danger: { backgroundColor: c.error },
  dangerText: { fontFamily: fonts.bold, fontSize: 13, color: c.error },
  linkBtn: { minHeight: 44, alignItems: "center", justifyContent: "center", marginTop: space.xs },
  disabled: { opacity: 0.5 },
  price: { fontFamily: fonts.black, fontSize: 16, color: c.onSurface },
  editHint: { fontFamily: fonts.medium, fontSize: 12, color: c.brandPrimary, marginTop: space.xs },
}));
