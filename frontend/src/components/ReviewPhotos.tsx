import { Image } from "expo-image";
import { Text, View } from "react-native";

import { fonts, radius, space } from "../fonts";
import { makeStyles } from "../theme";

export function ReviewPhotos({ before, after }: { before: string | null; after: string | null }) {
  const styles = useStyles();
  return (
    <View style={styles.row} testID="review-photos">
      {[
        { label: "Before", uri: before },
        { label: "After", uri: after },
      ].map((p) =>
        p.uri ? (
          <View key={p.label} style={styles.cell}>
            <Image source={{ uri: p.uri }} style={styles.img} contentFit="cover" accessibilityLabel={`${p.label} photo`} />
            <View style={styles.tag}>
              <Text style={styles.tagText}>{p.label}</Text>
            </View>
          </View>
        ) : null,
      )}
    </View>
  );
}

const useStyles = makeStyles((c) => ({
  row: { flexDirection: "row", gap: space.xs },
  cell: { flex: 1, aspectRatio: 1, borderRadius: radius.md, overflow: "hidden", backgroundColor: c.surfaceSecondary },
  img: { width: "100%", height: "100%" },
  tag: { position: "absolute", left: space.xs, bottom: space.xs, backgroundColor: c.scrim, borderRadius: radius.sm, paddingHorizontal: 6, paddingVertical: 2 },
  tagText: { fontFamily: fonts.bold, fontSize: 10, color: c.onSurfaceInverse, letterSpacing: 0.4 },
}));
