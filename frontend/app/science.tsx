import { useRouter } from "expo-router";
import { Baby, Certificate, Drop, Feather, GraduationCap, Leaf, ShieldCheck, Stethoscope } from "phosphor-react-native";
import { ReactNode } from "react";
import { Pressable, Text, View } from "react-native";

import { STORE_MAX, StoreScreen } from "@/src/components/Store";
import { fonts, radius, space } from "@/src/fonts";
import { makeStyles, useTheme } from "@/src/theme";

// Every statement below is drawn from BioRNA packaging or the manufacturer's site.
// Add efficacy metrics or expert quotes ONLY after the study data, US advertising
// compliance and written permission from the person quoted have been reviewed.
type Metric = { value: string; label: string; source: string };
type Quote = { quote: string; name: string; credential: string };
const APPROVED_METRICS: Metric[] = [];
const APPROVED_QUOTES: Quote[] = [];

const ANATOMY = [
  { n: "01", title: "The incision closes", body: "After a C-section, your body closes the incision and starts building new collagen to repair the skin. This takes months, not days." },
  { n: "02", title: "Collagen remodels", body: "Sometimes collagen builds up unevenly. The scar can then look raised, thick, tight or darker than the skin around it." },
  { n: "03", title: "Micro-tips engage the skin", body: "Once the skin has fully closed, the BioRNA-C patch rests on the scar. Its dissolvable hyaluronic-acid micro-tips gently engage the surface, with no needles involved." },
  { n: "04", title: "Hydrate, protect, repeat", body: "The patch hydrates and protects the scar while it delivers its RNA and hyaluronic acid formulation. Continued use is intended to reduce the scar's appearance." },
];

const TRUST = [
  { Icon: ShieldCheck, title: "Hypoallergenic", body: "Dermatologically validated, as stated on the package." },
  { Icon: Feather, title: "Gentle on sensitive skin", body: "BioRNA-C is labeled as suitable for sensitive skin." },
  { Icon: Drop, title: "Hydrates & protects", body: "Made to keep the healing scar moisturized and covered." },
  { Icon: Leaf, title: "Needle-free micro-tips", body: "The hyaluronic-acid micro-tips dissolve. Nothing pierces the skin the way a needle does." },
  { Icon: GraduationCap, title: "Research-born", body: "Developed by RNAscence Biotechnology at the Lee Kong Chian School of Medicine incubator in Singapore." },
  { Icon: Certificate, title: "Patent filed", body: "Patents have been filed in the USA, Singapore and China." },
];

const STUDY = [
  { value: "RCT", label: "Randomized clinical trial" },
  { value: "Single-blind", label: "Assessors did not know which scar received which treatment" },
  { value: "Intra-individual", label: "Each participant's treated scar was compared with a control on the same person" },
  { value: "2024", label: "Published in Annals of the Academy of Medicine, Singapore (53:113-6)" },
];

const ASK = [
  { Icon: Baby, role: "Your OB-GYN", q: "Has my incision fully closed, and when can I start using a scar-care patch?" },
  { Icon: Stethoscope, role: "A dermatologist", q: "Is my scar raised or thickening, and which scar-care options suit my skin?" },
  { Icon: Leaf, role: "A pelvic floor physical therapist", q: "Can scar care fit into my postpartum recovery plan, alongside scar mobilization?" },
];

