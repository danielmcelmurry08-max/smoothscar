import { Text, View } from "react-native";

import { fonts, space } from "../fonts";
import { makeStyles } from "../theme";

export function SectionHeader({ eyebrow, title, body }: { eyebrow: string; title: string; body?: string }) {
  const styles = useStyles();
  return (
    <View style={styles.wrap}>
      <Text style={styles.eyebrow}>{eyebrow}</Text>
      <Text role="heading" aria-level={2} style={styles.title}>
        {title}
      </Text>
      {body ? <Text style={styles.body}>{body}</Text> : null}
    </View>
  );
}

const useStyles = makeStyles((c) => ({
  wrap: { marginBottom: space.xl },
  eyebrow: {
    fontFamily: fonts.bold,
    fontSize: 12,
    letterSpacing: 1.4,
    textTransform: "uppercase",
    color: c.brandPrimary,
    marginBottom: space.sm,
  },
  title: { fontFamily: fonts.black, fontSize: 28, lineHeight: 33, letterSpacing: -0.6, color: c.onSurface },
  body: { fontFamily: fonts.regular, fontSize: 15, lineHeight: 23, color: c.muted, marginTop: space.sm },
}));
