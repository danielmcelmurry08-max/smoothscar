import { Image } from "expo-image";
import Head from "expo-router/head";
import { Link, useRouter } from "expo-router";
import { Drop, HandPalm, Minus, Moon, Plus, ShoppingBag, Sparkle, Sun } from "phosphor-react-native";
import { ReactNode } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useCart } from "../cart";
import { formatUSD, priceOf, Product, skuLabel } from "../catalog";
import { fonts, radius, space } from "../fonts";
import { makeStyles, useTheme } from "../theme";

export const STORE_MAX = 1080;

const NAV = [
  { href: "/shop", label: "Shop" },
  { href: "/biorna-c", label: "BioRNA-C" },
  { href: "/science", label: "Science" },
  { href: "/providers", label: "For Providers" },
] as const;

const PRO_LINKS = [
  { href: "/providers", label: "Provider Portal" },
  { href: "/provider-resources", label: "Product Brochures" },
  { href: "/providers/partner", label: "Partnership Inquiry" },
  { href: "/providers/samples", label: "Sample Request" },
  { href: "/providers/wholesale", label: "Wholesale Inquiry" },
] as const;

export function StoreScreen({ title, description, children, testID }: { title: string; description: string; children: ReactNode; testID?: string }) {
  const styles = useStyles();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { count } = useCart();
  return (
    <View style={styles.root} testID={testID}>
      <Head>
        <title>{title}</title>
        <meta name="description" content={description} />
      </Head>
      <View style={[styles.header, { paddingTop: insets.top + space.sm }]}>
        <View style={styles.headerInner}>
          <Link href="/" accessibilityLabel="BioRNA home">
            <Text style={styles.logo}>
              BioRNA<Text style={styles.logoLight}> US</Text>
            </Text>
          </Link>
          <View style={styles.nav}>
            {NAV.map((n) => (
              <Link key={n.href} href={n.href} style={styles.navLink}>
                {n.label}
              </Link>
            ))}
            <Pressable testID="header-cart" onPress={() => router.push("/cart")} style={styles.cartBtn} accessibilityLabel={`Cart, ${count} items`}>
              <ShoppingBag size={22} color={colors.brandPrimary} weight="bold" />
              {count ? (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{count}</Text>
                </View>
              ) : null}
            </Pressable>
          </View>
        </View>
      </View>
      <ScrollView contentContainerStyle={styles.scroll}>
        <View role="main" style={styles.main}>
          {children}
        </View>
        <View style={[styles.footer, { paddingBottom: insets.bottom + space.xxl }]}>
          <View style={styles.footerInner}>
            <Text style={styles.footerBrand}>BioRNA Antiscar · BioRNA-C</Text>
            <Text style={styles.footerText}>
              Made by RNAscence Biotechnology, Singapore. Results vary between people. These products are not intended to diagnose, treat, cure or prevent any disease. Online checkout is not
              yet available.
            </Text>
            <Text style={styles.footerBrand}>Healthcare Professionals</Text>
            <View style={styles.footerLinks}>
              {PRO_LINKS.map((l) => (
                <Link key={l.href} href={l.href} style={styles.footerLink}>
                  {l.label}
                </Link>
              ))}
            </View>
            <Link href="/privacy" style={styles.footerLink}>
              Privacy Policy
            </Link>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

export function Section({ eyebrow, title, body, children, tone = "plain", testID }: { eyebrow?: string; title: string; body?: string; children?: ReactNode; tone?: "plain" | "soft"; testID?: string }) {
  const styles = useStyles();
  return (
    <View style={[styles.section, tone === "soft" && styles.sectionSoft]} testID={testID}>
      <View style={styles.sectionInner}>
        {eyebrow ? <Text style={styles.eyebrow}>{eyebrow}</Text> : null}
        <Text role="heading" aria-level={2} style={styles.h2}>
          {title}
        </Text>
        {body ? <Text style={styles.body}>{body}</Text> : null}
        {children ? <View style={styles.sectionBody}>{children}</View> : null}
      </View>
    </View>
  );
}

export function Button({ label, onPress, variant = "primary", disabled, testID }: { label: string; onPress: () => void; variant?: "primary" | "secondary"; disabled?: boolean; testID?: string }) {
  const styles = useStyles();
  return (
    <Pressable
      testID={testID}
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      style={({ pressed }) => [styles.btn, variant === "secondary" && styles.btnSecondary, disabled && styles.btnDisabled, pressed && !disabled && styles.pressed]}
    >
      <Text style={[styles.btnText, variant === "secondary" && styles.btnTextSecondary, disabled && styles.btnTextDisabled]}>{label}</Text>
    </Pressable>
  );
}

export function PriceTag({ product, size = "md" }: { product: Product; size?: "md" | "lg" }) {
  const styles = useStyles();
  const price = priceOf(product.id);
  return price == null ? (
    <Text style={[styles.priceSoon, size === "lg" && styles.priceSoonLg]}>Price coming soon</Text>
  ) : (
    <Text style={[styles.price, size === "lg" && styles.priceLg]}>{formatUSD(price)}</Text>
  );
}

export function ProductCard({ product, featured }: { product: Product; featured?: boolean }) {
  const styles = useStyles();
  const router = useRouter();
  const accent = product.accent === "girl" ? styles.accentGirl : product.accent === "boy" ? styles.accentBoy : null;
  return (
    <Pressable
      testID={`product-card-${product.id}`}
      onPress={() => router.push(`/product/${product.id}`)}
      style={({ pressed }) => [styles.card, featured && styles.cardFeatured, accent, pressed && styles.pressed]}
    >
      <View style={styles.cardImgWrap}>
        <Image source={product.image} style={styles.cardImg} contentFit="contain" accessibilityLabel={`${product.name} packaging`} />
        {product.accent ? (
          <View style={[styles.ribbon, product.accent === "girl" ? styles.ribbonGirl : styles.ribbonBoy]}>
            <Text style={styles.ribbonText}>{product.accent === "girl" ? "Baby Girl" : "Baby Boy"}</Text>
          </View>
        ) : null}
      </View>
      <Text style={styles.cardLine}>{product.line}</Text>
      <Text style={styles.cardName}>{product.name}</Text>
      <Text style={styles.cardMeta}>
        {product.patches} patches · {skuLabel(product)}
      </Text>
      <View style={styles.cardFoot}>
        <PriceTag product={product} />
        <Text style={styles.cardLink}>View →</Text>
      </View>
    </Pressable>
  );
}

export function ProductGrid({ products }: { products: Product[] }) {
  const styles = useStyles();
  return <View style={styles.grid}>{products.map((p) => <ProductCard key={p.id} product={p} featured={p.id === "antiscar-original"} />)}</View>;
}

export function QtyStepper({ value, onChange, testID }: { value: number; onChange: (n: number) => void; testID?: string }) {
  const styles = useStyles();
  const { colors } = useTheme();
  return (
    <View style={styles.stepper} testID={testID}>
      <Pressable onPress={() => onChange(Math.max(1, value - 1))} style={styles.stepBtn} accessibilityLabel="Decrease quantity">
        <Minus size={16} color={colors.brandPrimary} weight="bold" />
      </Pressable>
      <Text style={styles.stepVal} aria-live="polite">
        {value}
      </Text>
      <Pressable onPress={() => onChange(Math.min(20, value + 1))} style={styles.stepBtn} accessibilityLabel="Increase quantity">
        <Plus size={16} color={colors.brandPrimary} weight="bold" />
      </Pressable>
    </View>
  );
}

export function BulletList({ items, numbered }: { items: string[]; numbered?: boolean }) {
  const styles = useStyles();
  return (
    <View style={styles.list}>
      {items.map((t, i) => (
        <View key={t} style={styles.listRow}>
          <Text style={styles.listMark}>{numbered ? `${i + 1}.` : "•"}</Text>
          <Text style={styles.listText}>{t}</Text>
        </View>
      ))}
    </View>
  );
}

/** Simple illustration of a micro-tip patch on skin: backing, cone micro-tips, skin layers. */
function MicroTipDiagram() {
  const styles = useStyles();
  return (
    <View style={styles.diagram} role="img" aria-label="Illustration: patch backing with dissolvable micro-tips resting in the top layer of skin">
      <Text style={styles.diagramLabel}>Patch backing</Text>
      <View style={styles.diagramBacking} />
      <View style={styles.diagramTips}>
        {Array.from({ length: 14 }).map((_, i) => (
          <View key={i} style={styles.tip} />
        ))}
      </View>
      <View style={styles.diagramSkinTop} />
      <View style={styles.diagramSkinDeep} />
      <Text style={styles.diagramLabel}>Dissolvable hyaluronic-acid micro-tips · skin surface</Text>
    </View>
  );
}

export const HOW_STEPS = [
  { title: "Apply", body: "Apply the patch to clean, dry, fully closed skin." },
  { title: "Engage", body: "Dissolvable hyaluronic-acid micro-tips engage the skin." },
  { title: "Deliver", body: "The patch delivers its formulated ingredients through the micro-tip system." },
  { title: "Continue", body: "Continued use is intended to improve the appearance of scars." },
];

export function HowItWorks() {
  const styles = useStyles();
  return (
    <Section eyebrow="How BioRNA works" title="Micro-tip patch technology, in four steps." tone="soft" testID="how-it-works">
      <View style={styles.howWrap}>
        <MicroTipDiagram />
        <View style={styles.steps}>
          {HOW_STEPS.map((s, i) => (
            <View key={s.title} style={styles.step}>
              <View style={styles.stepNum}>
                <Text style={styles.stepNumText}>{i + 1}</Text>
              </View>
              <View style={styles.flex}>
                <Text style={styles.stepTitle}>{s.title}</Text>
                <Text style={styles.stepBody}>{s.body}</Text>
              </View>
            </View>
          ))}
        </View>
      </View>
    </Section>
  );
}

const USE_ICONS = [HandPalm, Drop, Sparkle, Moon, Sun] as const;
const USE_STEPS = [
  { title: "Wait for closure", body: "Apply only after the wound has fully closed. Never use on open wounds." },
  { title: "Clean & dry", body: "Wash the skin gently and let it dry completely." },
  { title: "Apply & press", body: "Place the patch over the scar and press gently to secure." },
  { title: "Wear overnight", body: "Wear for approximately 8–12 hours." },
  { title: "Replace daily", body: "Use a new patch each day." },
];

export function HowToUse() {
  const styles = useStyles();
  const { colors } = useTheme();
  return (
    <Section
      eyebrow="How to use"
      title="Original BioRNA Antiscar"
      body="Follow the instructions on your package. BioRNA-C users should follow the directions on the BioRNA-C package insert."
      testID="how-to-use"
    >
      <View style={styles.useGrid}>
        {USE_STEPS.map((s, i) => {
          const Icon = USE_ICONS[i];
          return (
            <View key={s.title} style={styles.useCard}>
              <View style={styles.useIcon}>
                <Icon size={22} color={colors.brandPrimary} weight="duotone" />
              </View>
              <Text style={styles.stepTitle}>{s.title}</Text>
              <Text style={styles.stepBody}>{s.body}</Text>
            </View>
          );
        })}
      </View>
    </Section>
  );
}

const silver = "#C9D1DC";

const useStyles = makeStyles((c) => ({
  root: { flex: 1, backgroundColor: c.surface },
  flex: { flex: 1 },
  header: { backgroundColor: c.surface, borderBottomWidth: 1, borderBottomColor: c.border, paddingBottom: space.sm, paddingHorizontal: space.lg },
  headerInner: { width: "100%", maxWidth: STORE_MAX, alignSelf: "center", flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: space.md },
  logo: { fontFamily: fonts.black, fontSize: 20, color: c.brandSecondary, letterSpacing: -0.4 },
  logoLight: { fontFamily: fonts.regular, color: c.muted },
  nav: { flexDirection: "row", flexWrap: "wrap", justifyContent: "flex-end", alignItems: "center", columnGap: space.md, flexShrink: 1 },
  navLink: { fontFamily: fonts.medium, fontSize: 14, color: c.onSurface, paddingVertical: space.sm },
  cartBtn: { width: 44, height: 44, alignItems: "center", justifyContent: "center" },
  badge: { position: "absolute", top: 4, right: 2, minWidth: 18, height: 18, paddingHorizontal: 4, borderRadius: 9, backgroundColor: c.brandPrimary, alignItems: "center", justifyContent: "center" },
  badgeText: { fontFamily: fonts.bold, fontSize: 11, color: c.onBrandPrimary },
  scroll: { flexGrow: 1 },
  main: { flexGrow: 1 },
  footer: { backgroundColor: c.brandSecondary, paddingTop: space.xxl, paddingHorizontal: space.xl },
  footerInner: { width: "100%", maxWidth: STORE_MAX, alignSelf: "center", gap: space.sm },
  footerBrand: { fontFamily: fonts.bold, fontSize: 15, color: c.onBrandSecondary },
  footerLinks: { flexDirection: "row", flexWrap: "wrap", columnGap: space.lg, rowGap: space.xs },
  footerLink: { fontFamily: fonts.medium, fontSize: 14, color: c.onBrandSecondary, textDecorationLine: "underline", paddingVertical: space.xs },
  footerText: { fontFamily: fonts.regular, fontSize: 13, lineHeight: 20, color: c.onBrandSecondary, opacity: 0.8 },
  section: { paddingVertical: space.xxxl, paddingHorizontal: space.xl },
  sectionSoft: { backgroundColor: c.brandTertiary },
  sectionInner: { width: "100%", maxWidth: STORE_MAX, alignSelf: "center" },
  sectionBody: { marginTop: space.xl },
  eyebrow: { fontFamily: fonts.bold, fontSize: 12, letterSpacing: 1.4, textTransform: "uppercase", color: c.brandPrimary, marginBottom: space.sm },
  h2: { fontFamily: fonts.black, fontSize: 28, lineHeight: 34, letterSpacing: -0.6, color: c.brandSecondary },
  body: { fontFamily: fonts.regular, fontSize: 16, lineHeight: 24, color: c.onSurfaceTertiary, marginTop: space.md, maxWidth: 680 },
  btn: { minHeight: 48, paddingHorizontal: space.xl, borderRadius: radius.pill, backgroundColor: c.brandPrimary, alignItems: "center", justifyContent: "center" },
  btnSecondary: { backgroundColor: c.surface, borderWidth: 1.5, borderColor: c.brandPrimary },
  btnDisabled: { backgroundColor: c.surfaceTertiary, borderColor: c.surfaceTertiary },
  btnText: { fontFamily: fonts.bold, fontSize: 15, color: c.onBrandPrimary },
  btnTextSecondary: { color: c.brandPrimary },
  btnTextDisabled: { color: c.muted },
  pressed: { opacity: 0.85 },
  price: { fontFamily: fonts.black, fontSize: 18, color: c.onSurface },
  priceLg: { fontSize: 28 },
  priceSoon: { fontFamily: fonts.bold, fontSize: 14, color: c.muted },
  priceSoonLg: { fontSize: 18 },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: space.lg },
  card: { flexGrow: 1, flexBasis: 240, maxWidth: 520, backgroundColor: c.surface, borderRadius: radius.lg, padding: space.lg, borderWidth: 1, borderColor: silver, gap: 2 },
  cardFeatured: { borderColor: c.brandPrimary, borderWidth: 2 },
  accentGirl: { backgroundColor: "#FBF5FC", borderColor: "#D9C2E3" },
  accentBoy: { backgroundColor: "#F2F7FD", borderColor: "#B9D2EE" },
  cardImgWrap: { height: 200, borderRadius: radius.md, backgroundColor: c.surfaceSecondary, overflow: "hidden", marginBottom: space.md },
  cardImg: { width: "100%", height: "100%" },
  ribbon: { position: "absolute", top: space.sm, left: space.sm, borderRadius: radius.pill, paddingHorizontal: 10, paddingVertical: 3 },
  ribbonGirl: { backgroundColor: "#8E5BA8" },
  ribbonBoy: { backgroundColor: "#2F6DB5" },
  ribbonText: { fontFamily: fonts.bold, fontSize: 11, color: "#FFFFFF", letterSpacing: 0.4 },
  cardLine: { fontFamily: fonts.bold, fontSize: 12, color: c.brandPrimary, letterSpacing: 0.6, textTransform: "uppercase" },
  cardName: { fontFamily: fonts.bold, fontSize: 17, color: c.onSurface },
  cardMeta: { fontFamily: fonts.regular, fontSize: 13, color: c.muted },
  cardFoot: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: space.md },
  cardLink: { fontFamily: fonts.bold, fontSize: 14, color: c.brandPrimary },
  stepper: { flexDirection: "row", alignItems: "center", borderWidth: 1, borderColor: silver, borderRadius: radius.pill, alignSelf: "flex-start" },
  stepBtn: { width: 44, height: 44, alignItems: "center", justifyContent: "center" },
  stepVal: { minWidth: 32, textAlign: "center", fontFamily: fonts.bold, fontSize: 16, color: c.onSurface },
  list: { gap: space.sm },
  listRow: { flexDirection: "row", gap: space.sm },
  listMark: { fontFamily: fonts.bold, fontSize: 15, lineHeight: 22, color: c.brandPrimary, minWidth: 18 },
  listText: { flex: 1, fontFamily: fonts.regular, fontSize: 15, lineHeight: 22, color: c.onSurfaceTertiary },
  howWrap: { flexDirection: "row", flexWrap: "wrap", gap: space.xl },
  diagram: { flexGrow: 1, flexBasis: 280, backgroundColor: c.surface, borderRadius: radius.lg, padding: space.xl, borderWidth: 1, borderColor: silver, gap: space.xs },
  diagramLabel: { fontFamily: fonts.medium, fontSize: 12, color: c.muted },
  diagramBacking: { height: 14, borderRadius: 4, backgroundColor: silver },
  diagramTips: { flexDirection: "row", justifyContent: "space-between", paddingHorizontal: 6 },
  tip: { width: 0, height: 0, borderLeftWidth: 7, borderRightWidth: 7, borderTopWidth: 22, borderLeftColor: "transparent", borderRightColor: "transparent", borderTopColor: c.brandPrimary, opacity: 0.75 },
  diagramSkinTop: { height: 26, marginTop: -16, backgroundColor: "#F4D9CC", opacity: 0.85, borderTopLeftRadius: 4, borderTopRightRadius: 4 },
  diagramSkinDeep: { height: 40, backgroundColor: "#EBC3B1", borderBottomLeftRadius: 4, borderBottomRightRadius: 4 },
  steps: { flexGrow: 1, flexBasis: 280, gap: space.lg },
  step: { flexDirection: "row", gap: space.md, alignItems: "flex-start" },
  stepNum: { width: 32, height: 32, borderRadius: 16, backgroundColor: c.brandPrimary, alignItems: "center", justifyContent: "center" },
  stepNumText: { fontFamily: fonts.black, fontSize: 14, color: c.onBrandPrimary },
  stepTitle: { fontFamily: fonts.bold, fontSize: 16, color: c.brandSecondary },
  stepBody: { fontFamily: fonts.regular, fontSize: 14, lineHeight: 21, color: c.onSurfaceTertiary, marginTop: 2 },
  useGrid: { flexDirection: "row", flexWrap: "wrap", gap: space.md },
  useCard: { flexGrow: 1, flexBasis: 170, backgroundColor: c.surfaceSecondary, borderRadius: radius.lg, padding: space.lg, gap: space.xs },
  useIcon: { width: 44, height: 44, borderRadius: 22, backgroundColor: c.brandTertiary, alignItems: "center", justifyContent: "center", marginBottom: space.xs },
}));
