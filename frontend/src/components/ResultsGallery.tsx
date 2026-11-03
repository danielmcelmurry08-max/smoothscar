import { useRouter } from "expo-router";
import { useState } from "react";
import { Pressable, Text, View } from "react-native";

import { CLINICAL_CASES, RESULT_CATEGORIES, RESULTS_DISCLAIMER, ResultCategory } from "../clinicalResults";
import { fonts, radius, space } from "../fonts";
import { makeStyles } from "../theme";
import { BeforeAfterSlider } from "./BeforeAfterSlider";
import { Button, Section } from "./Store";

type Props = { only?: ResultCategory; showLink?: boolean; tone?: "plain" | "soft"; title?: string };

export function ResultsGallery({ only, showLink, tone = "plain", title = "Real Patients. Documented Results." }: Props) {
  const styles = useStyles();
  const router = useRouter();
  const cats = only ? [only] : RESULT_CATEGORIES;
  const [cat, setCat] = useState<ResultCategory | "All">(only ?? "All");
  const cases = CLINICAL_CASES.filter((c) => (cat === "All" ? true : c.category === cat));
  const [activeId, setActiveId] = useState<string | undefined>(cases[0]?.id);
  const active = cases.find((c) => c.id === activeId) ?? cases[0];
  const pending = CLINICAL_CASES.some((c) => !c.approved);

  return (
    <Section eyebrow="Clinical results" title={title} body="Explore clinical photographs documenting changes in scar appearance during BioRNA use." tone={tone} testID="results-gallery">
      {only ? null : (
        <View style={styles.tabs} role="tablist" aria-label="Scar category">
          {(["All", ...cats] as const).map((k) => (
            <Pressable
              key={k}
              role="tab"
              aria-selected={cat === k}
              onPress={() => {
                setCat(k);
                setActiveId(CLINICAL_CASES.find((c) => k === "All" || c.category === k)?.id);
              }}
              style={[styles.tab, cat === k && styles.tabOn]}
              testID={`results-tab-${k}`}
            >
              <Text style={[styles.tabText, cat === k && styles.tabTextOn]}>{k}</Text>
            </Pressable>
          ))}
        </View>
      )}
      {cases.length > 1 ? (
        <View style={styles.cases}>
          {cases.map((c) => (
            <Pressable key={c.id} onPress={() => setActiveId(c.id)} style={[styles.caseBtn, active?.id === c.id && styles.caseOn]} aria-pressed={active?.id === c.id}>
              <Text style={styles.caseText}>
                {c.title} · {c.interval}
              </Text>
            </Pressable>
          ))}
        </View>
      ) : null}
      {active ? (
        <View style={styles.card} testID={`results-case-${active.id}`}>
          <View style={styles.sliderCol}>
          <BeforeAfterSlider
            key={active.id}
            before={active.approved ? active.before : null}
            after={active.approved ? active.after : null}
            aspect={active.aspect}
            label={`${active.title}, ${active.interval}`}
            testID={`slider-${active.id}`}
          />
          </View>
          <View style={styles.meta}>
            <Text style={styles.cat}>{active.category}</Text>
            <Text style={styles.title}>
              {active.title} · {active.interval}
            </Text>
            <Text style={styles.body}>{active.description}</Text>
            <Text style={styles.fine}>Source: {active.source}</Text>
          </View>
        </View>
      ) : null}
      {pending ? <Text style={styles.fine}>Clinical photographs will appear here once permission and patient consent for publication are confirmed.</Text> : null}
      <Text style={styles.fine}>{RESULTS_DISCLAIMER}</Text>
      {showLink ? (
        <View style={styles.link}>
          <Button label="View Clinical Results" onPress={() => router.push("/results")} testID="view-clinical-results" />
        </View>
      ) : null}
    </Section>
  );
}

const useStyles = makeStyles((c) => ({
  tabs: { flexDirection: "row", flexWrap: "wrap", gap: space.sm, marginBottom: space.lg },
  tab: { minHeight: 44, justifyContent: "center", paddingHorizontal: space.lg, borderRadius: radius.pill, borderWidth: 1, borderColor: c.borderStrong, backgroundColor: c.surface },
  tabOn: { backgroundColor: c.brandSecondary, borderColor: c.brandSecondary },
  tabText: { fontFamily: fonts.bold, fontSize: 14, color: c.onSurface },
  tabTextOn: { color: c.onBrandSecondary },
  cases: { flexDirection: "row", flexWrap: "wrap", gap: space.sm, marginBottom: space.lg },
  caseBtn: { minHeight: 40, justifyContent: "center", paddingHorizontal: space.md, borderRadius: radius.md, borderWidth: 1, borderColor: c.border, backgroundColor: c.surface },
  caseOn: { borderColor: c.sage, backgroundColor: c.sageTint },
  caseText: { fontFamily: fonts.medium, fontSize: 13, color: c.onSurface },
  card: { flexDirection: "row", flexWrap: "wrap", gap: space.xl, alignItems: "flex-start" },
  sliderCol: { flexGrow: 2, flexBasis: 320, maxWidth: 640 },
  meta: { flexGrow: 1, flexBasis: 260, gap: space.xs },
  cat: { fontFamily: fonts.bold, fontSize: 12, letterSpacing: 1.2, textTransform: "uppercase", color: c.accentText },
  title: { fontFamily: fonts.bold, fontSize: 18, color: c.onSurface },
  body: { fontFamily: fonts.regular, fontSize: 15, lineHeight: 24, color: c.onSurface },
  fine: { fontFamily: fonts.regular, fontSize: 13, lineHeight: 20, color: c.muted, marginTop: space.md },
  link: { marginTop: space.xl, alignItems: "flex-start" },
}));
