import { Gift, X } from "phosphor-react-native";
import { useEffect, useState } from "react";
import { ActivityIndicator, Pressable, Text, TextInput, View } from "react-native";

import { checkCode, CodePreview } from "../api";
import { fonts, radius, space } from "../fonts";
import { makeStyles, useTheme } from "../theme";

type Props = { initialCode?: string; applied: CodePreview | null; onApplied: (c: CodePreview | null) => void };

export function PromoCodeField({ initialCode, applied, onApplied }: Props) {
  const styles = useStyles();
  const { colors } = useTheme();
  const [value, setValue] = useState(initialCode ?? "");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const apply = async (raw?: string) => {
    const v = (raw ?? value).trim();
    if (!v) return;
    setError("");
    setBusy(true);
    try {
      onApplied(await checkCode(v));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Code not found");
    } finally {
      setBusy(false);
    }
  };

  useEffect(() => {
    if (initialCode) apply(initialCode);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (applied) {
    return (
      <View style={styles.applied} testID="promo-applied">
        <Gift size={20} color={colors.success} weight="fill" />
        <View style={styles.flex}>
          <Text style={styles.appliedCode}>{applied.code}</Text>
          <Text style={styles.appliedLabel}>{applied.label}</Text>
        </View>
        <Pressable testID="promo-remove-button" onPress={() => onApplied(null)} style={styles.remove} hitSlop={6}>
          <X size={18} color={colors.muted} weight="bold" />
        </Pressable>
      </View>
    );
  }

  return (
    <View>
      <View style={styles.row}>
        <TextInput
          testID="promo-code-input"
          value={value}
          onChangeText={(t) => {
            setValue(t.toUpperCase());
            if (error) setError("");
          }}
          placeholder="Referral or reward code"
          placeholderTextColor={colors.muted}
          autoCapitalize="characters"
          autoCorrect={false}
          returnKeyType="done"
          onSubmitEditing={() => apply()}
          style={[styles.input, error ? styles.inputError : null]}
        />
        <Pressable testID="promo-apply-button" onPress={() => apply()} disabled={busy || !value.trim()} style={[styles.btn, (!value.trim() || busy) && styles.btnDisabled]}>
          {busy ? <ActivityIndicator color={colors.onBrandPrimary} /> : <Text style={styles.btnText}>Apply</Text>}
        </Pressable>
      </View>
      {error ? <Text style={styles.error} testID="promo-error">{error}</Text> : null}
    </View>
  );
}

const useStyles = makeStyles((c) => ({
  row: { flexDirection: "row", gap: space.sm },
  input: {
    flex: 1,
    height: 52,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: c.border,
    backgroundColor: c.surface,
    paddingHorizontal: space.lg,
    fontFamily: fonts.bold,
    fontSize: 15,
    letterSpacing: 1,
    color: c.onSurface,
  },
  inputError: { borderColor: c.error },
  btn: { height: 52, paddingHorizontal: space.xl, borderRadius: radius.md, backgroundColor: c.brandPrimary, alignItems: "center", justifyContent: "center" },
  btnDisabled: { opacity: 0.5 },
  btnText: { fontFamily: fonts.bold, fontSize: 15, color: c.onBrandPrimary },
  error: { fontFamily: fonts.medium, fontSize: 12, color: c.error, marginTop: space.xs },
  applied: {
    flexDirection: "row",
    alignItems: "center",
    gap: space.md,
    borderRadius: radius.md,
    borderWidth: 1.5,
    borderColor: c.success,
    backgroundColor: c.surface,
    paddingHorizontal: space.lg,
    minHeight: 56,
  },
  flex: { flex: 1 },
  appliedCode: { fontFamily: fonts.black, fontSize: 15, letterSpacing: 1, color: c.onSurface },
  appliedLabel: { fontFamily: fonts.medium, fontSize: 13, color: c.success },
  remove: { width: 44, height: 44, alignItems: "center", justifyContent: "center" },
}));
