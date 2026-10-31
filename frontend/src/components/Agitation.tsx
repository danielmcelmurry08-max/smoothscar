import { SmileySad, MagnifyingGlass, Warning } from "phosphor-react-native";
import { Text, View } from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";

import { AGITATION } from "../content";
import { fonts, radius, space } from "../fonts";
import { makeStyles, useTheme } from "../theme";
import { SectionHeader } from "./SectionHeader";

const ICONS = [SmileySad, Warning, MagnifyingGlass];

export function Agitation() {
  const styles = useStyles();
  const { colors } = useTheme();
  return (
    <View role="region" aria-label="Are you feeling" style={styles.section} testID="agitation-section">
      <SectionHeader eyebrow="Are you feeling" title="You're not alone with your scar." />
      <View style={styles.list}>
        {AGITATION.map((a, i) => {
          const Icon = ICONS[i];
          return (
            <Animated.View key={a.id} entering={FadeInDown.delay(i * 90)} style={styles.card} testID={`agitation-card-${a.id}`} role="article">
              <View style={styles.iconWrap}>
                <Icon size={20} color={colors.brandPrimary} weight="duotone" />
              </View>
              <View style={styles.textWrap}>
                <Text role="heading" aria-level={3} style={styles.title}>{a.title}</Text>
                <Text style={styles.body}>{a.body}</Text>
              </View>
            </Animated.View>
          );
        })}
      </View>
      <Text style={styles.bridge}>There&apos;s finally a science-backed answer.</Text>
    </View>
  );
}

const useStyles = makeStyles((c) => ({
  section: { paddingHorizontal: space.xl, paddingVertical: space.xxxl, backgroundColor: c.surfaceSecondary },
  list: { gap: space.md },
  card: {
    flexDirection: "row",
    gap: space.lg,
    backgroundColor: c.surface,
    borderRadius: radius.lg,
    padding: space.lg + 2,
    borderWidth: 1,
    borderColor: c.border,
  },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: radius.pill,
    backgroundColor: c.brandTertiary,
    alignItems: "center",
    justifyContent: "center",
  },
  textWrap: { flex: 1 },
  title: { fontFamily: fonts.bold, fontSize: 17, lineHeight: 22, color: c.onSurface },
  body: { fontFamily: fonts.regular, fontSize: 14, lineHeight: 21, color: c.muted, marginTop: space.xs },
  bridge: { fontFamily: fonts.bold, fontSize: 16, color: c.brandPrimary, marginTop: space.xl },
}));
