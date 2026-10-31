import { useQuery } from "@tanstack/react-query";
import * as Haptics from "expo-haptics";
import { Copy, ShareNetwork, UsersThree } from "phosphor-react-native";
import { useState } from "react";
import { Platform, Pressable, Share, Text, View } from "react-native";

import { getReferral } from "../api";
import { fonts, radius, space } from "../fonts";
import { makeStyles, useTheme } from "../theme";

const SITE = process.env.EXPO_PUBLIC_SITE_URL;

export function ReferralCard({ code }: { code: string }) {
  const styles = useStyles();
  const { colors } = useTheme();
  const [copied, setCopied] = useState(false);
  const { data } = useQuery({ queryKey: ["referral", code], queryFn: () => getReferral(code) });
  const per = data?.friends_per_reward ?? 3;
  const done = data ? per - data.friends_to_next_reward : 0;
  const link = `${SITE}/?code=${code}`;
  const message = `I use BioRNA Antiscar, the steroid-free micro-tips scar patch from Singapore. Get $25 off your first order with my code ${code}: ${link}`;

  const share = async () => {
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (Platform.OS === "web") {
      const nav = globalThis.navigator as Navigator | undefined;
      if (nav?.share) {
        await nav.share({ text: message }).catch(() => undefined);
        return;
      }
      if (nav?.clipboard) {
        const ok = await nav.clipboard.writeText(message).then(() => true).catch(() => false);
        setCopied(ok);
      }
      return;
    }
    await Share.share({ message });
  };

  return (
    <View style={styles.card} testID="referral-card">
      <View style={styles.head}>
        <UsersThree size={22} color={colors.brandPrimary} weight="duotone" />
        <Text style={styles.title}>Give $25, get a free box</Text>
      </View>
      <Text style={styles.body}>Friends get $25 off their first order. Every {per} friends who buy earns you a free box.</Text>
      <View style={styles.codeBox}>
        <Text style={styles.code} testID="referral-code" selectable>{code}</Text>
      </View>
      <View style={styles.progressRow} testID="referral-progress">
        {Array.from({ length: per }).map((_, i) => (
          <View key={i} style={[styles.dot, i < done && styles.dotOn]} />
        ))}
        <Text style={styles.progressText}>
          {done}/{per} friends{data?.rewards_earned ? ` · ${data.rewards_earned} free box${data.rewards_earned > 1 ? "es" : ""} earned` : ""}
        </Text>
      </View>
      <Pressable testID="referral-share-button" onPress={share} style={({ pressed }) => [styles.btn, pressed && styles.pressed]}>
        {copied ? <Copy size={18} color={colors.onBrandPrimary} weight="bold" /> : <ShareNetwork size={18} color={colors.onBrandPrimary} weight="bold" />}
        <Text style={styles.btnText}>{copied ? "Copied — paste it to a friend" : "Share my code"}</Text>
      </Pressable>
    </View>
  );
}

const useStyles = makeStyles((c) => ({
  card: { width: "100%", backgroundColor: c.surface, borderRadius: radius.lg, padding: space.lg + 2, marginTop: space.xl, borderWidth: 1.5, borderColor: c.brandPrimary },
  head: { flexDirection: "row", alignItems: "center", gap: space.sm },
  title: { fontFamily: fonts.black, fontSize: 18, color: c.onSurface },
  body: { fontFamily: fonts.regular, fontSize: 14, lineHeight: 20, color: c.onSurfaceTertiary, marginTop: space.xs },
  codeBox: { marginTop: space.lg, height: 56, borderRadius: radius.md, backgroundColor: c.brandTertiary, alignItems: "center", justifyContent: "center" },
  code: { fontFamily: fonts.black, fontSize: 24, letterSpacing: 3, color: c.onBrandTertiary },
  progressRow: { flexDirection: "row", alignItems: "center", gap: space.xs + 2, marginTop: space.md },
  dot: { width: 12, height: 12, borderRadius: radius.pill, backgroundColor: c.surfaceTertiary },
  dotOn: { backgroundColor: c.success },
  progressText: { fontFamily: fonts.medium, fontSize: 13, color: c.muted, marginLeft: space.xs },
  btn: { height: 48, borderRadius: radius.pill, backgroundColor: c.brandPrimary, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: space.sm, marginTop: space.lg },
  pressed: { opacity: 0.85 },
  btnText: { fontFamily: fonts.bold, fontSize: 15, color: c.onBrandPrimary },
}));
