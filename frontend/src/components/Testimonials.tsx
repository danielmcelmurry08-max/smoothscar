import { Quotes, Star } from "phosphor-react-native";
import { ScrollView, Text, View } from "react-native";

import { TESTIMONIALS } from "../content";
import { fonts, radius, space } from "../fonts";
import { makeStyles, useTheme } from "../theme";
import { SectionHeader } from "./SectionHeader";

export function Testimonials() {
  const styles = useStyles();
  const { colors } = useTheme();
  return (
    <View role="region" aria-label="Hear from our users" style={styles.section} testID="testimonials-section">
      <View style={styles.head}>
        <SectionHeader eyebrow="Hear from our users" title="Real scars. Real stories." />
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} snapToInterval={296} decelerationRate="fast" contentContainerStyle={styles.row}>
        {TESTIMONIALS.map((t) => (
          <View key={t.id} style={styles.card} role="article" testID={`testimonial-${t.id}`}>
            <View style={styles.stars}>
              {[0, 1, 2, 3, 4].map((i) => (
                <Star key={i} size={14} color={colors.brandPrimary} weight="fill" />
              ))}
            </View>
            <Quotes size={22} color={colors.brandTertiary} weight="fill" />
            <Text style={styles.text}>{t.text}</Text>
            <View style={styles.footer}>
              <Text style={styles.name}>{t.name}</Text>
              <Text style={styles.scar}>{t.scar}</Text>
            </View>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const useStyles = makeStyles((c) => ({
  section: { paddingVertical: space.xxxl, backgroundColor: c.surfaceSecondary },
  head: { paddingHorizontal: space.xl },
  row: { paddingHorizontal: space.xl, gap: space.md },
  card: {
    width: 284,
    flexShrink: 0,
    backgroundColor: c.surface,
    borderRadius: radius.lg,
    padding: space.xl - 4,
    borderWidth: 1,
    borderColor: c.border,
    gap: space.sm,
  },
  stars: { flexDirection: "row", gap: 2 },
  text: { flex: 1, fontFamily: fonts.regular, fontSize: 15, lineHeight: 22, color: c.onSurface },
  footer: { borderTopWidth: 1, borderTopColor: c.divider, paddingTop: space.md, marginTop: space.xs },
  name: { fontFamily: fonts.bold, fontSize: 14, color: c.onSurface },
  scar: { fontFamily: fonts.regular, fontSize: 12, color: c.muted, marginTop: 2 },
}));
