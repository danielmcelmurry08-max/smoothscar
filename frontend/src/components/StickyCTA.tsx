import { BlurView } from "expo-blur";
import * as Haptics from "expo-haptics";
import { ArrowRight } from "phosphor-react-native";
import { Platform, Pressable, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { fonts, MAX_WIDTH, radius, space } from "../fonts";
import { makeStyles, useTheme } from "../theme";
import { PayBadges } from "./PayBadges";

export const STICKY_HEIGHT = 108;

export function StickyCTA({ onPress }: { onPress: () => void }) {
  const styles = useStyles();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  return (
    <View style={styles.outer} pointerEvents="box-none">
      <BlurView intensity={40} tint="light" style={[styles.bar, { paddingBottom: insets.bottom + space.md }]}>
        <View style={styles.inner}>
          <Pressable
            testID="sticky-order-now-button"
            onPress={() => {
              if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              onPress();
            }}
            style={({ pressed }) => [styles.cta, pressed && styles.pressed]}
          >
            <Text style={styles.ctaText}>Order Now — Try BioRNA-C</Text>
            <ArrowRight size={18} color={colors.onBrandPrimary} weight="bold" />
          </Pressable>
          <View style={styles.badges}>
            <PayBadges />
          </View>
        </View>
      </BlurView>
    </View>
  );
}

const useStyles = makeStyles((c) => ({
  outer: { position: "absolute", left: 0, right: 0, bottom: 0 },
  bar: {
    backgroundColor: c.glass,
    borderTopWidth: 1,
    borderTopColor: c.border,
    paddingTop: space.md,
    paddingHorizontal: space.lg,
    overflow: "hidden",
  },
  inner: { width: "100%", maxWidth: MAX_WIDTH, alignSelf: "center" },
  cta: {
    height: 56,
    borderRadius: radius.pill,
    backgroundColor: c.brandPrimary,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: space.sm,
    shadowColor: c.brandPrimary,
    shadowOpacity: 0.3,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 6 },
    elevation: 6,
  },
  pressed: { opacity: 0.88, transform: [{ scale: 0.985 }] },
  ctaText: { fontFamily: fonts.bold, fontSize: 17, color: c.onBrandPrimary },
  badges: { marginTop: space.sm },
}));
