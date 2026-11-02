import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { CheckCircle, Flask, Gift, Lock } from "phosphor-react-native";
import { useState } from "react";
import { Text, View } from "react-native";

import { useCart } from "@/src/cart";
import { CHECKOUT_ENABLED, getProduct, priceOf, ProductId } from "@/src/catalog";
import { ResultsGallery } from "@/src/components/ResultsGallery";
import { SaveCartModal } from "@/src/components/SaveCartModal";
import { Button, PriceTag, STORE_MAX, StoreScreen } from "@/src/components/Store";
import { fonts, radius, space } from "@/src/fonts";
import { makeStyles, useTheme } from "@/src/theme";

// Only verified statements appear here. Ratings, certifications, guarantees and
// HSA/FSA eligibility can be added once they are substantiated.
const PROOF = ["Hypoallergenic & dermatologically validated", "Suitable for sensitive skin", "Needle-free dissolvable micro-tips", "Studied in a published randomized trial"];

const PATHS: { id: ProductId; kicker: string; blurb: string; cta: string; ribbon?: string }[] = [
  { id: "biorna-c-starter", kicker: "Try it first", blurb: "A 2-patch introduction to BioRNA-C for your healed C-section scar.", cta: "Add to Cart" },
  { id: "biorna-c-baby-girl", kicker: "Gift-ready", blurb: "24 patches in a keepsake gift box. Choose the Baby Girl or Baby Boy design.", cta: "Add Gift Pack to Cart", ribbon: "GIFT FOR A NEW MOM" },
  { id: "biorna-c-standard", kicker: "Ongoing routine", blurb: "8 patches for continued daily care of your scar.", cta: "Add to Cart" },
];

const STEPS = [
  { title: "Apply gently", body: "Once your incision has fully closed, place the patch on clean, dry skin over the scar." },
  { title: "Micro-tips dissolve", body: "Dissolvable hyaluronic-acid micro-tips engage the skin's surface and deliver the RNA and hyaluronic acid formulation." },
  { title: "Hydrate & protect", body: "The patch keeps the scar hydrated and covered. Continued use is intended to reduce its appearance." },
];