export default function Science() {
  const styles = useStyles();
  const { colors } = useTheme();
  const router = useRouter();
  return (
    <StoreScreen
      title="The Clinical Science Behind SmoothScar | BioRNA-C"
      description="How the BioRNA-C micro-tip patch works on a C-section scar, the research behind it, and what to ask your care team."
      testID="science-screen"
    >
      {/* 1. Hero */}
      <Band tone="cream" testID="science-hero">
        <Text style={styles.eyebrow}>Science & Efficacy</Text>
        <Text role="heading" aria-level={1} style={styles.h1}>
          The Clinical Science Behind SmoothScar
        </Text>
        <Text style={styles.lead}>
          Your body did something remarkable. Here, in plain language, is how a C-section scar forms, how the BioRNA-C micro-tip patch supports your skin as it heals, and what the
          research looked at.
        </Text>
        <View style={styles.rule} />
      </Band>

      {/* 2. Anatomy of healing */}
      <Band tone="oat" testID="science-anatomy">
        <SectionHead eyebrow="The anatomy of healing" title="From incision to scar, step by step." />
        <View style={styles.grid}>
          {ANATOMY.map((a) => (
            <View key={a.n} style={styles.stepCard}>
              <Text style={styles.stepNum}>{a.n}</Text>
              <View style={styles.stepRule} />
              <Text style={styles.cardTitle}>{a.title}</Text>
              <Text style={styles.body}>{a.body}</Text>
            </View>
          ))}
        </View>
        <View style={styles.diagram} role="img" aria-label="Diagram: a patch with dissolvable micro-tips resting on the skin surface above the scar">
          <Text style={styles.diagramLabel}>Patch backing</Text>
          <View style={styles.backing} />
          <View style={styles.tips}>
            {Array.from({ length: 16 }).map((_, i) => (
              <View key={i} style={styles.tip} />
            ))}
          </View>
          <View style={styles.skin} />
          <View style={styles.scarLine} />
          <Text style={styles.diagramLabel}>Dissolvable hyaluronic-acid micro-tips · skin surface · healing scar</Text>
        </View>
      </Band>

      {/* 3. Trust factors */}
      <Band tone="cream" testID="science-trust">
        <SectionHead eyebrow="Quality & safety" title="What's on the label, and why it matters." />
        <View style={styles.grid}>
          {TRUST.map(({ Icon, title, body }) => (
            <View key={title} style={styles.trust}>
              <View style={styles.iconFrame}>
                <Icon size={24} color={colors.sage} weight="regular" />
              </View>
              <View style={styles.flex}>
                <Text style={styles.cardTitle}>{title}</Text>
                <Text style={styles.body}>{body}</Text>
              </View>
            </View>
          ))}
        </View>
        <Text style={styles.fine}>For use only on fully closed, intact skin. Stop using the patch and talk to your doctor if irritation develops.</Text>
      </Band>

      {/* 4. Clinical study */}
      <Band tone="oat" testID="science-study">
        <SectionHead eyebrow="Clinical research" title="How BioRNA was studied." />
        <View style={styles.stats}>
          {(APPROVED_METRICS.length ? APPROVED_METRICS : STUDY).map((m) => (
            <View key={m.value} style={styles.stat}>
              <Text style={styles.statValue}>{m.value}</Text>
              <View style={styles.statRule} />
              <Text style={styles.statLabel}>{m.label}</Text>
            </View>
          ))}
        </View>
        <Text style={styles.fine}>Individual results vary. BioRNA is intended to help improve the appearance of scars. It is not a cure, and results are not guaranteed.</Text>
      </Band>

      {/* 5. Expert perspectives */}
      <Band tone="cream" testID="science-experts">
        {APPROVED_QUOTES.length ? (
          <>
            <SectionHead eyebrow="Expert perspectives" title="What clinicians say." />
            <View style={styles.grid}>
              {APPROVED_QUOTES.map((q) => (
                <View key={q.name} style={styles.quote}>
                  <Text style={styles.quoteText}>“{q.quote}”</Text>
                  <Text style={styles.cardTitle}>{q.name}</Text>
                  <Text style={styles.fine}>{q.credential}</Text>
                </View>
              ))}
            </View>
          </>
        ) : (
          <>
            <SectionHead eyebrow="Your care team" title="Bring these questions to your experts." />
            <View style={styles.grid}>
              {ASK.map(({ Icon, role, q }) => (
                <View key={role} style={styles.quote}>
                  <View style={styles.iconFrame}>
                    <Icon size={24} color={colors.sage} />
                  </View>
                  <Text style={styles.cardTitle}>{role}</Text>
                  <Text style={styles.quoteText}>“{q}”</Text>
                </View>
              ))}
            </View>
          </>
        )}
      </Band>

      {/* 6. CTA */}
      <Band tone="oat" testID="science-cta">
        <View style={styles.cta}>
          <Text role="heading" aria-level={2} style={[styles.h2, styles.center]}>
            Now that you know the science, find your pack.
          </Text>
          <Text style={[styles.lead, styles.center]}>BioRNA-C was designed for C-section scars. Start with a 2-patch Starter Pack or browse the full collection.</Text>
          <View style={styles.ctaRow}>
            <RoseButton label="Explore BioRNA-C" onPress={() => router.push("/biorna-c")} testID="science-cta-shop" />
            <Pressable onPress={() => router.push("/provider-resources")} style={styles.ghost} accessibilityRole="link" testID="science-cta-brochure">
              <Text style={styles.ghostText}>Download the brochure</Text>
            </Pressable>
          </View>
        </View>
      </Band>
    </StoreScreen>
  );
}

function Band({ tone, children, testID }: { tone: "cream" | "oat"; children: ReactNode; testID?: string }) {
  const styles = useStyles();
  return (
    <View style={[styles.band, tone === "oat" && styles.bandOat]} testID={testID}>
      <View style={styles.inner}>{children}</View>
    </View>
  );
}

function SectionHead({ eyebrow, title }: { eyebrow: string; title: string }) {
  const styles = useStyles();
  return (
    <View style={styles.head}>
      <Text style={styles.eyebrow}>{eyebrow}</Text>
      <Text role="heading" aria-level={2} style={styles.h2}>
        {title}
      </Text>
    </View>
  );
}

function RoseButton({ label, onPress, testID }: { label: string; onPress: () => void; testID?: string }) {
  const styles = useStyles();
  return (
    <Pressable onPress={onPress} accessibilityRole="button" testID={testID} style={({ pressed }) => [styles.rose, pressed && styles.pressed]}>
      <Text style={styles.roseText}>{label}</Text>
    </Pressable>
  );
}

