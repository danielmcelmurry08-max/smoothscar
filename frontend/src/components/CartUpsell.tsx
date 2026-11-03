import { Image } from "expo-image";
import { Check, Plus } from "phosphor-react-native";
import { Pressable, Text, View } from "react-native";

import { useCart } from "../cart";
import { getProduct, ProductId, priceOf } from "../catalog";
import { fonts, radius, space } from "../fonts";
import { makeStyles, useTheme } from "../theme";
import { PriceTag } from "./Store";

// Cross-sell order of preference. Only real catalog products, at their normal price.
const SUGGEST: ProductId[] = ["biorna-c-baby-girl", "biorna-c-baby-boy", "biorna-c-starter", "antiscar-original"];

/** Inline one-tap add-on tray for the cart summary. */
export function CartUpsell({ offered }: { offered: ProductId | null }) {
  const styles = useStyles();
  const { colors } = useTheme();
  const { lines, add, remove } = useCart();
  const inCart = (id: ProductId) => lines.some((l) => l.id === id);
  const id = offered ?? SUGGEST.find((s) => !inCart(s));
  if (!id) return null;
  const p = getProduct(id)!;
  const added = inCart(id);
  const priced = priceOf(id) != null;
  return (
    <View style={styles.tray} role="region" aria-label="Suggested add-on" testID="cart-upsell">
      <Text style={styles.h}>Complete your postpartum care</Text>
      <View style={styles.row}>
        <Image source={p.image} style={styles.img} contentFit="contain" accessibilityLabel={p.name} />
        <View style={styles.info}>
          <Text style={styles.name}>{p.name}</Text>
          <Text style={styles.copy}>{p.accent ? "A 24-patch gift box for a friend who is expecting or has just had a baby." : p.tagline}</Text>
          <PriceTag product={p} />
        </View>
      </View>
      <Pressable
        accessibilityRole="checkbox"
        accessibilityState={{ checked: added, disabled: !priced }}
        disabled={!priced}
        onPress={() => (added ? remove(id) : add(id, 1))}
        style={[styles.toggle, added && styles.toggleOn, !priced && styles.toggleOff]}
        testID="cart-upsell-toggle"
      >
        {added ? <Check size={18} color={colors.onBrandSecondary} weight="bold" /> : <Plus size={18} color={priced ? colors.brandSecondary : colors.muted} weight="bold" />}
        <Text style={[styles.toggleText, added && styles.toggleTextOn, !priced && styles.toggleTextOff]}>
          {!priced ? "Available once priced" : added ? "Added to my order" : "Add to my order"}
        </Text>
      </Pressable>
    </View>
  );
}

const useStyles = makeStyles((c) => ({
  tray: { backgroundColor: c.surfaceSecondary, borderRadius: radius.lg, padding: space.lg, gap: space.md, borderWidth: 1, borderColor: c.border },
  h: { fontFamily: fonts.bold, fontSize: 16, color: c.onSurface },
  row: { flexDirection: "row", gap: space.md, alignItems: "center" },
  img: { width: 72, height: 72, borderRadius: radius.md, backgroundColor: c.surface },
  info: { flex: 1, gap: 2 },
  name: { fontFamily: fonts.bold, fontSize: 15, color: c.onSurface },
  copy: { fontFamily: fonts.regular, fontSize: 14, lineHeight: 22, color: c.onSurface },
  toggle: { minHeight: 48, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: space.sm, borderRadius: radius.md, borderWidth: 1.5, borderColor: c.sage, backgroundColor: c.surface },
  toggleOn: { backgroundColor: c.brandSecondary, borderColor: c.brandSecondary },
  toggleOff: { borderColor: c.border },
  toggleText: { fontFamily: fonts.bold, fontSize: 15, color: c.brandSecondary },
  toggleTextOn: { color: c.onBrandSecondary },
  toggleTextOff: { color: c.muted },
}));
