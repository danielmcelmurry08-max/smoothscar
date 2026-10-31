import * as Haptics from "expo-haptics";
import { CaretDown, GraduationCap, Flask, Buildings } from "phosphor-react-native";
import { useState } from "react";
import { Platform, Pressable, Text, View } from "react-native";
import Animated, { FadeIn } from "react-native-reanimated";

import { ACCORDIONS, TRUST } from "../content";
import { fonts, radius, space } from "../fonts";
import { makeStyles, useTheme } from "../theme";
import { SectionHeader } from "./SectionHeader";

const TRUST_ICONS = [GraduationCap, Buildings, Flask];

export function TrustInfo() {
  const styles = useStyles();
  const { colors } = useTheme();
  const [open, setOpen] = useState<string | null>(ACCORDIONS[0].id);

  return (
    <View style={styles.section}>
      <View role="region" aria-label="Scientific trust" testID="trust-section">
        <Text style={styles.trustLabel}>Incubated & supported by</Text>
        <View style={styles.logos}>
          {TRUST.map((t, i) => {
            const Icon = TRUST_ICONS[i];
            return (
              <View key={t.id} style={styles.logo} testID={`trust-logo-${t.id}`} role="img" aria-label={`${t.name} ${t.sub}`}>
                <Icon size={22} color={colors.onSurface} weight="light" />
                <Text style={styles.logoName}>{t.name}</Text>
                <Text style={styles.logoSub} numberOfLines={3}>{t.sub}</Text>
              </View>
            );
          })}
        </View>
      </View>

      <View role="region" aria-label="Product information" style={styles.info} testID="info-accordions">
        <SectionHeader eyebrow="Good to know" title="The science, simply." />
        {ACCORDIONS.map((a) => {
          const isOpen = open === a.id;
          return (
            <View key={a.id} style={styles.acc}>
              <Pressable
                testID={`accordion-${a.id}`}
                aria-expanded={isOpen}
                onPress={() => {
                  if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setOpen(isOpen ? null : a.id);
                }}
                style={styles.accHead}
              >
                <Text role="heading" aria-level={3} style={styles.accTitle}>{a.title}</Text>
                <View style={{ transform: [{ rotate: isOpen ? "180deg" : "0deg" }] }}>
                  <CaretDown size={18} color={colors.onSurface} weight="bold" />
                </View>
              </Pressable>
              {isOpen ? (
                <Animated.View entering={FadeIn.duration(220)} style={styles.accBody} testID={`accordion-body-${a.id}`}>
                  {a.items.map((it) => (
                    <Text key={it} style={styles.accText}>{it}</Text>
                  ))}
                </Animated.View>
              ) : null}
            </View>
          );
        })}
      </View>
    </View>
  );
}

const useStyles = makeStyles((c) => ({
  section: { paddingHorizontal: space.xl, paddingVertical: space.xxxl, backgroundColor: c.surface },
  trustLabel: {
    fontFamily: fonts.bold,
    fontSize: 12,
    letterSpacing: 1.4,
    textTransform: "uppercase",
    color: c.muted,
    textAlign: "center",
    marginBottom: space.lg,
  },
  logos: { flexDirection: "row", gap: space.sm },
  logo: {
    flex: 1,
    alignItems: "center",
    paddingVertical: space.lg,
    paddingHorizontal: space.sm,
    borderRadius: radius.md,
    backgroundColor: c.surfaceSecondary,
    gap: 2,
  },
  logoName: { fontFamily: fonts.black, fontSize: 13, color: c.onSurface, textAlign: "center", marginTop: space.xs },
  logoSub: { fontFamily: fonts.regular, fontSize: 10, lineHeight: 13, color: c.muted, textAlign: "center" },
  info: { marginTop: space.xxxl },
  acc: { borderBottomWidth: 1, borderBottomColor: c.divider },
  accHead: { minHeight: 60, flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  accTitle: { fontFamily: fonts.bold, fontSize: 17, color: c.onSurface },
  accBody: { paddingBottom: space.lg, gap: space.sm },
  accText: { fontFamily: fonts.regular, fontSize: 15, lineHeight: 23, color: c.onSurfaceTertiary },
}));
