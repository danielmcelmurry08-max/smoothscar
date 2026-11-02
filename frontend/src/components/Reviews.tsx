import { useQuery } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import { PencilSimpleLine, SealCheck } from "phosphor-react-native";
import { Pressable, ScrollView, Text, View } from "react-native";

import { getReviews, photoUrl } from "../api";
import { fonts, radius, space } from "../fonts";
import { makeStyles, useTheme } from "../theme";
import { ReviewPhotos } from "./ReviewPhotos";
import { SectionHeader } from "./SectionHeader";
import { Stars } from "./Stars";

export function Reviews() {
  const styles = useStyles();
  const { colors } = useTheme();
  const router = useRouter();
  const { data } = useQuery({ queryKey: ["reviews"], queryFn: getReviews });
  const count = data?.count ?? 0;

  return (
    <View role="region" aria-label="Customer reviews" style={styles.section} testID="reviews-section">
      <View style={styles.head}>
        <SectionHeader eyebrow="Verified buyer reviews" title="Rated by our customers." />
        <View style={styles.summary} testID="reviews-summary">
          {count ? (
            <>
              <Text style={styles.avg} testID="reviews-average">{data!.average?.toFixed(1)}</Text>
              <View style={styles.flex}>
                <Stars value={data!.average ?? 0} size={18} />
                <Text style={styles.countText}>Based on {count} verified review{count === 1 ? "" : "s"}</Text>
              </View>
            </>
          ) : (
            <Text style={styles.empty}>No reviews yet. Bought BioRNA? Be the first to share your experience.</Text>
          )}
        </View>
      </View>
      {count ? (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} snapToInterval={296} decelerationRate="fast" contentContainerStyle={styles.row}>
          {data!.reviews.map((r) => (
            <View key={r.id} style={styles.card} role="article" testID={`review-${r.id}`}>
              <Stars value={r.rating} />
              {r.title ? <Text style={styles.title}>{r.title}</Text> : null}
              <Text style={styles.text}>{r.body}</Text>
              {r.before_photo_url || r.after_photo_url ? <ReviewPhotos before={photoUrl(r.before_photo_url)} after={photoUrl(r.after_photo_url)} /> : null}
              <View style={styles.footer}>
                <View style={styles.nameRow}>
                  <Text style={styles.name}>{r.display_name}</Text>
                  <SealCheck size={14} color={colors.success} weight="fill" />
                  <Text style={styles.verified}>Verified buyer</Text>
                </View>
                {r.scar_type ? <Text style={styles.scar}>{r.scar_type}</Text> : null}
              </View>
            </View>
          ))}
        </ScrollView>
      ) : null}
      <View style={styles.head}>
        <Pressable testID="write-review-button" onPress={() => router.push("/review")} style={({ pressed }) => [styles.cta, pressed && styles.pressed]}>
          <PencilSimpleLine size={18} color={colors.brandPrimary} weight="bold" />
          <Text style={styles.ctaText}>Write a review</Text>
        </Pressable>
      </View>
    </View>
  );
}

const useStyles = makeStyles((c) => ({
  section: { paddingBottom: space.xxxl, backgroundColor: c.surfaceSecondary },
  head: { paddingHorizontal: space.xl },
  summary: { flexDirection: "row", alignItems: "center", gap: space.lg, backgroundColor: c.surface, borderRadius: radius.lg, padding: space.lg, borderWidth: 1, borderColor: c.border, marginBottom: space.lg },
  avg: { fontFamily: fonts.black, fontSize: 40, color: c.onSurface, letterSpacing: -1 },
  flex: { flex: 1, gap: space.xs },
  countText: { fontFamily: fonts.medium, fontSize: 13, color: c.muted },
  empty: { flex: 1, fontFamily: fonts.regular, fontSize: 14, lineHeight: 20, color: c.muted },
  row: { paddingHorizontal: space.xl, gap: space.md, paddingBottom: space.lg },
  card: { width: 284, flexShrink: 0, backgroundColor: c.surface, borderRadius: radius.lg, padding: space.xl - 4, borderWidth: 1, borderColor: c.border, gap: space.sm },
  title: { fontFamily: fonts.bold, fontSize: 16, color: c.onSurface },
  text: { flex: 1, fontFamily: fonts.regular, fontSize: 15, lineHeight: 22, color: c.onSurface },
  footer: { borderTopWidth: 1, borderTopColor: c.divider, paddingTop: space.md, marginTop: space.xs },
  nameRow: { flexDirection: "row", alignItems: "center", gap: space.xs },
  name: { fontFamily: fonts.bold, fontSize: 14, color: c.onSurface, marginRight: space.xs },
  verified: { fontFamily: fonts.medium, fontSize: 12, color: c.success },
  scar: { fontFamily: fonts.regular, fontSize: 12, color: c.muted, marginTop: 2 },
  cta: { height: 52, borderRadius: radius.pill, borderWidth: 1.5, borderColor: c.brandPrimary, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: space.sm, backgroundColor: c.surface },
  pressed: { opacity: 0.85 },
  ctaText: { fontFamily: fonts.bold, fontSize: 15, color: c.brandPrimary },
}));
