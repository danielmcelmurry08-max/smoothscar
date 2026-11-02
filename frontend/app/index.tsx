import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { Text, View } from "react-native";

import { CATEGORIES, getProduct, PRODUCTS } from "@/src/catalog";
import { Button, HowItWorks, HowToUse, ProductGrid, Section, STORE_MAX, StoreScreen } from "@/src/components/Store";
import { fonts, radius, space } from "@/src/fonts";
import { makeStyles } from "@/src/theme";

export default function Home() {
  const styles = useStyles();
  const router = useRouter();
  const original = getProduct("antiscar-original")!;
  return (
    <StoreScreen
      title="BioRNA Antiscar & BioRNA-C | Micro-Tip Scar Care Patches"
      description="Discover BioRNA's dissolvable micro-tip patch technology, designed to help reduce the appearance of scars."
      testID="landing-screen"
    >
      <View style={styles.hero} testID="hero-section">
        <View style={styles.heroInner}>
          <View style={styles.heroCopy}>
            <Text style={styles.eyebrow}>BioRNA Antiscar · Original Blue Box</Text>
            <Text role="heading" aria-level={1} style={styles.h1} testID="hero-headline">
              Advanced Scar Care, Made Simple.
            </Text>
            <Text style={styles.sub}>{"Discover BioRNA's dissolvable micro-tip patch technology, designed to help reduce the appearance of scars."}</Text>
            <View style={styles.ctas}>
              <Button label="Shop BioRNA" onPress={() => router.push("/shop")} testID="hero-shop" />
              <Button label="How It Works" variant="secondary" onPress={() => router.push("/science")} testID="hero-how" />
            </View>
          </View>
          <View style={styles.heroImgWrap}>
            <Image source={original.image} style={styles.heroImg} contentFit="contain" accessibilityLabel="BioRNA Antiscar original blue box, 7 patches" />
          </View>
        </View>
      </View>

      <Section eyebrow="Shop by category" title="Find your BioRNA.">
        <View style={styles.cats}>
          {CATEGORIES.map((c) => (
            <View key={c.id} style={styles.cat}>
              <Text style={styles.catTitle}>{c.title}</Text>
              <Text style={styles.catBody}>{c.body}</Text>
              <Text style={styles.catLink} onPress={() => router.push(c.href as never)}>
                Explore →
              </Text>
            </View>
          ))}
        </View>
      </Section>

      <Section eyebrow="The collection" title="Original first, then BioRNA-C." tone="soft">
        <ProductGrid products={PRODUCTS} />
      </Section>

      <HowItWorks />
      <HowToUse />
    </StoreScreen>
  );
}

const useStyles = makeStyles((c) => ({
  hero: { backgroundColor: c.brandTertiary, paddingHorizontal: space.xl, paddingVertical: space.xxxl },
  heroInner: { width: "100%", maxWidth: STORE_MAX, alignSelf: "center", flexDirection: "row", flexWrap: "wrap-reverse", alignItems: "center", gap: space.xxl },
  heroCopy: { flexGrow: 1, flexBasis: 320 },
  eyebrow: { fontFamily: fonts.bold, fontSize: 12, letterSpacing: 1.4, textTransform: "uppercase", color: c.brandPrimary, marginBottom: space.md },
  h1: { fontFamily: fonts.black, fontSize: 42, lineHeight: 46, letterSpacing: -1.2, color: c.brandSecondary },
  sub: { fontFamily: fonts.regular, fontSize: 18, lineHeight: 27, color: c.onSurfaceTertiary, marginTop: space.lg, maxWidth: 520 },
  ctas: { flexDirection: "row", flexWrap: "wrap", gap: space.md, marginTop: space.xl },
  heroImgWrap: { flexGrow: 1, flexBasis: 300, height: 340, borderRadius: radius.lg, backgroundColor: c.surface, padding: space.lg },
  heroImg: { width: "100%", height: "100%" },
  cats: { flexDirection: "row", flexWrap: "wrap", gap: space.md },
  cat: { flexGrow: 1, flexBasis: 240, padding: space.xl, borderRadius: radius.lg, borderWidth: 1, borderColor: c.border, backgroundColor: c.surfaceSecondary, gap: space.xs },
  catTitle: { fontFamily: fonts.bold, fontSize: 17, color: c.brandSecondary },
  catBody: { fontFamily: fonts.regular, fontSize: 14, color: c.muted },
  catLink: { fontFamily: fonts.bold, fontSize: 14, color: c.brandPrimary, marginTop: space.sm, paddingVertical: space.xs },
}));
