import { Image } from "expo-image";
import { Linking, Text, View } from "react-native";

import { fonts, radius, space } from "../fonts";
import { BROCHURES } from "../providerForms";
import { makeStyles } from "../theme";
import { Button } from "./Store";

export function BrochureList() {
  const styles = useStyles();
  return (
    <View style={styles.grid} testID="brochure-list">
      {BROCHURES.map((b) => (
        <View key={b.id} style={styles.card} testID={`brochure-${b.id}`}>
          <View style={styles.thumb}>
            <Image source={b.image} style={styles.img} contentFit="contain" accessibilityLabel={`${b.title} — ${b.subtitle}`} />
          </View>
          <Text style={styles.sub}>{b.subtitle}</Text>
          <Text style={styles.title}>{b.title}</Text>
          <Text style={styles.desc}>{b.description}</Text>
          <View style={styles.actions}>
            <Button label={b.viewLabel} onPress={() => Linking.openURL(b.viewUrl)} testID={`brochure-${b.id}-view`} />
            <Button label={b.downloadLabel} variant="secondary" onPress={() => Linking.openURL(b.downloadUrl)} testID={`brochure-${b.id}-download`} />
          </View>
          <Text style={styles.src}>Hosted by the manufacturer, RNAscence Biotechnology (biorna.sg).</Text>
        </View>
      ))}
    </View>
  );
}

const useStyles = makeStyles((c) => ({
  grid: { flexDirection: "row", flexWrap: "wrap", gap: space.lg },
  card: { flexGrow: 1, flexBasis: 280, maxWidth: 520, backgroundColor: c.surface, borderRadius: radius.lg, borderWidth: 1, borderColor: c.border, padding: space.lg, gap: space.xs },
  thumb: { height: 180, borderRadius: radius.md, backgroundColor: c.surfaceSecondary, marginBottom: space.sm, padding: space.sm },
  img: { width: "100%", height: "100%" },
  sub: { fontFamily: fonts.bold, fontSize: 12, letterSpacing: 0.6, textTransform: "uppercase", color: c.accentText },
  title: { fontFamily: fonts.bold, fontSize: 18, color: c.brandSecondary },
  desc: { fontFamily: fonts.regular, fontSize: 14, lineHeight: 21, color: c.onSurfaceTertiary },
  actions: { flexDirection: "row", flexWrap: "wrap", gap: space.sm, marginTop: space.md },
  src: { fontFamily: fonts.regular, fontSize: 12, color: c.muted, marginTop: space.sm },
}));
