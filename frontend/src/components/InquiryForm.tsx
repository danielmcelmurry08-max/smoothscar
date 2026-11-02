import { Link } from "expo-router";
import { CheckSquare, Square } from "phosphor-react-native";
import { useState } from "react";
import { Pressable, Text, TextInput, View } from "react-native";

import { fonts, radius, space } from "../fonts";
import { FormDef, submitForm, validate } from "../providerForms";
import { makeStyles, useTheme } from "../theme";
import { Button } from "./Store";

const LONG_LIST = 12;

export function InquiryForm({ def }: { def: FormDef }) {
  const styles = useStyles();
  const { colors } = useTheme();
  const [values, setValues] = useState<Record<string, string>>({});
  const [consent, setConsent] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [message, setMessage] = useState("");
  const set = (k: string, v: string) => setValues((cur) => ({ ...cur, [k]: v }));

  const send = async () => {
    const errs = validate(def, values, consent);
    setErrors(errs);
    if (Object.keys(errs).length) {
      setStatus("error");
      setMessage("Please fix the highlighted fields.");
      return;
    }
    setStatus("sending");
    try {
      const normalized = { ...values };
      for (const f of def.fields) if (f.kind === "select" && (f.options?.length ?? 0) > LONG_LIST && normalized[f.name]) normalized[f.name] = normalized[f.name].trim().toUpperCase();
      await submitForm(def, normalized);
      setStatus("sent");
    } catch (e) {
      setStatus("error");
      setMessage(`${e instanceof Error ? e.message : "Something went wrong."} Your answers are still here, so you can try again.`);
    }
  };

  if (status === "sent")
    return (
      <View style={styles.success} testID={`${def.id}-success`} role="status">
        <Text style={styles.successTitle}>Thank you — your inquiry was received.</Text>
        <Text style={styles.help}>Our team reviews every inquiry and will reply by email.</Text>
      </View>
    );

  return (
    <View style={styles.form} testID={`${def.id}-form`}>
      {def.notice ? <Text style={styles.notice}>{def.notice}</Text> : null}
      <Text style={styles.help}>Fields marked * are required. Please do not include patient names, photos, diagnoses or other health information.</Text>
      {def.fields.map((f) => {
        const err = errors[f.name];
        const label = `${f.label}${f.required ? " *" : ""}`;
        const v = values[f.name] ?? "";
        const isChips = (f.kind === "select" && (f.options?.length ?? 0) <= LONG_LIST) || f.kind === "multi";
        const picked = f.kind === "multi" ? v.split("; ").filter(Boolean) : [v];
        return (
          <View key={f.name} style={styles.field}>
            <Text style={styles.label} nativeID={`${def.id}-${f.name}`}>
              {label}
            </Text>
            {isChips ? (
              <View style={styles.chips} accessibilityLabelledBy={`${def.id}-${f.name}`}>
                {f.options!.map((o) => {
                  const on = picked.includes(o);
                  return (
                    <Pressable
                      key={o}
                      accessibilityRole={f.kind === "multi" ? "checkbox" : "radio"}
                      accessibilityState={{ checked: on }}
                      onPress={() => set(f.name, f.kind === "multi" ? (on ? picked.filter((x) => x !== o) : [...picked, o]).join("; ") : o)}
                      style={[styles.chip, on && styles.chipOn]}
                    >
                      <Text style={[styles.chipText, on && styles.chipTextOn]}>{o}</Text>
                    </Pressable>
                  );
                })}
              </View>
            ) : (
              <TextInput
                value={v}
                onChangeText={(t) => set(f.name, t)}
                aria-label={label}
                placeholder={f.kind === "select" ? "Two-letter code, e.g. TX" : undefined}
                placeholderTextColor={colors.muted}
                multiline={f.kind === "textarea"}
                maxLength={f.kind === "textarea" ? 2000 : f.kind === "select" ? 2 : 200}
                autoCapitalize={f.kind === "email" || f.kind === "url" ? "none" : f.kind === "select" ? "characters" : "sentences"}
                keyboardType={f.kind === "email" ? "email-address" : f.kind === "tel" ? "phone-pad" : f.kind === "url" ? "url" : "default"}
                autoComplete={f.kind === "email" ? "email" : f.kind === "tel" ? "tel" : undefined}
                style={[styles.input, f.kind === "textarea" && styles.textarea, !!err && styles.inputErr]}
              />
            )}
            {err ? <Text style={styles.err}>{err}</Text> : null}
          </View>
        );
      })}
      <Pressable accessibilityRole="checkbox" accessibilityState={{ checked: consent }} onPress={() => setConsent(!consent)} style={styles.consent} testID={`${def.id}-consent`}>
        {consent ? <CheckSquare size={24} color={colors.brandPrimary} weight="fill" /> : <Square size={24} color={colors.muted} />}
        <Text style={styles.consentText}>
          I agree that SmoothScar may store this information and contact me about my inquiry, as described in the{" "}
          <Link href="/privacy" style={styles.link}>
            Privacy Policy
          </Link>
          . *
        </Text>
      </Pressable>
      {errors.consent ? <Text style={styles.err}>{errors.consent}</Text> : null}
      {status === "error" ? (
        <Text style={styles.errBox} role="alert">
          {message}
        </Text>
      ) : null}
      <Button label={status === "sending" ? "Sending…" : status === "error" ? `Try again: ${def.submit}` : def.submit} onPress={send} disabled={status === "sending"} testID={`${def.id}-submit`} />
    </View>
  );
}

