import { EnvelopeSimple } from "phosphor-react-native";
import { Linking, Pressable, Text, View } from "react-native";

import { CONTACT_EMAIL, DISCLAIMER } from "../content";
import { fonts, space } from "../fonts";
import { makeStyles, useTheme } from "../theme";

type Props = { onNavigate: (key: "evidence" | "buy" | "info") => void; onApply: () => void; bottomPad: number };

const LINKS: { key: "evidence" | "buy" | "info"; label: string }[] = [
  { key: "evidence", label: "Clinical Evidence" },
  { key: "buy", label: "Shop" },
  { key: "info", label: "How It Works" },
];

export function Footer({ onNavigate, onApply, bottomPad }: Props) {
  const styles = useStyles();
  const { colors } = useTheme();
  return (
    <View role="contentinfo" style={[styles.footer, { paddingBottom: bottomPad }]} testID="footer">
      <Text style={styles.logo}>
        BioRNA<Text style={styles.logoLight}> Antiscar</Text>
      </Text>
      <Text style={styles.tagline}>Developed from research at Lee Kong Chian School of Medicine, Singapore.</Text>
      <View role="navigation" style={styles.links}>
        {LINKS.map((l) => (
          <Pressable key={l.key} onPress={() => onNavigate(l.key)} testID={`footer-link-${l.key}`} style={styles.link}>
            <Text style={styles.linkText}>{l.label}</Text>
          </Pressable>
        ))}
        <Pressable onPress={onApply} testID="footer-link-clinic-partners" style={styles.link}>
          <Text style={styles.linkText}>Clinic Partners</Text>
        </Pressable>
      </View>
      <Pressable onPress={() => Linking.openURL(`mailto:${CONTACT_EMAIL}`)} style={styles.email} testID="footer-email-link">
        <EnvelopeSimple size={18} color={colors.onSurfaceInverse} />
        <Text style={styles.emailText}>{CONTACT_EMAIL}</Text>
      </Pressable>
      <Text style={styles.disclaimer} testID="footer-disclaimer">{DISCLAIMER}</Text>
      <Text style={styles.copy}>© {new Date().getFullYear()} BioRNA Pte. Ltd. · Singapore</Text>
    </View>
  );
}

const useStyles = makeStyles((c) => ({
  footer: { backgroundColor: c.surfaceInverse, paddingHorizontal: space.xl, paddingTop: space.xxxl },
  logo: { fontFamily: fonts.black, fontSize: 22, color: c.onSurfaceInverse, letterSpacing: -0.4 },
  logoLight: { fontFamily: fonts.regular },
  tagline: { fontFamily: fonts.regular, fontSize: 14, lineHeight: 20, color: c.onScrimMuted, marginTop: space.sm },
  links: { flexDirection: "row", flexWrap: "wrap", columnGap: space.xl, marginTop: space.xl },
  link: { minHeight: 44, justifyContent: "center" },
  linkText: { fontFamily: fonts.bold, fontSize: 14, color: c.onSurfaceInverse },
  email: { flexDirection: "row", alignItems: "center", gap: space.sm, minHeight: 44 },
  emailText: { fontFamily: fonts.medium, fontSize: 15, color: c.onSurfaceInverse, textDecorationLine: "underline" },
  disclaimer: { fontFamily: fonts.regular, fontSize: 12, lineHeight: 18, color: c.muted, marginTop: space.xl },
  copy: { fontFamily: fonts.regular, fontSize: 12, color: c.muted, marginTop: space.lg },
}));
