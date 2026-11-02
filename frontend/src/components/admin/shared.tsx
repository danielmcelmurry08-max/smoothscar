import { EnvelopeSimple, Phone } from "phosphor-react-native";
import { Linking, Pressable, Text, View } from "react-native";

import { fonts, radius, space } from "../../fonts";
import { makeStyles, useTheme } from "../../theme";

export function ContactButtons({ email, phone, testIDPrefix }: { email: string; phone: string; testIDPrefix: string }) {
  const styles = useStyles();
  const { colors } = useTheme();
  return (
    <View style={styles.actions}>
      <Pressable onPress={() => Linking.openURL(`mailto:${email}`)} style={styles.action} testID={`${testIDPrefix}-email`}>
        <EnvelopeSimple size={16} color={colors.brandPrimary} weight="bold" />
        <Text style={styles.actionText} numberOfLines={1}>{email}</Text>
      </Pressable>
      <Pressable onPress={() => Linking.openURL(`tel:${phone.replace(/\s/g, "")}`)} style={styles.action} testID={`${testIDPrefix}-phone`}>
        <Phone size={16} color={colors.brandPrimary} weight="bold" />
        <Text style={styles.actionText}>{phone}</Text>
      </Pressable>
    </View>
  );
}

export const useAdminStyles = makeStyles((c) => ({
  list: { padding: space.xl, gap: space.md },
  count: { fontFamily: fonts.bold, fontSize: 13, color: c.muted, textTransform: "uppercase", letterSpacing: 1 },
  body: { fontFamily: fonts.regular, fontSize: 15, lineHeight: 22, color: c.muted, marginTop: space.sm },
  card: { backgroundColor: c.surface, borderRadius: radius.lg, padding: space.lg, borderWidth: 1, borderColor: c.border },
  cardHead: { flexDirection: "row", justifyContent: "space-between", alignItems: "baseline", gap: space.sm },
  cardTitle: { flex: 1, fontFamily: fonts.bold, fontSize: 17, color: c.onSurface },
  date: { fontFamily: fonts.regular, fontSize: 12, color: c.muted },
  meta: { fontFamily: fonts.regular, fontSize: 14, lineHeight: 20, color: c.onSurfaceTertiary, marginTop: space.xs },
  message: { fontFamily: fonts.regular, fontSize: 14, lineHeight: 20, color: c.onSurface, marginTop: space.sm, backgroundColor: c.surfaceSecondary, padding: space.md, borderRadius: radius.md },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: space.sm },
  chip: { minHeight: 44, paddingHorizontal: space.md, borderRadius: radius.pill, borderWidth: 1.5, borderColor: c.border, backgroundColor: c.surface, alignItems: "center", justifyContent: "center" },
  chipActive: { borderColor: c.brandPrimary, backgroundColor: c.brandTertiary },
  chipText: { fontFamily: fonts.bold, fontSize: 13, color: c.muted },
  chipTextActive: { color: c.onBrandTertiary },
  error: { fontFamily: fonts.medium, fontSize: 13, color: c.error, marginTop: space.sm },
}));

const useStyles = makeStyles((c) => ({
  actions: { gap: space.sm, marginTop: space.md },
  action: { minHeight: 44, flexDirection: "row", alignItems: "center", gap: space.xs + 2, paddingHorizontal: space.md, borderRadius: radius.md, backgroundColor: c.brandTertiary },
  actionText: { flex: 1, fontFamily: fonts.medium, fontSize: 13, color: c.onBrandTertiary },
}));