const useStyles = makeStyles((c) => ({
  form: { gap: space.lg, maxWidth: 680 },
  field: { gap: space.xs },
  label: { fontFamily: fonts.bold, fontSize: 14, color: c.brandSecondary },
  help: { fontFamily: fonts.regular, fontSize: 14, lineHeight: 20, color: c.muted },
  notice: { fontFamily: fonts.medium, fontSize: 14, lineHeight: 20, color: c.onBrandTertiary, backgroundColor: c.brandTertiary, padding: space.md, borderRadius: radius.md },
  input: { minHeight: 48, borderWidth: 1, borderColor: c.borderStrong, borderRadius: radius.md, paddingHorizontal: space.md, fontFamily: fonts.regular, fontSize: 16, color: c.onSurface, backgroundColor: c.surface },
  textarea: { minHeight: 110, paddingTop: space.md, textAlignVertical: "top" },
  inputErr: { borderColor: c.error },
  err: { fontFamily: fonts.medium, fontSize: 13, color: c.error },
  errBox: { fontFamily: fonts.medium, fontSize: 14, lineHeight: 20, color: c.error, borderWidth: 1, borderColor: c.error, borderRadius: radius.md, padding: space.md },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: space.sm },
  chip: { minHeight: 40, justifyContent: "center", paddingHorizontal: space.md, borderRadius: radius.pill, borderWidth: 1, borderColor: c.borderStrong, backgroundColor: c.surface },
  chipOn: { backgroundColor: c.brandPrimary, borderColor: c.brandPrimary },
  chipText: { fontFamily: fonts.medium, fontSize: 14, color: c.onSurface },
  chipTextOn: { color: c.onBrandPrimary },
  consent: { flexDirection: "row", gap: space.sm, alignItems: "flex-start" },
  consentText: { flex: 1, fontFamily: fonts.regular, fontSize: 14, lineHeight: 21, color: c.onSurfaceTertiary },
  link: { color: c.brandPrimary, fontFamily: fonts.bold, textDecorationLine: "underline" },
  success: { padding: space.xl, borderRadius: radius.lg, backgroundColor: c.brandTertiary, gap: space.sm, maxWidth: 680 },
  successTitle: { fontFamily: fonts.bold, fontSize: 18, color: c.brandSecondary },
}));
