import { useLocalSearchParams, useRouter } from "expo-router";
import { ArrowLeft, CheckCircle } from "phosphor-react-native";
import { useEffect, useRef, useState } from "react";
import { ActivityIndicator, Pressable, Text, TextInput, View } from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-controller";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { createReview, lookupReviewOrder, photoUrl, uploadReviewPhoto } from "@/src/api";
import { useAuth } from "@/src/auth";
import { PhotoSlot } from "@/src/components/PhotoSlot";
import { Stars } from "@/src/components/Stars";
import { fonts, MAX_WIDTH, radius, space } from "@/src/fonts";
import { makeStyles, useTheme } from "@/src/theme";

type FieldKey = "order_number" | "email" | "display_name" | "scar_type" | "title" | "body";
const RATING_LABEL = ["", "Poor", "Fair", "Good", "Very good", "Excellent"];

export default function WriteReview() {
  const styles = useStyles();
  const { colors } = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const params = useLocalSearchParams<{ order?: string; email?: string; name?: string }>();
  const [form, setForm] = useState<Record<FieldKey, string>>({
    order_number: params.order ?? "",
    email: params.email ?? user?.email ?? "",
    display_name: params.name ?? (user?.name ? user.name.split(" ")[0] : ""),
    scar_type: "",
    title: "",
    body: "",
  });
  const [rating, setRating] = useState(0);
  const [errors, setErrors] = useState<Partial<Record<FieldKey | "rating", string>>>({});
  const [submitError, setSubmitError] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const refs = useRef<Partial<Record<FieldKey, TextInput | null>>>({});
  type Slot = { id: string | null; uri: string | null; busy: boolean };
  const [photos, setPhotos] = useState<Record<"before" | "after", Slot>>({ before: { id: null, uri: null, busy: false }, after: { id: null, uri: null, busy: false } });
  const [photoError, setPhotoError] = useState("");
  const uploading = photos.before.busy || photos.after.busy;
  const orderReady = form.order_number.trim().length >= 6 && /^\S+@\S+\.\S+$/.test(form.email.trim());
  const lookupKey = `${form.order_number.trim().toUpperCase()}|${form.email.trim().toLowerCase()}`;

  const emptySlot: Slot = { id: null, uri: null, busy: false };
  const firstKey = useRef(true);
  useEffect(() => {
    // Photos belong to one order: clear them if the order number or email changes.
    if (firstKey.current) firstKey.current = false;
    else {
      setPhotos({ before: emptySlot, after: emptySlot });
      setPhotoError("");
    }
    if (!orderReady) return;
    let live = true;
    lookupReviewOrder(form.order_number.trim(), form.email.trim())
      .then((r) => {
        if (live && r.before_photo_id) {
          setPhotos((p) => ({ ...p, before: { id: r.before_photo_id, uri: photoUrl(`/api/photos/${r.before_photo_id}`, { token: r.photo_token }), busy: false } }));
        }
      })
      .catch(() => {});
    return () => {
      live = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lookupKey, orderReady]);

  const pickPhoto = async (kind: "before" | "after", local: string) => {
    setPhotoError("");
    const prev = photos[kind];
    setPhotos((p) => ({ ...p, [kind]: { id: null, uri: local, busy: true } }));
    try {
      const res = await uploadReviewPhoto(form.order_number.trim(), form.email.trim(), kind, local);
      setPhotos((p) => ({ ...p, [kind]: { id: res.id, uri: local, busy: false } }));
    } catch (e) {
      setPhotos((p) => ({ ...p, [kind]: prev }));
      setPhotoError(e instanceof Error ? e.message : "We couldn't upload your photo. Please try again.");
    }
  };

  const fields: { key: FieldKey; label: string; placeholder: string; optional?: boolean; multiline?: boolean; keyboard?: "email-address" }[] = [
    { key: "order_number", label: "Order number", placeholder: "BRNA-260601-0001" },
    { key: "email", label: "Email used for the order", placeholder: "jane@email.com", keyboard: "email-address" },
    { key: "display_name", label: "Name to show", placeholder: "e.g. Jane T." },
    { key: "scar_type", label: "Scar type", placeholder: "e.g. C-section scar", optional: true },
    { key: "title", label: "Headline", placeholder: "Sum up your experience", optional: true },
    { key: "body", label: "Your review", placeholder: "How did BioRNA work for your scar?", multiline: true },
  ];

  const validate = () => {
    const e: typeof errors = {};
    if (!rating) e.rating = "Choose a star rating";
    if (form.order_number.trim().length < 6) e.order_number = "Enter your order number (it's in your confirmation email)";
    if (!/^\S+@\S+\.\S+$/.test(form.email.trim())) e.email = "Enter a valid email";
    if (form.display_name.trim().length < 2) e.display_name = "Enter a name to show with your review";
    if (form.body.trim().length < 10) e.body = "Please write at least 10 characters";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const submit = async () => {
    setSubmitError("");
    if (!validate()) return;
    setLoading(true);
    try {
      await createReview({
        order_number: form.order_number.trim(),
        email: form.email.trim(),
        rating,
        display_name: form.display_name.trim(),
        scar_type: form.scar_type.trim() || null,
        title: form.title.trim() || null,
        body: form.body.trim(),
        before_photo_id: photos.before.id,
        after_photo_id: photos.after.id,
      });
      setDone(true);
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const goBack = () => (router.canGoBack() ? router.back() : router.replace("/"));

  return (
    <View style={styles.root} testID="review-screen">
      <View style={[styles.header, { paddingTop: insets.top + space.sm }]}>
        <View style={styles.headerInner}>
          <Pressable testID="review-back-button" onPress={goBack} style={styles.iconBtn} hitSlop={8}>
            <ArrowLeft size={22} color={colors.onSurface} weight="bold" />
          </Pressable>
          <Text style={styles.headerTitle}>Write a review</Text>
        </View>
      </View>

      {done ? (
        <View style={styles.doneWrap} testID="review-success">
          <CheckCircle size={56} color={colors.success} weight="fill" />
          <Text style={styles.title}>Thank you!</Text>
          <Text style={styles.body}>Your review has been received. It will appear on our page once our team has checked it.</Text>
          <Pressable testID="review-done-button" onPress={() => router.dismissTo("/")} style={styles.cta}>
            <Text style={styles.ctaText}>Back to BioRNA Antiscar</Text>
          </Pressable>
        </View>
      ) : (
        <KeyboardAwareScrollView bottomOffset={40} contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + space.xxl }]} keyboardShouldPersistTaps="handled">
          <View style={styles.column}>
            <Text style={styles.title}>How was BioRNA for you?</Text>
            <Text style={styles.body}>Reviews are open to verified buyers. Enter your order number and email so we can confirm your purchase.</Text>

            <Text style={styles.label}>Your rating</Text>
            <View style={styles.ratingRow}>
              <Stars value={rating} size={30} onChange={(n) => { setRating(n); setErrors((e) => ({ ...e, rating: undefined })); }} testIDPrefix="review-star" />
              <Text style={styles.ratingLabel} testID="review-rating-label">{RATING_LABEL[rating]}</Text>
            </View>
            {errors.rating ? <Text style={styles.errorText} testID="error-rating">{errors.rating}</Text> : null}

            {fields.map((f, i) => (
              <View key={f.key} style={styles.field}>
                <Text style={styles.label}>
                  {f.label}
                  {f.optional ? <Text style={styles.optional}> (optional)</Text> : null}
                </Text>
                <TextInput
                  ref={(r) => {
                    refs.current[f.key] = r;
                  }}
                  testID={`review-input-${f.key}`}
                  value={form[f.key]}
                  onChangeText={(t) => {
                    setForm((s) => ({ ...s, [f.key]: t }));
                    if (errors[f.key]) setErrors((e) => ({ ...e, [f.key]: undefined }));
                  }}
                  placeholder={f.placeholder}
                  placeholderTextColor={colors.muted}
                  keyboardType={f.keyboard}
                  autoCapitalize={f.key === "email" ? "none" : f.key === "order_number" ? "characters" : "sentences"}
                  multiline={f.multiline}
                  maxLength={f.key === "body" ? 1000 : f.key === "title" ? 80 : f.key === "display_name" ? 40 : undefined}
                  returnKeyType={f.multiline ? "default" : "next"}
                  onSubmitEditing={f.multiline ? undefined : () => refs.current[fields[i + 1]?.key]?.focus()}
                  style={[styles.input, f.multiline && styles.textarea, errors[f.key] && styles.inputError]}
                />
                {errors[f.key] ? <Text style={styles.errorText} testID={`error-${f.key}`}>{errors[f.key]}</Text> : null}
              </View>
            ))}

            <Text style={[styles.label, styles.photoTitle]}>
              Before &amp; after photos<Text style={styles.optional}> (optional)</Text>
            </Text>
            <Text style={styles.photoHint}>
              {orderReady ? "Show your progress. Photos appear with your review once our team approves it." : "Enter your order number and email above to add photos."}
            </Text>
            <View style={styles.photoRow}>
              {(["before", "after"] as const).map((k) => (
                <PhotoSlot
                  key={k}
                  label={k === "before" ? "Before" : "After"}
                  uri={photos[k].uri}
                  busy={photos[k].busy}
                  disabled={!orderReady}
                  onPicked={(u) => pickPhoto(k, u)}
                  testID={`review-photo-${k}`}
                />
              ))}
            </View>
            {photoError ? <Text style={styles.errorText} testID="review-photo-error">{photoError}</Text> : null}

            {submitError ? <Text style={styles.submitError} testID="review-submit-error">{submitError}</Text> : null}
            <Pressable testID="review-submit-button" onPress={submit} disabled={loading || uploading} style={({ pressed }) => [styles.cta, (pressed || loading) && styles.pressed, uploading && styles.disabledCta]}>
              {loading ? <ActivityIndicator color={colors.onBrandPrimary} /> : <Text style={styles.ctaText}>{uploading ? "Uploading photo…" : "Submit review"}</Text>}
            </Pressable>
            <Text style={styles.note}>Only your chosen name, rating, review and approved photos are shown publicly.</Text>
          </View>
        </KeyboardAwareScrollView>
      )}
    </View>
  );
}

const useStyles = makeStyles((c) => ({
  root: { flex: 1, backgroundColor: c.surfaceSecondary },
  header: { backgroundColor: c.surface, borderBottomWidth: 1, borderBottomColor: c.border, paddingBottom: space.sm },
  headerInner: { width: "100%", maxWidth: MAX_WIDTH, alignSelf: "center", flexDirection: "row", alignItems: "center", paddingHorizontal: space.md, gap: space.sm },
  iconBtn: { width: 44, height: 44, alignItems: "center", justifyContent: "center" },
  headerTitle: { flex: 1, fontFamily: fonts.bold, fontSize: 17, color: c.onSurface },
  scroll: { paddingHorizontal: space.xl, paddingTop: space.xl },
  column: { width: "100%", maxWidth: MAX_WIDTH, alignSelf: "center" },
  doneWrap: { flex: 1, alignItems: "center", justifyContent: "center", padding: space.xl, width: "100%", maxWidth: MAX_WIDTH, alignSelf: "center" },
  title: { fontFamily: fonts.black, fontSize: 26, color: c.onSurface, marginTop: space.md, textAlign: "left" },
  body: { fontFamily: fonts.regular, fontSize: 15, lineHeight: 22, color: c.muted, marginTop: space.sm, marginBottom: space.xl },
  ratingRow: { flexDirection: "row", alignItems: "center", gap: space.sm, marginLeft: -space.sm },
  ratingLabel: { fontFamily: fonts.bold, fontSize: 14, color: c.brandPrimary },
  field: { marginTop: space.md },
  label: { fontFamily: fonts.medium, fontSize: 13, color: c.onSurfaceTertiary, marginBottom: space.xs + 2 },
  optional: { fontFamily: fonts.regular, color: c.muted },
  photoTitle: { marginTop: space.xl },
  photoHint: { fontFamily: fonts.regular, fontSize: 13, lineHeight: 18, color: c.muted, marginBottom: space.md },
  photoRow: { flexDirection: "row", gap: space.md },
  input: { minHeight: 52, borderRadius: radius.md, borderWidth: 1, borderColor: c.border, backgroundColor: c.surface, paddingHorizontal: space.lg, fontFamily: fonts.regular, fontSize: 16, color: c.onSurface },
  textarea: { minHeight: 132, paddingTop: space.md, textAlignVertical: "top" },
  inputError: { borderColor: c.error },
  errorText: { fontFamily: fonts.medium, fontSize: 12, color: c.error, marginTop: space.xs },
  submitError: { fontFamily: fonts.medium, fontSize: 13, color: c.error, marginTop: space.lg, textAlign: "center" },
  cta: { alignSelf: "stretch", height: 56, borderRadius: radius.pill, backgroundColor: c.brandPrimary, alignItems: "center", justifyContent: "center", marginTop: space.xl },
  pressed: { opacity: 0.85 },
  disabledCta: { opacity: 0.5 },
  ctaText: { fontFamily: fonts.bold, fontSize: 16, color: c.onBrandPrimary },
  note: { fontFamily: fonts.regular, fontSize: 12, color: c.muted, marginTop: space.md, textAlign: "center" },
}));
