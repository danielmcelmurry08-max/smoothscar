import { Image } from "expo-image";
import { ImageManipulator, SaveFormat } from "expo-image-manipulator";
import * as ImagePicker from "expo-image-picker";
import { Camera, ImageSquare } from "phosphor-react-native";
import { useState } from "react";
import { ActivityIndicator, Linking, Platform, Pressable, Text, View } from "react-native";

import { fonts, radius, space } from "../fonts";
import { makeStyles, useTheme } from "../theme";

type Props = {
  label: string;
  uri: string | null;
  busy?: boolean;
  disabled?: boolean;
  onPicked: (localUri: string) => void;
  testID: string;
};

async function shrink(uri: string, width: number) {
  const ctx = ImageManipulator.manipulate(uri);
  if (width > 1200) ctx.resize({ width: 1200 });
  const img = await ctx.renderAsync();
  const out = await img.saveAsync({ compress: 0.7, format: SaveFormat.JPEG });
  return out.uri;
}

export function PhotoSlot({ label, uri, busy, disabled, onPicked, testID }: Props) {
  const styles = useStyles();
  const { colors } = useTheme();
  const [cameraBlocked, setCameraBlocked] = useState(false);
  const [explain, setExplain] = useState(false);
  const [error, setError] = useState("");

  const handle = async (res: ImagePicker.ImagePickerResult) => {
    if (res.canceled || !res.assets?.[0]) return;
    try {
      onPicked(await shrink(res.assets[0].uri, res.assets[0].width));
    } catch {
      setError("We couldn't read that photo. Please try another.");
    }
  };

  const launchCamera = async () => {
    setExplain(false);
    await handle(await ImagePicker.launchCameraAsync({ mediaTypes: ["images"], quality: 0.8 }));
  };

  const takePhoto = async () => {
    setError("");
    if (Platform.OS === "web") return launchCamera();
    const perm = await ImagePicker.getCameraPermissionsAsync();
    if (perm.granted) return launchCamera();
    if (!perm.canAskAgain) return setCameraBlocked(true);
    setExplain(true);
  };

  const allowCamera = async () => {
    const perm = await ImagePicker.requestCameraPermissionsAsync();
    if (perm.granted) return launchCamera();
    setExplain(false);
    if (!perm.canAskAgain) setCameraBlocked(true);
    else setError("Camera access is needed to take a photo. You can also choose one from your library.");
  };

  const choosePhoto = async () => {
    setError("");
    await handle(await ImagePicker.launchImageLibraryAsync({ mediaTypes: ["images"], quality: 0.8 }));
  };

  return (
    <View style={styles.slot} testID={testID}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.frame}>
        {uri ? <Image source={{ uri }} style={styles.image} contentFit="cover" testID={`${testID}-image`} /> : <ImageSquare size={32} color={colors.borderStrong} />}
        {busy ? (
          <View style={styles.busy}>
            <ActivityIndicator color={colors.onBrandPrimary} />
          </View>
        ) : null}
      </View>
      {explain ? (
        <View style={styles.note}>
          <Text style={styles.noteText}>Allow camera access to photograph your scar. Photos stay private unless you add them to a review.</Text>
          <Pressable testID={`${testID}-allow-camera`} onPress={allowCamera} style={styles.btnPrimary}>
            <Text style={styles.btnPrimaryText}>Allow camera</Text>
          </Pressable>
        </View>
      ) : null}
      {cameraBlocked ? (
        <View style={styles.note}>
          <Text style={styles.noteText}>Camera access is turned off for BioRNA. Turn it on in Settings, or choose a photo instead.</Text>
          <Pressable testID={`${testID}-open-settings`} onPress={() => Linking.openSettings()} style={styles.btnPrimary}>
            <Text style={styles.btnPrimaryText}>Open Settings</Text>
          </Pressable>
        </View>
      ) : null}
      {error ? <Text style={styles.error}>{error}</Text> : null}
      <View style={styles.row}>
        <Pressable testID={`${testID}-camera`} disabled={disabled || busy} onPress={takePhoto} style={[styles.btn, (disabled || busy) && styles.disabled]}>
          <Camera size={16} color={colors.brandPrimary} weight="bold" />
          <Text style={styles.btnText}>{uri ? "Retake" : "Camera"}</Text>
        </Pressable>
        <Pressable testID={`${testID}-library`} disabled={disabled || busy} onPress={choosePhoto} style={[styles.btn, (disabled || busy) && styles.disabled]}>
          <ImageSquare size={16} color={colors.brandPrimary} weight="bold" />
          <Text style={styles.btnText}>Choose</Text>
        </Pressable>
      </View>
    </View>
  );
}

const useStyles = makeStyles((c) => ({
  slot: { flex: 1, gap: space.sm },
  label: { fontFamily: fonts.bold, fontSize: 13, color: c.onSurfaceTertiary },
  frame: { aspectRatio: 1, borderRadius: radius.md, borderWidth: 1, borderColor: c.border, borderStyle: "dashed", backgroundColor: c.surfaceSecondary, alignItems: "center", justifyContent: "center", overflow: "hidden" },
  image: { width: "100%", height: "100%" },
  busy: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0, alignItems: "center", justifyContent: "center", backgroundColor: c.scrim },
  row: { flexDirection: "row", gap: space.xs },
  btn: { flex: 1, minHeight: 44, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 4, borderRadius: radius.md, backgroundColor: c.brandTertiary, paddingHorizontal: space.xs },
  btnText: { fontFamily: fonts.bold, fontSize: 12, color: c.onBrandTertiary },
  disabled: { opacity: 0.5 },
  note: { gap: space.sm, padding: space.sm, borderRadius: radius.md, backgroundColor: c.surfaceSecondary },
  noteText: { fontFamily: fonts.regular, fontSize: 12, lineHeight: 17, color: c.onSurfaceTertiary },
  btnPrimary: { minHeight: 44, borderRadius: radius.pill, backgroundColor: c.brandPrimary, alignItems: "center", justifyContent: "center" },
  btnPrimaryText: { fontFamily: fonts.bold, fontSize: 13, color: c.onBrandPrimary },
  error: { fontFamily: fonts.medium, fontSize: 12, color: c.error },
}));
