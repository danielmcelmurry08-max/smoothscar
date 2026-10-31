import { AppleLogo, GoogleLogo, LockSimple } from "phosphor-react-native";
import { Text, View } from "react-native";

import { fonts, radius, space } from "../fonts";
import { makeStyles, useTheme } from "../theme";

export function PayBadges({ align = "center" }: { align?: "center" | "flex-start" }) {
  const styles = useStyles();
  const { colors } = useTheme();
  return (
    <View style={[styles.row, { justifyContent: align }]} testID="pay-badges">
      <LockSimple size={12} color={colors.muted} weight="bold" />
      <Text style={styles.secure}>1-click checkout</Text>
      <View style={styles.badge} testID="apple-pay-badge" accessibilityLabel="Apple Pay accepted">
        <AppleLogo size={11} color={colors.onSurfaceInverse} weight="fill" />
        <Text style={styles.badgeText}>Pay</Text>
      </View>
      <View style={[styles.badge, styles.gBadge]} testID="google-pay-badge" accessibilityLabel="Google Pay accepted">
        <GoogleLogo size={11} color={colors.onSurface} weight="bold" />
        <Text style={[styles.badgeText, styles.gText]}>Pay</Text>
      </View>
    </View>
  );
}

const useStyles = makeStyles((c) => ({
  row: { flexDirection: "row", alignItems: "center", gap: space.sm - 2 },
  secure: { fontFamily: fonts.medium, fontSize: 12, color: c.muted, marginRight: space.xs },
  badge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
    backgroundColor: c.surfaceInverse,
    paddingHorizontal: space.sm,
    height: 22,
    borderRadius: radius.sm,
  },
  gBadge: { backgroundColor: c.surface, borderWidth: 1, borderColor: c.borderStrong },
  badgeText: { fontFamily: fonts.bold, fontSize: 11, color: c.onSurfaceInverse },
  gText: { color: c.onSurface },
}));
