import { BellSlash } from "phosphor-react-native";
import { Modal, Pressable, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { fonts, radius, space } from "../fonts";
import { makeStyles, useTheme } from "../theme";

type Props = { visible: boolean; onOpenSettings: () => void; onLater: () => void };

export function PushNudge({ visible, onOpenSettings, onLater }: Props) {
  const styles = useStyles();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onLater}>
      <Pressable style={styles.backdrop} onPress={onLater} testID="push-nudge-backdrop">
        <Pressable style={[styles.sheet, { paddingBottom: insets.bottom + space.lg }]} testID="push-nudge-sheet">
          <BellSlash size={28} color={colors.brandPrimary} weight="duotone" />
          <Text style={styles.title}>Your patch reminders are off</Text>
          <Text style={styles.body}>Turn on notifications in Settings to get your 9:30pm patch reminder and a heads-up before you run out.</Text>
          <Pressable testID="push-nudge-open-settings" onPress={onOpenSettings} style={styles.primary}>
            <Text style={styles.primaryText}>Open Settings</Text>
          </Pressable>
          <Pressable testID="push-nudge-later" onPress={onLater} style={styles.secondary}>
            <Text style={styles.secondaryText}>Later</Text>
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const useStyles = makeStyles((c) => ({
  backdrop: { flex: 1, backgroundColor: c.scrim, justifyContent: "flex-end" },
  sheet: { backgroundColor: c.surface, borderTopLeftRadius: radius.lg, borderTopRightRadius: radius.lg, padding: space.xl },
  title: { fontFamily: fonts.black, fontSize: 22, color: c.onSurface, marginTop: space.md },
  body: { fontFamily: fonts.regular, fontSize: 15, lineHeight: 22, color: c.muted, marginTop: space.sm },
  primary: { height: 52, borderRadius: radius.pill, backgroundColor: c.brandPrimary, alignItems: "center", justifyContent: "center", marginTop: space.xl },
  primaryText: { fontFamily: fonts.bold, fontSize: 16, color: c.onBrandPrimary },
  secondary: { height: 48, alignItems: "center", justifyContent: "center", marginTop: space.xs },
  secondaryText: { fontFamily: fonts.bold, fontSize: 15, color: c.muted },
}));
