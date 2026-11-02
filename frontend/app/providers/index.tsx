import { useRouter } from "expo-router";
import { Text, View } from "react-native";

import { PRODUCTS } from "@/src/catalog";
import { BrochureList } from "@/src/components/Brochures";
import { BulletList, Button, ProductGrid, Section, STORE_MAX, StoreScreen } from "@/src/components/Store";
import { fonts, radius, space } from "@/src/fonts";
import { PROVIDER_TYPES } from "@/src/providerForms";
import { makeStyles } from "@/src/theme";

export default function Providers() {
  const styles = useStyles();
  const router = useRouter();
  const go = (p: string) => () => router.push(p as never);
  return (
    <StoreScreen
      title="Partner With SmoothScar | BioRNA for Healthcare Providers"
      description="Bring BioRNA scar-care solutions to your patients. Clinical resources, product availability, practice integration and wholesale opportunities."
      testID="providers-screen"
    >
      <View style={styles.hero}>
        <View style={styles.inner}>
          <Text style={styles.eyebrow}>For healthcare professionals</Text>
          <Text role="heading" aria-level={1} style={styles.h1}>
            Partner With SmoothScar
          </Text>
          <Text style={styles.sub}>
            Bring innovative BioRNA scar-care solutions to your patients. Connect with our team to explore clinical resources, product availability, practice integration, and wholesale
            opportunities.
          </Text>
          <View style={styles.ctas}>
            <Button label="Become a Provider Partner" onPress={go("/providers/partner")} testID="cta-partner" />
            <Button label="Request Product Samples" variant="secondary" onPress={go("/providers/samples")} testID="cta-samples" />
            <Button label="Wholesale & Distribution Inquiry" variant="secondary" onPress={go("/providers/wholesale")} testID="cta-wholesale" />
            <Button label="Download Clinical Resources" variant="secondary" onPress={go("/provider-resources")} testID="cta-resources" />
          </View>
        </View>
      </View>

      <Section eyebrow="Why offer BioRNA?" title="A simple, needle-free option for scar care.">
        <BulletList
          items={[
            "A patch with dissolvable hyaluronic-acid micro-tips. The patient applies it at home on fully closed skin.",
            "Developed by RNAscence Biotechnology in Singapore, using RNA and hyaluronic acid technology.",
            "Includes products for general post-surgical scars (BioRNA Antiscar) and for C-section scars (BioRNA-C).",
            "Results vary between patients. BioRNA is intended to help improve the appearance of scars and is not a treatment for any disease.",
          ]}
        />
        <Text style={styles.who}>For: {PROVIDER_TYPES.filter((t) => t !== "Other").join(" · ")}</Text>
      </Section>

      <Section eyebrow="Products" title="Available BioRNA products" tone="soft">
        <ProductGrid products={PRODUCTS} />
      </Section>

      <Section eyebrow="Resources" title="Downloadable product brochures">
        <BrochureList />
      </Section>

      <Section eyebrow="Get involved" title="Work with our team" tone="soft">
        <View style={styles.cards}>
          {[
            { t: "Provider partnership", b: "Offer BioRNA to your patients, sell it in your practice, or evaluate the product clinically.", l: "Become a Provider Partner", p: "/providers/partner" },
            { t: "Sample requests", b: "Request evaluation samples. Every request is reviewed, and samples are not guaranteed.", l: "Request Product Samples", p: "/providers/samples" },
            { t: "Wholesale inquiries", b: "Ask about wholesale purchasing and distribution. We share pricing directly with qualified businesses.", l: "Wholesale Inquiry", p: "/providers/wholesale" },
          ].map((c) => (
            <View key={c.t} style={styles.card}>
              <Text style={styles.cardTitle}>{c.t}</Text>
              <Text style={styles.cardBody}>{c.b}</Text>
              <Button label={c.l} onPress={go(c.p)} />
            </View>
          ))}
        </View>
      </Section>

      <Section
        eyebrow="Contact our team"
        title="Questions?"
        body="Send us a partnership inquiry with your question in the comments and our team will reply by email. Please do not send patient information."
      >
        <View style={styles.ctas}>
          <Button label="Contact Our Team" onPress={go("/providers/partner")} />
        </View>
      </Section>
    </StoreScreen>
  );
}

const useStyles = makeStyles((c) => ({
  hero: { backgroundColor: c.brandSecondary, paddingHorizontal: space.xl, paddingVertical: space.xxxl },
  inner: { width: "100%", maxWidth: STORE_MAX, alignSelf: "center" },
  eyebrow: { fontFamily: fonts.bold, fontSize: 12, letterSpacing: 1.4, textTransform: "uppercase", color: c.onBrandSecondary, opacity: 0.8, marginBottom: space.md },
  h1: { fontFamily: fonts.black, fontSize: 40, lineHeight: 44, letterSpacing: -1, color: c.onBrandSecondary },
  sub: { fontFamily: fonts.regular, fontSize: 18, lineHeight: 27, color: c.onBrandSecondary, opacity: 0.9, marginTop: space.lg, maxWidth: 680 },
  ctas: { flexDirection: "row", flexWrap: "wrap", gap: space.md, marginTop: space.xl },
  who: { fontFamily: fonts.medium, fontSize: 14, lineHeight: 21, color: c.muted, marginTop: space.xl },
  cards: { flexDirection: "row", flexWrap: "wrap", gap: space.lg },
  card: { flexGrow: 1, flexBasis: 260, backgroundColor: c.surface, borderRadius: radius.lg, padding: space.xl, gap: space.sm, borderWidth: 1, borderColor: c.border },
  cardTitle: { fontFamily: fonts.bold, fontSize: 18, color: c.brandSecondary },
  cardBody: { fontFamily: fonts.regular, fontSize: 14, lineHeight: 21, color: c.onSurfaceTertiary, marginBottom: space.sm },
}));
