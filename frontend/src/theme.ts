// Design tokens for this app. Light theme only.Always modify the colors and theme to Dark, Light or Dark and Light according to the design guidelines.
//
// The keys match the "color" block of /app/design_guidelines.json. Fill the
// values from that file (or from the user's brand colors). Keep every key; do
// not add a second theme or colors file; do not write color literals in
// components.
//
// How the names work: a plain key is a background, and its `on` partner is the
// text or icon color that sits on top of it. Always use them as a pair.
//   <View style={{ backgroundColor: colors.brandPrimary }}>
//     <Text style={{ color: colors.onBrandPrimary }}>Continue</Text>
//   </View>
//
// Styling a screen or component: build the sheet with makeStyles so colors
// and layout live together and follow the active scheme:
//   const useStyles = makeStyles((colors) => ({
//     card: { backgroundColor: colors.surfaceSecondary, padding: 16 },
//     title: { color: colors.onSurfaceSecondary, fontSize: 16 },
//   }));
//   function Screen() {
//     const styles = useStyles();
//     return <View style={styles.card}><Text style={styles.title}>Hi</Text></View>;
//   }
// For color props that are not styles (icon color, placeholderTextColor,
// ActivityIndicator) read useTheme().colors inside the component.
// Never call StyleSheet.create with color values at module level; it cannot
// follow the scheme.
//
// To support dark mode later: add `dark` to `themes` with every key filled.
// Nothing else changes; the device setting takes over automatically.
// Feel free to add as many new colors as you need to support the design guidelines.

import { useMemo } from "react";
import { Appearance, StyleSheet, useColorScheme } from "react-native";

export type ColorScheme = "light" | "dark";

const light = {
  // ---------------------------------------------------------------------------
  // Surfaces: backgrounds, from the screen down to small fills.
  // Each `on` key is the text and icon color for that background.
  // ---------------------------------------------------------------------------
  surface: "#FDFBF7", // primary canvas, most of every screen
  onSurface: "#3D2E3A", // text and icons on the canvas
  surfaceSecondary: "#F3ECE3", // cards, sheets, list rows
  onSurfaceSecondary: "#3D2E3A", // text and icons on cards, sheets, rows
  surfaceTertiary: "#E9E0D5", // input backgrounds, chips, deepest nesting
  onSurfaceTertiary: "#4A3B47", // text on inputs and chips; also muted text
  surfaceInverse: "#3D2E3A", // tooltips, snackbars, anything popping against the theme
  onSurfaceInverse: "#FDFBF7", // text and icons on the inverse surface
  muted: "#6B5A66", // subdued text on surface: captions, timestamps, placeholders
  scrim: "rgba(28,28,30,0.78)", // hero image gradient end
  scrimClear: "rgba(28,28,30,0)", // hero image gradient start
  onScrimMuted: "rgba(255,255,255,0.82)", // secondary text on hero scrim
  glass: "rgba(253,251,247,0.9)", // sticky CTA glass container

  // ---------------------------------------------------------------------------
  // Brand: the identity color and the fills built from it.
  // Neutral by default; replace with the design guidelines values.
  // ---------------------------------------------------------------------------
  brand: "#C3816F", // base hue, anchor only; Primary, Secondary, Tertiary are weights of it
  onBrand: "#FDFBF7", // text and icons placed directly on brand
  brandPrimary: "#C3816F", // primary CTA, active tab indicator, selected states
  onBrandPrimary: "#FDFBF7", // text and icons on brandPrimary
  brandSecondary: "#3D2E3A", // secondary CTA, less prominent accents
  onBrandSecondary: "#FDFBF7", // text and icons on brandSecondary
  brandTertiary: "#F3ECE3", // chips, tags, badges, subtle brand moments
  onBrandTertiary: "#3D2E3A", // text and icons on brandTertiary

  // ---------------------------------------------------------------------------
  // Status: semantic only, never decorative. Fill for badges, banners and
  // toasts; the `on` key is text on that fill. The plain key is also safe as
  // text on `surface`.
  // ---------------------------------------------------------------------------
  success: "#1F8A4C",
  onSuccess: "#FFFFFF",
  warning: "#B45309",
  onWarning: "#FFFFFF",
  error: "#D70015",
  onError: "#FFFFFF",
  info: "#3D2E3A",
  onInfo: "#FFFFFF",

  // ---------------------------------------------------------------------------
  // Lines
  // ---------------------------------------------------------------------------
  border: "#E6DCD0", // hairline outline, 0.5pt or 1pt max: inputs, cards
  borderStrong: "#CBBBAA", // focus rings, selected outlines, 1.5pt max
  divider: "#E6DCD0", // subtle list separators

  // ---------------------------------------------------------------------------
  // Site-wide warm palette aliases (alabaster, oat, sage, terracotta rose, plum)
  // ---------------------------------------------------------------------------
  cream: "#FDFBF7", // primary canvas
  oat: "#F3ECE3", // alternate section canvas
  onCream: "#3D2E3A", // warm espresso body text on cream/oat
  slate: "#3D2E3A", // deep slate teal headings and emphasis
  sage: "#8A9A86", // dividers, icon frames, diagram fills
  sageTint: "#E6EAE3", // soft sage frame fill
  rose: "#C3816F", // CTA fill
  onRose: "#FDFBF7", // text on rose CTA; keep text >=18px bold for contrast
  roseOutline: "#D4A392", // secondary CTA border
  accentText: "#9A5A48", // deeper terracotta for small accent text/links (AA on alabaster and oat)
};

export type ThemeColors = typeof light;

export const defaultScheme = "light" satisfies ColorScheme;

export const themes: { light: ThemeColors; dark?: ThemeColors } = { light };

// In-app theme toggle, only after `dark` exists in `themes`. Call
// setColorScheme("dark"), setColorScheme("light"), or setColorScheme(null) to
// follow the device. Every useTheme() consumer re-renders. Persisting the
// choice and re-applying it on launch is the toggle's job.
export function setColorScheme(scheme: ColorScheme | null) {
  // RN 0.86 re-reads the device scheme only for the literal "unspecified";
  // null would pin useColorScheme() to null and the app to light.
  Appearance.setColorScheme?.(scheme ?? "unspecified");
}

// Keep native surfaces (alerts, pickers, navigation chrome) on the schemes this
// app ships: light only forces light; once `dark` exists the device decides.
// Optional call because react-native-web does not implement it.
setColorScheme?.(themes.dark ? null : defaultScheme);

export function useTheme(): { scheme: ColorScheme; colors: ThemeColors } {
  const system = useColorScheme();
  const scheme: ColorScheme = (system === "light" || system === "dark") && themes[system] ? system : defaultScheme;
  return { scheme, colors: themes[scheme] ?? themes.light };
}

// Themed StyleSheet: returns a hook that builds the sheet from the active
// scheme's colors and memoizes it until the scheme changes.
export function makeStyles<T extends StyleSheet.NamedStyles<T> | StyleSheet.NamedStyles<any>>(
  factory: (colors: ThemeColors) => T & StyleSheet.NamedStyles<any>,
): () => T {
  return function useStyles(): T {
    const { colors } = useTheme();
    return useMemo(() => StyleSheet.create(factory(colors)), [colors]);
  };
}