const useStyles = makeStyles((c) => ({
  flex: { flex: 1 },
  band: { backgroundColor: c.cream, paddingHorizontal: space.xl, paddingVertical: 72 },
  bandOat: { backgroundColor: c.oat },
  inner: { width: "100%", maxWidth: STORE_MAX, alignSelf: "center" },
  head: { marginBottom: space.xxl, maxWidth: 640 },
  eyebrow: { fontFamily: fonts.bold, fontSize: 12, letterSpacing: 1.8, textTransform: "uppercase", color: c.slate, opacity: 0.75, marginBottom: space.md },
  h1: { fontFamily: fonts.black, fontSize: 44, lineHeight: 50, letterSpacing: -1.2, color: c.slate, maxWidth: 720 },
  h2: { fontFamily: fonts.bold, fontSize: 30, lineHeight: 37, letterSpacing: -0.6, color: c.slate },
  lead: { fontFamily: fonts.regular, fontSize: 18, lineHeight: 30, color: c.onCream, marginTop: space.lg, maxWidth: 640 },
  rule: { width: 64, height: 3, borderRadius: 2, backgroundColor: c.sage, marginTop: space.xxl },
  body: { fontFamily: fonts.regular, fontSize: 15, lineHeight: 24, color: c.onCream },
  fine: { fontFamily: fonts.regular, fontSize: 13, lineHeight: 20, color: c.onCream, opacity: 0.75, marginTop: space.xl, maxWidth: 640 },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: space.xl },
  stepCard: { flexGrow: 1, flexBasis: 220, backgroundColor: c.cream, borderRadius: radius.lg, padding: space.xl, gap: space.sm },
  stepNum: { fontFamily: fonts.black, fontSize: 28, color: c.sage },
  stepRule: { height: 1, backgroundColor: c.sage, opacity: 0.5, marginVertical: space.xs },
  cardTitle: { fontFamily: fonts.bold, fontSize: 17, lineHeight: 24, color: c.slate },
  diagram: { marginTop: space.xxl, backgroundColor: c.sageTint, borderRadius: radius.lg, padding: space.xl, gap: space.xs },
  diagramLabel: { fontFamily: fonts.medium, fontSize: 12, color: c.slate },
  backing: { height: 14, borderRadius: 4, backgroundColor: c.cream, borderWidth: 1, borderColor: c.sage },
  tips: { flexDirection: "row", justifyContent: "space-between", paddingHorizontal: 6 },
  tip: { width: 0, height: 0, borderLeftWidth: 7, borderRightWidth: 7, borderTopWidth: 22, borderLeftColor: "transparent", borderRightColor: "transparent", borderTopColor: c.sage },
  skin: { height: 30, marginTop: -16, backgroundColor: c.oat, borderRadius: 4 },
  scarLine: { height: 4, marginTop: -17, marginHorizontal: "15%", marginBottom: 13, borderRadius: 2, backgroundColor: c.rose },
  trust: { flexGrow: 1, flexBasis: 280, flexDirection: "row", gap: space.lg, alignItems: "flex-start", paddingVertical: space.md, borderTopWidth: 1, borderTopColor: c.sage },
  iconFrame: { width: 52, height: 52, borderRadius: 26, borderWidth: 1.5, borderColor: c.sage, backgroundColor: c.sageTint, alignItems: "center", justifyContent: "center" },
  stats: { flexDirection: "row", flexWrap: "wrap", gap: space.xl },
  stat: { flexGrow: 1, flexBasis: 200, gap: space.sm },
  statValue: { fontFamily: fonts.black, fontSize: 34, lineHeight: 40, letterSpacing: -0.8, color: c.slate },
  statRule: { width: 40, height: 2, backgroundColor: c.sage },
  statLabel: { fontFamily: fonts.regular, fontSize: 15, lineHeight: 23, color: c.onCream },
  quote: { flexGrow: 1, flexBasis: 240, backgroundColor: c.oat, borderRadius: radius.lg, padding: space.xl, gap: space.md },
  quoteText: { fontFamily: fonts.medium, fontSize: 16, lineHeight: 26, color: c.onCream },
  cta: { alignItems: "center" },
  center: { textAlign: "center" },
  ctaRow: { flexDirection: "row", flexWrap: "wrap", justifyContent: "center", alignItems: "center", gap: space.lg, marginTop: space.xxl },
  rose: { minHeight: 52, paddingHorizontal: space.xxl, borderRadius: radius.md, shadowColor: c.slate, shadowOpacity: 0.12, shadowRadius: 12, shadowOffset: { width: 0, height: 4 }, backgroundColor: c.rose, alignItems: "center", justifyContent: "center" },
  roseText: { fontFamily: fonts.bold, fontSize: 18, color: c.onRose },
  pressed: { opacity: 0.85 },
  ghost: { minHeight: 48, justifyContent: "center", paddingHorizontal: space.md },
  ghostText: { fontFamily: fonts.bold, fontSize: 15, color: c.slate, textDecorationLine: "underline" },
}));
