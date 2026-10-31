import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { Medal, Needle, ShieldCheck } from "phosphor-react-native";
import { Text, View } from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { IMAGES } from "../content";
import { fonts, radius, space } from "../fonts";
import { makeStyles, useTheme } from "../theme";

export function Hero() {
  const styles = useStyles();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  return (
    <View role="banner" style={styles.wrap} testID="hero-section">
      <View style={styles.imageWrap} role="img" aria-label="Confident mother after C-section recovery">
        <Image source={IMAGES.heroMother} style={styles.image} contentFit="cover" transition={300} accessibilityLabel="Confident mother smiling" />
        <LinearGradient colors={[colors.scrimClear, colors.scrimClear, colors.scrim]} locations={[0, 0.35, 1]} style={styles.scrim} />
        <View style={[styles.topBar, { paddingTop: insets.top + space.md }]}>
          <Text style={styles.logo} testID="brand-logo">
            BioRNA<Text style={styles.logoLight}> Antiscar</Text>
          </Text>
          <View style={styles.award}>
            <Medal size={12} color={colors.onBrandTertiary} weight="fill" />
            <Text style={styles.awardText}>Award-winning</Text>
          </View>
        </View>
        <Animated.View entering={FadeInDown.duration(600).delay(100)} style={styles.copy}>
          <Text style={styles.eyebrow}>LKCMedicine · Singapore</Text>
          <Text role="heading" aria-level={1} style={styles.h1} testID="hero-headline">
            Developed from Research.{"\n"}Backed by Science.
          </Text>
        </Animated.View>
      </View>

      <Animated.View entering={FadeInDown.duration(600).delay(250)} style={styles.below}>
        <View style={styles.productCard} testID="hero-product-card">
          <View style={styles.productImgWrap} role="img" aria-label="BioRNA Micro-Tips Patch">
            <Image source={IMAGES.productBox} style={styles.productImg} contentFit="cover" accessibilityLabel="BioRNA Antiscar box — patch with dissolvable micro-tips" />
          </View>
          <View style={styles.productInfo}>
            <Text style={styles.productKicker}>BioRNA-C</Text>
            <Text style={styles.productName}>Micro-Tips Scar Patch</Text>
            <Text style={styles.productMeta}>7 patches · RNA & hyaluronic acid</Text>
          </View>
        </View>
        <Text role="paragraph" style={styles.sub} testID="hero-subheadline">
          The steroid-free, painless micro-tips patch that targets the root cause of C-section, keloid, and hypertrophic scars.
        </Text>
        <View style={styles.chips}>
          <View style={styles.chip}>
            <ShieldCheck size={14} color={colors.brandPrimary} weight="bold" />
            <Text style={styles.chipText}>Steroid-free</Text>
          </View>
          <View style={styles.chip}>
            <Needle size={14} color={colors.brandPrimary} weight="bold" />
            <Text style={styles.chipText}>Painless micro-tips</Text>
          </View>
        </View>
      </Animated.View>
    </View>
  );
}

const useStyles = makeStyles((c) => ({
  wrap: { backgroundColor: c.surface },
  imageWrap: { height: 520, width: "100%", overflow: "hidden", backgroundColor: c.surfaceSecondary },
  image: { ...({ position: "absolute", top: 0, left: 0, right: 0, bottom: 0 } as const) },
  scrim: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0 },
  topBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: space.xl,
  },
  logo: { fontFamily: fonts.black, fontSize: 20, color: c.onSurfaceInverse, letterSpacing: -0.4 },
  logoLight: { fontFamily: fonts.regular },
  award: {
    flexDirection: "row",
    alignItems: "center",
    gap: space.xs,
    backgroundColor: c.brandTertiary,
    paddingHorizontal: space.sm + 2,
    height: 26,
    borderRadius: radius.pill,
  },
  awardText: { fontFamily: fonts.bold, fontSize: 11, color: c.onBrandTertiary },
  copy: { position: "absolute", left: space.xl, right: space.xl, bottom: space.xxl + space.xl },
  eyebrow: {
    fontFamily: fonts.bold,
    fontSize: 12,
    letterSpacing: 1.4,
    textTransform: "uppercase",
    color: c.onScrimMuted,
    marginBottom: space.sm,
  },
  h1: { fontFamily: fonts.black, fontSize: 36, lineHeight: 40, letterSpacing: -1, color: c.onSurfaceInverse },
  below: { paddingHorizontal: space.xl, marginTop: -space.xxl, paddingBottom: space.xxl },
  productCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: space.lg,
    backgroundColor: c.surface,
    borderRadius: radius.lg,
    padding: space.md,
    borderWidth: 1,
    borderColor: c.border,
    shadowColor: c.surfaceInverse,
    shadowOpacity: 0.08,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 8 },
    elevation: 4,
  },
  productImgWrap: { width: 76, height: 76, borderRadius: radius.md, overflow: "hidden", backgroundColor: c.surfaceSecondary },
  productImg: { width: "100%", height: "100%" },
  productInfo: { flex: 1 },
  productKicker: { fontFamily: fonts.bold, fontSize: 12, color: c.brandPrimary, letterSpacing: 0.6 },
  productName: { fontFamily: fonts.bold, fontSize: 17, color: c.onSurface, marginTop: 2 },
  productMeta: { fontFamily: fonts.regular, fontSize: 13, color: c.muted, marginTop: 2 },
  sub: { fontFamily: fonts.regular, fontSize: 17, lineHeight: 26, color: c.onSurfaceTertiary, marginTop: space.xl },
  chips: { flexDirection: "row", gap: space.sm, marginTop: space.lg, flexWrap: "wrap" },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: space.xs + 2,
    height: 32,
    paddingHorizontal: space.md,
    borderRadius: radius.pill,
    backgroundColor: c.brandTertiary,
  },
  chipText: { fontFamily: fonts.medium, fontSize: 13, color: c.onBrandTertiary },
}));
