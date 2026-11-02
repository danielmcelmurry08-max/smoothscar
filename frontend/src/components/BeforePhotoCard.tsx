import { CheckCircle, Camera } from "phosphor-react-native";
import { useState } from "react";
import { Text, View } from "react-native";

import { photoUrl, uploadBeforePhoto } from "../api";
import { fonts, radius, space } from "../fonts";
import { makeStyles, useTheme } from "../theme";
import { PhotoSlot } from "./PhotoSlot";

type Props = { orderId: string; token: string; existingPhotoId: string | null | undefined };

export function BeforePhotoCard({ orderId, token, existingPhotoId }: Props) {
  const styles = useStyles();
  const { colors } = useTheme();
  const [uri, setUri] = useState<string | null>(existingPhotoId ? photoUrl(`/api/photos/${existingPhotoId}`, { token }) : null);
  const [saved, setSaved] = useState(!!existingPhotoId);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const onPicked = async (local: string) => {
    setError("");
    const prev = { uri, saved };
    setUri(local);
    setBusy(true);
    try {
      await uploadBeforePhoto(orderId, token, local);
      setSaved(true);
    } catch (e) {
      setUri(prev.uri);
      setSaved(prev.saved);
      setError(e instanceof Error ? e.message : "We couldn't save your photo. Please try again.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <View style={styles.card} testID="before-photo-card">
      <View style={styles.head}>
        {saved ? <CheckCircle size={22} color={colors.success} weight="fill" /> : <Camera size={22} color={colors.brandPrimary} weight="duotone" />}
        <View style={styles.flex}>
          <Text style={styles.title}>{saved ? "Before photo saved" : "Take your before photo"}</Text>
          <Text style={styles.body}>
            {saved
              ? "In about 3 weeks we'll email you to compare your results and share a review for 25% off a box."
              : "Before you apply your first patch, photograph your scar in good light. It stays private unless you add it to a review later."}
          </Text>
        </View>
      </View>
      <View style={styles.slotWrap}>
        <PhotoSlot label="Before" uri={uri} busy={busy} onPicked={onPicked} testID="before-photo" />
      </View>
      {error ? <Text style={styles.error} testID="before-photo-error">{error}</Text> : null}
    </View>
  );
}

const useStyles = makeStyles((c) => ({
  card: { width: "100%", backgroundColor: c.surface, borderRadius: radius.lg, padding: space.lg, marginTop: space.xl, borderWidth: 1, borderColor: c.border, gap: space.md },
  head: { flexDirection: "row", gap: space.md },
  flex: { flex: 1 },
  title: { fontFamily: fonts.bold, fontSize: 16, color: c.onSurface },
  body: { fontFamily: fonts.regular, fontSize: 14, lineHeight: 20, color: c.muted, marginTop: 2 },
  slotWrap: { width: "60%", alignSelf: "center" },
  error: { fontFamily: fonts.medium, fontSize: 13, color: c.error },
}));
