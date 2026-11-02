import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { useState } from "react";
import { Text, View } from "react-native";

import { useCart } from "@/src/cart";
import { CHECKOUT_ENABLED, formatUSD, getProduct, priceOf } from "@/src/catalog";
import { CartUpsell } from "@/src/components/CartUpsell";
import { Button, QtyStepper, Section, StoreScreen } from "@/src/components/Store";
import { fonts, radius, space } from "@/src/fonts";
import { makeStyles } from "@/src/theme";

export default function CartScreen() {
  const styles = useStyles();
  const router = useRouter();
  const { lines, total, setQty, remove } = useCart();
  // Lock the suggested add-on for this visit so toggling it does not swap the offer.
  const [offered] = useState(() => (["biorna-c-baby-girl", "biorna-c-baby-boy", "biorna-c-starter", "antiscar-original"] as const).find((id) => !lines.some((l) => l.id === id)) ?? null);

  return (
    <StoreScreen title="Your cart | BioRNA" description="Review the BioRNA products in your cart." testID="cart-screen">
      <Section eyebrow="Cart" title="Your cart">
        {lines.length === 0 ? (
          <View style={styles.empty}>
            <Text style={styles.muted}>Your cart is empty.</Text>
            <Button label="Shop BioRNA" onPress={() => router.push("/shop")} />
          </View>
        ) : (
          <View style={styles.list}>
            {lines.map((l) => {
              const p = getProduct(l.id)!;
              const price = priceOf(l.id);
              return (
                <View key={l.id} style={styles.row} testID={`cart-line-${l.id}`}>
                  <Image source={p.image} style={styles.thumb} contentFit="contain" accessibilityLabel={p.name} />
                  <View style={styles.rowInfo}>
                    <Text style={styles.name} onPress={() => router.push(`/product/${p.id}`)}>
                      {p.name}
                    </Text>
                    <Text style={styles.muted}>
                      {p.patches} patches · {price == null ? "Price coming soon" : `${formatUSD(price)} each`}
                    </Text>
                    <View style={styles.controls}>
                      <QtyStepper value={l.qty} onChange={(n) => setQty(l.id, n)} testID={`cart-qty-${l.id}`} />
                      <Text style={styles.remove} onPress={() => remove(l.id)} testID={`cart-remove-${l.id}`}>
                        Remove
                      </Text>
                    </View>
                  </View>
                  <Text style={styles.subtotal}>{price == null ? "—" : formatUSD(price * l.qty)}</Text>
                </View>
              );
            })}
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Total</Text>
              <Text style={styles.total} testID="cart-total">
                {total == null ? "Pending verified prices" : formatUSD(total)}
              </Text>
            </View>
            <CartUpsell offered={offered} />
            <Button label={CHECKOUT_ENABLED ? "Checkout" : "Checkout coming soon"} disabled={!CHECKOUT_ENABLED} onPress={() => {}} testID="cart-checkout" />
            <Text style={styles.muted}>Online payment is not set up yet, so no orders are placed or charged. Your cart is saved on this device.</Text>
          </View>
        )}
      </Section>
    </StoreScreen>
  );
}

const useStyles = makeStyles((c) => ({
  empty: { gap: space.lg, alignItems: "flex-start" },
  list: { gap: space.lg, maxWidth: 720 },
  row: { flexDirection: "row", gap: space.md, alignItems: "flex-start", paddingBottom: space.lg, borderBottomWidth: 1, borderBottomColor: c.border },
  thumb: { width: 72, height: 72, borderRadius: radius.md, backgroundColor: c.surfaceSecondary },
  rowInfo: { flex: 1, gap: 2 },
  name: { fontFamily: fonts.bold, fontSize: 16, color: c.brandSecondary },
  muted: { fontFamily: fonts.regular, fontSize: 14, lineHeight: 20, color: c.muted },
  controls: { flexDirection: "row", alignItems: "center", gap: space.lg, marginTop: space.sm },
  remove: { fontFamily: fonts.bold, fontSize: 14, color: c.error, paddingVertical: space.sm },
  subtotal: { fontFamily: fonts.bold, fontSize: 16, color: c.onSurface },
  totalRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  totalLabel: { fontFamily: fonts.bold, fontSize: 18, color: c.onSurface },
  total: { fontFamily: fonts.black, fontSize: 18, color: c.onSurface },
}));
