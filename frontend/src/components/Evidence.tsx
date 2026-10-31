import * as Haptics from "expo-haptics";
import { BookOpenText } from "phosphor-react-native";
import { useState } from "react";
import { Platform, Pressable, Text, View } from "react-native";

import { CASES, CITATION, STATS, STUDY_NOTE } from "../content";
import { fonts, radius, space } from "../fonts";
import { makeStyles, useTheme } from "../theme";
import { BeforeAfterSlider } from "./BeforeAfterSlider";
import { SectionHeader } from "./SectionHeader";

export function Evidence() {
  const styles = useStyles();
  const { colors } = useTheme();
  const [caseId, setCaseId] = useState(CASES[0].id);
  const active = CASES.find((c) => c.id === caseId)!;

  return (
    <View role="region" aria-label="Clinical evidence" style={styles.section} testID="evidence-section">
      <SectionHeader
        eyebrow="Clinical evidence"
        title="Results you can measure."
        body="Outcomes from a peer-reviewed clinical evaluation of BioRNA Antiscar micro-tips patches."
      />

      <View style={styles.dashboard} testID="stats-dashboard" role="list">
        {STATS.map((s, i) => (
          <View key={s.id} role="listitem" style={[styles.stat, i > 0 && styles.statDivider]} testID={`stat-${s.id}`}>
            <Text style={styles.statValue}>{s.value}</Text>
            <Text style={styles.statLabel}>{s.label}</Text>
          </View>
        ))}
        <Text style={styles.studyNote}>{STUDY_NOTE}</Text>
      </View>

      <View style={styles.dual} testID="clinical-data-container">
        <View style={styles.citeCard} role="article" testID="citation-card">
          <View style={styles.citeIcon}>
            <BookOpenText size={20} color={colors.onBrandPrimary} weight="bold" />
          </View>
          <View style={styles.flex}>
            <Text style={styles.citeKicker}>Peer-reviewed · Published</Text>
            <Text style={styles.citeText} testID="citation-text">{CITATION}</Text>
          </View>
        </View>

        <View style={styles.baCard} role="figure" testID="before-after-card">
          <View style={styles.tabs} role="tablist">
            {CASES.map((c) => {
              const selected = c.id === caseId;
              return (
                <Pressable
                  key={c.id}
                  role="tab"
                  aria-selected={selected}
                  testID={`case-tab-${c.id}`}
                  onPress={() => {
                    if (Platform.OS !== "web") Haptics.selectionAsync();
                    setCaseId(c.id);
                  }}
                  style={[styles.tab, selected && styles.tabActive]}
                >
                  <Text style={[styles.tabText, selected && styles.tabTextActive]}>{c.tab}</Text>
                </Pressable>
              );
            })}
          </View>
          <BeforeAfterSlider key={active.id} before={active.before} after={active.after} label={active.tab} testID={`before-after-slider-${active.id}`} />
          <Text style={styles.caption}>{active.caption}</Text>
          <Text style={styles.quote} testID="case-quote">{active.quote}</Text>
          <Text style={styles.hint}>Drag the handle to compare · Real user photos, results vary</Text>
        </View>
      </View>
    </View>
  );
}

const useStyles = makeStyles((c) => ({
  section: { paddingHorizontal: space.xl, paddingVertical: space.xxxl, backgroundColor: c.surface },
  dashboard: {
    backgroundColor: c.surfaceInverse,
    borderRadius: radius.lg,
    paddingHorizontal: space.xl,
    paddingVertical: space.sm,
  },
  stat: { paddingVertical: space.xl },
  statDivider: { borderTopWidth: 1, borderTopColor: c.onSurfaceTertiary },
  statValue: { fontFamily: fonts.black, fontSize: 64, lineHeight: 68, letterSpacing: -2.5, color: c.onSurfaceInverse },
  statLabel: { fontFamily: fonts.medium, fontSize: 15, lineHeight: 21, color: c.onScrimMuted, marginTop: space.xs },
  dual: { gap: space.md, marginTop: space.xl },
  citeCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: space.lg,
    backgroundColor: c.brandTertiary,
    borderRadius: radius.lg,
    padding: space.lg + 2,
  },
  citeIcon: {
    width: 44,
    height: 44,
    borderRadius: radius.md,
    backgroundColor: c.brandPrimary,
    alignItems: "center",
    justifyContent: "center",
  },
  flex: { flex: 1 },
  citeKicker: { fontFamily: fonts.bold, fontSize: 11, letterSpacing: 1, textTransform: "uppercase", color: c.brandPrimary },
  citeText: { fontFamily: fonts.bold, fontSize: 15, lineHeight: 21, color: c.onSurface, marginTop: 2 },
  baCard: { backgroundColor: c.surfaceSecondary, borderRadius: radius.lg, padding: space.md },
  tabs: { flexDirection: "row", backgroundColor: c.surfaceTertiary, borderRadius: radius.md, padding: 3, marginBottom: space.md },
  tab: { flex: 1, height: 44, borderRadius: radius.md - 2, alignItems: "center", justifyContent: "center" },
  tabActive: { backgroundColor: c.surface },
  tabText: { fontFamily: fonts.medium, fontSize: 14, color: c.muted },
  tabTextActive: { color: c.onSurface },
  caption: { fontFamily: fonts.bold, fontSize: 14, color: c.onSurface, marginTop: space.md, paddingHorizontal: space.xs },
  quote: { fontFamily: fonts.regular, fontSize: 14, lineHeight: 20, color: c.onSurfaceTertiary, marginTop: space.xs, paddingHorizontal: space.xs },
  studyNote: { fontFamily: fonts.regular, fontSize: 11, color: c.muted, paddingBottom: space.lg },
  hint: { fontFamily: fonts.regular, fontSize: 12, color: c.muted, marginTop: 2, paddingHorizontal: space.xs, paddingBottom: space.xs },
}));