export default function Home() {
  const styles = useStyles();
  const { colors } = useTheme();
  const router = useRouter();
  const { add } = useCart();
  const [added, setAdded] = useState<ProductId | null>(null);
  const gift = getProduct("biorna-c-baby-girl")!;
  const pouch = getProduct("biorna-c-standard")!;

  return (
    <StoreScreen
      title="SmoothScar | BioRNA-C Micro-Tip Patches for C-Section Scars"
      description="BioRNA-C uses dissolvable hyaluronic-acid micro-tips and RNA technology to hydrate, protect and help reduce the appearance of C-section scars."
      testID="landing-screen"
    >
      {/* SECTION 1: Hero */}
      <View role="region" aria-label="Introduction" style={styles.hero} testID="hero-section">
        <View style={styles.heroInner}>
          <View style={styles.heroCopy}>
            <Text style={styles.pre}>Designed for C-section scars • Hypoallergenic</Text>
            <Text role="heading" aria-level={1} style={styles.h1} testID="hero-headline">
              The Science of C-Section Scar Care.
            </Text>
            <Text style={styles.sub}>
              Don’t just cover your scar. Care for it. BioRNA-C uses dissolvable hyaluronic-acid micro-tips and RNA technology to hydrate and protect the skin and help reduce the
              appearance of C-section scars.
            </Text>
            <View style={styles.ctas}>
              <Button label="Shop Recovery Patches" onPress={() => router.push("/biorna-c")} testID="hero-shop" />
              <Button
                label="Gift This to a New Mom"
                variant="secondary"
                icon={<Gift size={20} color={colors.brandSecondary} weight="bold" />}
                onPress={() => router.push("/product/biorna-c-baby-girl")}
                testID="hero-gift"
              />
            </View>
          </View>
          <View style={styles.visual} role="img" aria-label="BioRNA-C gift box beside the BioRNA-C standard box">
            <Image source={gift.image} style={styles.visualMain} contentFit="contain" accessibilityLabel="BioRNA-C Baby Girl gift box" />
            <View style={styles.badge}>
              <Flask size={18} color={colors.sage} weight="bold" />
              <View>
                <Text style={styles.badgeTitle}>Clinical research</Text>
                <Text style={styles.badgeText} onPress={() => router.push("/science")}>
                  Published trial, 2024 →
                </Text>
              </View>
            </View>
            <View style={styles.visualInset}>
              <Image source={pouch.image} style={styles.visualInsetImg} contentFit="contain" accessibilityLabel="BioRNA-C Standard Pack" />
            </View>
          </View>
        </View>
      </View>

      {/* SECTION 2: Quick-proof strip */}
      <View role="region" aria-label="Product highlights" style={styles.strip} testID="proof-strip">
        <View style={styles.stripInner}>
          {PROOF.map((p) => (
            <View key={p} style={styles.proof}>
              <CheckCircle size={18} color={colors.sage} weight="fill" />
              <Text style={styles.proofText}>{p}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* SECTION 3: Choose your path */}
      <View role="region" aria-label="Choose your pack" style={styles.section} testID="purchase-grid">
        <View style={styles.inner}>
          <Text style={styles.eyebrow}>Choose your path</Text>
          <Text role="heading" aria-level={2} style={styles.h2}>
            For you, or for someone you love.
          </Text>
          <View style={styles.grid}>
            {PATHS.map((path) => {
              const p = getProduct(path.id)!;
              const priced = priceOf(p.id) != null;
              const featured = !!path.ribbon;
              return (
                <View key={p.id} style={[styles.card, featured && styles.cardFeatured]} testID={`path-${p.id}`}>
                  {path.ribbon ? (
                    <View style={styles.ribbon}>
                      <Text style={styles.ribbonText}>{path.ribbon}</Text>
                    </View>
                  ) : null}
                  <View style={styles.cardImg}>
                    <Image source={p.image} style={styles.fill} contentFit="contain" accessibilityLabel={`${p.name} packaging`} />
                  </View>
                  <Text style={styles.kicker}>{path.kicker}</Text>
                  <Text style={styles.cardTitle} onPress={() => router.push(`/product/${p.id}`)}>
                    {p.name} ({p.patches} patches)
                  </Text>
                  <PriceTag product={p} size="lg" />
                  <Text style={styles.blurb}>{path.blurb}</Text>
                  <View style={styles.cardCta}>
                    <Button
                      label={!priced ? "Price coming soon" : added === p.id ? "Added ✓" : path.cta}
                      disabled={!priced}
                      variant={featured ? "primary" : "secondary"}
                      onPress={() => {
                        add(p.id, 1);
                        setAdded(p.id);
                      }}
                      testID={`path-${p.id}-add`}
                    />
                  </View>
                </View>
              );
            })}
          </View>
          <Text style={styles.allLink} onPress={() => router.push("/shop")}>
            See all 5 BioRNA products, including the original Antiscar blue box →
          </Text>
        </View>
      </View>

      {/* SECTION 4: How it works */}
      <View role="region" aria-label="How it works" style={[styles.section, styles.oat]} testID="how-it-works">
        <View style={styles.inner}>
          <Text style={styles.eyebrow}>How it works</Text>
          <Text role="heading" aria-level={2} style={styles.h2}>
            Three simple steps, every night.
          </Text>
          <View style={styles.grid}>
            {STEPS.map((s, i) => (
              <View key={s.title} style={styles.step}>
                <View style={styles.stepNum}>
                  <Text style={styles.stepNumText}>{i + 1}</Text>
                </View>
                <Text style={styles.cardTitle}>{s.title}</Text>
                <Text style={styles.blurb}>{s.body}</Text>
              </View>
            ))}
          </View>
          <Text style={styles.allLink} onPress={() => router.push("/science")}>
            Explore the science →
          </Text>
        </View>
      </View>

      {/* Clinical results gallery, below the technology explanation */}
      <ResultsGallery showLink />

      {/* SECTION 5: Reassurance & checkout bar */}
      <View role="region" aria-label="Checkout information" style={styles.bar} testID="checkout-bar">
        <View style={styles.barInner}>
          <Lock size={22} color={colors.sage} weight="bold" />
          <Text style={styles.barText}>
            {CHECKOUT_ENABLED
              ? "Secure checkout."
              : "Online checkout is opening soon. Your cart is saved on this device, and no payment is taken until secure checkout launches."}
          </Text>
          <Button label="View Cart" onPress={() => router.push("/cart")} testID="bar-cart" />
        </View>
      </View>
      <SaveCartModal />
    </StoreScreen>
  );
}

const useStyles = makeStyles((c) => ({
  fill: { width: "100%", height: "100%" },
  inner: { width: "100%", maxWidth: 1080, alignSelf: "center" },
  hero: { backgroundColor: c.surface, paddingHorizontal: space.xl, paddingVertical: space.xxxl },
  heroInner: { width: "100%", maxWidth: STORE_MAX, alignSelf: "center", flexDirection: "row", flexWrap: "wrap", alignItems: "center", gap: space.xxl },
  heroCopy: { flexGrow: 1, flexBasis: 340 },
  pre: { fontFamily: fonts.bold, fontSize: 13, letterSpacing: 1.4, textTransform: "uppercase", color: c.onSurface, marginBottom: space.md },
  h1: { fontFamily: fonts.black, fontSize: 44, lineHeight: 50, letterSpacing: -1.2, color: c.onSurface },
  sub: { fontFamily: fonts.regular, fontSize: 18, lineHeight: 30, color: c.onSurface, marginTop: space.lg, maxWidth: 560 },
  ctas: { flexDirection: "row", flexWrap: "wrap", gap: space.md, marginTop: space.xl },
  visual: { flexGrow: 1, flexBasis: 320, height: 400, borderRadius: radius.lg, backgroundColor: c.surfaceSecondary, padding: space.xl },
  visualMain: { width: "100%", height: "100%" },
  visualInset: { position: "absolute", right: space.lg, bottom: space.lg, width: 130, height: 120, borderRadius: radius.md, backgroundColor: c.surface, padding: space.sm, borderWidth: 1, borderColor: c.border },
  badge: { position: "absolute", left: space.lg, top: space.lg, flexDirection: "row", alignItems: "center", gap: space.sm, backgroundColor: c.surface, borderRadius: radius.md, paddingHorizontal: space.md, paddingVertical: space.sm, borderWidth: 1, borderColor: c.sage, shadowColor: c.brandSecondary, shadowOpacity: 0.1, shadowRadius: 12, shadowOffset: { width: 0, height: 4 } },
  badgeTitle: { fontFamily: fonts.bold, fontSize: 13, color: c.onSurface },
  badgeText: { fontFamily: fonts.medium, fontSize: 13, color: c.accentText },
  fine: { fontFamily: fonts.regular, fontSize: 13, lineHeight: 20, color: c.muted, marginTop: space.md },
  visualInsetImg: { width: "100%", height: "100%" },
  strip: { backgroundColor: c.surfaceSecondary, paddingHorizontal: space.xl, paddingVertical: space.lg },
  stripInner: { width: "100%", maxWidth: STORE_MAX, alignSelf: "center", flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between", rowGap: space.sm, columnGap: space.xl },
  proof: { flexDirection: "row", alignItems: "center", gap: space.sm },
  proofText: { fontFamily: fonts.bold, fontSize: 14, color: c.onSurface },
  section: { paddingHorizontal: space.xl, paddingVertical: 72, backgroundColor: c.surface },
  oat: { backgroundColor: c.surfaceSecondary },
  eyebrow: { fontFamily: fonts.bold, fontSize: 12, letterSpacing: 1.6, textTransform: "uppercase", color: c.accentText, marginBottom: space.sm },
  h2: { fontFamily: fonts.black, fontSize: 32, lineHeight: 38, letterSpacing: -0.8, color: c.onSurface, marginBottom: space.xxl },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: space.xl, alignItems: "stretch" },
  card: { flexGrow: 1, flexBasis: 280, backgroundColor: c.surface, borderRadius: radius.lg, borderWidth: 1, borderColor: c.border, padding: space.xl, gap: space.sm },
  cardFeatured: { borderWidth: 2, borderColor: c.brandPrimary, shadowColor: c.brandSecondary, shadowOpacity: 0.1, shadowRadius: 24, shadowOffset: { width: 0, height: 10 } },
  ribbon: { position: "absolute", top: -14, alignSelf: "center", backgroundColor: c.sage, borderRadius: radius.pill, paddingHorizontal: space.md, paddingVertical: 5, zIndex: 1 },
  ribbonText: { fontFamily: fonts.black, fontSize: 12, letterSpacing: 0.8, color: c.brandSecondary },
  cardImg: { height: 190, borderRadius: radius.md, backgroundColor: c.surfaceSecondary, padding: space.sm, marginBottom: space.sm },
  kicker: { fontFamily: fonts.bold, fontSize: 12, letterSpacing: 1.2, textTransform: "uppercase", color: c.accentText },
  cardTitle: { fontFamily: fonts.bold, fontSize: 18, lineHeight: 25, color: c.onSurface },
  blurb: { fontFamily: fonts.regular, fontSize: 15, lineHeight: 25, color: c.onSurface },
  cardCta: { marginTop: "auto", paddingTop: space.md },
  allLink: { fontFamily: fonts.bold, fontSize: 15, color: c.accentText, marginTop: space.xxl, paddingVertical: space.xs },
  step: { flexGrow: 1, flexBasis: 240, gap: space.sm, borderTopWidth: 2, borderTopColor: c.sage, paddingTop: space.lg },
  stepNum: { width: 40, height: 40, borderRadius: 20, backgroundColor: c.sageTint, borderWidth: 1.5, borderColor: c.sage, alignItems: "center", justifyContent: "center" },
  stepNumText: { fontFamily: fonts.black, fontSize: 16, color: c.onSurface },
  bar: { backgroundColor: c.surface, borderTopWidth: 1, borderTopColor: c.border, paddingHorizontal: space.xl, paddingVertical: space.xl },
  barInner: { width: "100%", maxWidth: STORE_MAX, alignSelf: "center", flexDirection: "row", flexWrap: "wrap", alignItems: "center", gap: space.lg },
  barText: { flex: 1, minWidth: 240, fontFamily: fonts.medium, fontSize: 15, lineHeight: 24, color: c.onSurface },
}));
