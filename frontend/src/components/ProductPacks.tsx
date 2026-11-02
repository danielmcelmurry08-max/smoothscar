import { useQuery } from "@tanstack/react-query";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { ArrowRight } from "phosphor-react-native";
import { Pressable, ScrollView, Text, View } from "react-native";

import { getProducts, productImage } from "../api";
import { formatSGD } from "../content";
import { fonts, radius, space } from "../fonts";
import { makeStyles, useTheme } from "../theme";
import { SectionHeader } from "./SectionHeader";

export function ProductPacks() {
  const styles = useStyles();
  const { colors } = useTheme();
  const router = useRouter();
  const { data = [] } = useQuery({ queryKey: ["products"], queryFn: getProducts });
  if (!data.length) return null;

  return (
    <View role="region" aria-label="More BioRNA packs" style={styles.section} testID="product-packs">
      <View style={styles.head}>
        <SectionHeader eyebrow="More BioRNA packs" title="Find the right pack." />
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
        {data.map((p) => {
          const img = productImage(p);
          return (
            <Pressable
              key={p.id}
              testID={`product-${p.id}`}
              onPress={() => router.push({ pathname: "/checkout", params: { plan: "product", product: p.id, qty: "1" } })}
              style={({ pressed }) => [styles.card, pressed && styles.pressed]}
            >
              <View style={styles.imgWrap}>
                {img ? <Image source={{ uri: img }} style={styles.img} contentFit="contain" accessibilityLabel={p.name} /> : null}
                {p.badge ? (
                  <View style={styles.badge}>
                    <Text style={styles.badgeText}>{p.badge}</Text>
                  </View>
                ) : null}
              </View>
              <Text style={styles.name} numberOfLines={2}>{p.name}</Text>
              <Text style={styles.meta}>{p.patches} patch{p.patches > 1 ? "es" : ""} per box</Text>
              {p.description ? <Text style={styles.desc} numberOfLines={3}>{p.description}</Text> : null}
              <View style={styles.footer}>
                <Text style={styles.price}>{formatSGD(p.price)}</Text>
                <View style={styles.buy}>
                  <Text style={styles.buyText}>Buy</Text>
                  <ArrowRight size={14} color={colors.onBrandPrimary} weight="bold" />
                </View>
              </View>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}

const useStyles = makeStyles((c) => ({
  section: { paddingBottom: space.xxxl, backgroundColor: c.surfaceSecondary },
  head: { paddingHorizontal: space.xl },
  row: { paddingHorizontal: space.xl, gap: space.md },
  card: { width: 220, backgroundColor: c.surface, borderRadius: radius.lg, padding: space.lg, borderWidth: 1, borderColor: c.border, gap: space.xs },
  pressed: { opacity: 0.85 },
  imgWrap: { height: 140, borderRadius: radius.md, backgroundColor: c.surfaceSecondary, overflow: "hidden", marginBottom: space.sm },
  img: { width: "100%", height: "100%" },
  badge: { position: "absolute", top: space.sm, left: space.sm, backgroundColor: c.brandPrimary, borderRadius: radius.sm, paddingHorizontal: 6, paddingVertical: 2 },
  badgeText: { fontFamily: fonts.bold, fontSize: 10, color: c.onBrandPrimary, letterSpacing: 0.4 },
  name: { fontFamily: fonts.bold, fontSize: 15, color: c.onSurface },
  meta: { fontFamily: fonts.medium, fontSize: 12, color: c.brandPrimary },
  desc: { fontFamily: fonts.regular, fontSize: 13, lineHeight: 18, color: c.muted },
  footer: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: space.sm },
  price: { fontFamily: fonts.black, fontSize: 18, color: c.onSurface },
  buy: { minHeight: 44, flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: space.md, borderRadius: radius.pill, backgroundColor: c.brandPrimary },
  buyText: { fontFamily: fonts.bold, fontSize: 13, color: c.onBrandPrimary },
}));
