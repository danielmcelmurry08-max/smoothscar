import { Image } from "expo-image";
import { Redirect, useLocalSearchParams, useRouter } from "expo-router";
import { useState } from "react";
import { Text, View } from "react-native";

import { useCart } from "@/src/cart";
import { getProduct, priceOf, SAFETY, SHIPPING, skuLabel } from "@/src/catalog";
import { BulletList, Button, PriceTag, QtyStepper, Section, STORE_MAX, StoreScreen } from "@/src/components/Store";
import { fonts, radius, space } from "@/src/fonts";
import { makeStyles } from "@/src/theme";

export default function ProductPage() {
  const styles = useStyles();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const product = getProduct(String(id));
  const { add } = useCart();
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);
  if (!product) return <Redirect href="/shop" />;
  const purchasable = priceOf(product.id) != null;

  return (
    <StoreScreen title={`${product.name} (${product.patches} patches) | BioRNA`} description={product.tagline} testID="product-screen">
      <View style={styles.top}>
        <View style={styles.topInner}>
          <View style={[styles.imgWrap, product.accent === "girl" && styles.girl, product.accent === "boy" && styles.boy]}>
            <Image source={product.image} style={styles.img} contentFit="contain" accessibilityLabel={`${product.name} packaging`} />
          </View>
          <View style={styles.info}>
            <Text style={styles.line}>{product.line}</Text>
            <Text role="heading" aria-level={1} style={styles.h1} testID="product-name">
              {product.name}
            </Text>
            <Text style={styles.meta} testID="product-sku">
              {product.patches} patches per box · SKU: {skuLabel(product)}
            </Text>
            <Text style={styles.tagline}>{product.tagline}</Text>
            <PriceTag product={product} size="lg" />
            <View style={styles.buyRow}>
              <QtyStepper value={qty} onChange={setQty} testID="product-qty" />
              <Button
                label={purchasable ? (added ? "Added ✓" : "Add to Cart") : "Unavailable"}
                disabled={!purchasable}
                testID="add-to-cart"
                onPress={() => {
                  add(product.id, qty);
                  setAdded(true);
                }}
              />
            </View>
            {purchasable ? null : <Text style={styles.note}>You can buy this item once its US price is confirmed.</Text>}
            {added ? (
              <Text style={styles.link} onPress={() => router.push("/cart")}>
                View cart →
              </Text>
            ) : null}
          </View>
        </View>
      </View>
      <Section eyebrow="About" title="Product description" body={product.description}>
        <BulletList items={product.packaging} />
      </Section>
      <Section eyebrow="Directions" title="How to use" tone="soft">
        <BulletList items={product.howToUse} numbered />
      </Section>
      <Section eyebrow="Safety" title="Safety information">
        <BulletList items={SAFETY} />
      </Section>
      <Section eyebrow="Delivery" title="Shipping & returns" tone="soft">
        <BulletList items={SHIPPING} />
      </Section>
    </StoreScreen>
  );
}

const useStyles = makeStyles((c) => ({
  top: { paddingHorizontal: space.xl, paddingVertical: space.xxl },
  topInner: { width: "100%", maxWidth: STORE_MAX, alignSelf: "center", flexDirection: "row", flexWrap: "wrap", gap: space.xxl },
  imgWrap: { flexGrow: 1, flexBasis: 300, height: 380, borderRadius: radius.lg, backgroundColor: c.surfaceSecondary, padding: space.lg },
  girl: { backgroundColor: "#FBF5FC" },
  boy: { backgroundColor: "#F2F7FD" },
  img: { width: "100%", height: "100%" },
  info: { flexGrow: 1, flexBasis: 300, gap: space.sm },
  line: { fontFamily: fonts.bold, fontSize: 12, letterSpacing: 1.2, textTransform: "uppercase", color: c.brandPrimary },
  h1: { fontFamily: fonts.black, fontSize: 32, lineHeight: 38, letterSpacing: -0.8, color: c.brandSecondary },
  meta: { fontFamily: fonts.medium, fontSize: 14, color: c.muted },
  tagline: { fontFamily: fonts.regular, fontSize: 16, lineHeight: 24, color: c.onSurfaceTertiary, marginBottom: space.sm },
  buyRow: { flexDirection: "row", flexWrap: "wrap", alignItems: "center", gap: space.md, marginTop: space.md },
  note: { fontFamily: fonts.regular, fontSize: 13, color: c.muted },
  link: { fontFamily: fonts.bold, fontSize: 14, color: c.brandPrimary, paddingVertical: space.xs },
}));
