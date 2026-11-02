import * as Haptics from "expo-haptics";
import { Image, ImageSource } from "expo-image";
import { CaretLeft, CaretRight, LockSimple } from "phosphor-react-native";
import { useMemo, useRef, useState } from "react";
import { Animated, PanResponder, Platform, Text, View } from "react-native";

import { fonts, radius, space } from "../fonts";
import { makeStyles, useTheme } from "../theme";

type Src = ImageSource | number | null | undefined;
type Props = {
  before: Src;
  after: Src;
  label: string;
  testID: string;
  beforeLabel?: string;
  afterLabel?: string;
  /** width / height of the original photos; the frame matches it so photos are never stretched */
  aspect?: number;
};

const STEP = 5; // percent per arrow-key press

/**
 * Overlay comparison: AFTER fills the frame, BEFORE sits on top clipped to the divider.
 * Drag left → more AFTER; drag right → more BEFORE. Mouse, touch, keyboard and screen-reader adjustable.
 * With no photos, it renders a labeled placeholder (same interaction) for unapproved cases.
 */
export function BeforeAfterSlider({ before, after, label, testID, beforeLabel = "BEFORE", afterLabel = "AFTER", aspect = 4 / 3 }: Props) {
  const styles = useStyles();
  const { colors } = useTheme();
  const [width, setWidth] = useState(0);
  const [pct, setPct] = useState(50);
  const [pos] = useState(() => new Animated.Value(0));
  const start = useRef(0);
  const widthRef = useRef(0);
  const placeholder = !before || !after;

  const moveTo = useMemo(
    () => (x: number) => {
      const w = widthRef.current;
      const clamped = Math.min(Math.max(x, 0), w);
      pos.setValue(clamped);
      if (w) setPct(Math.round((clamped / w) * 100));
      return clamped;
    },
    [pos],
  );

  // Ref reads happen inside gesture callbacks, not during render.
  const responder = useMemo(
    () =>
      // eslint-disable-next-line react-hooks/refs
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: (_, g) => Math.abs(g.dx) > Math.abs(g.dy),
        onPanResponderTerminationRequest: () => false,
        onPanResponderGrant: (e) => {
          start.current = moveTo(e.nativeEvent.locationX);
        },
        onPanResponderMove: (_, g) => {
          moveTo(start.current + g.dx);
        },
        onPanResponderRelease: () => {
          if (Platform.OS !== "web") Haptics.selectionAsync();
        },
      }),
    [moveTo],
  );

  const nudge = (delta: number) => moveTo(((pct + delta) / 100) * widthRef.current);
  const webProps =
    Platform.OS === "web"
      ? ({
          tabIndex: 0,
          onKeyDown: (e: { key: string; preventDefault: () => void }) => {
            const map: Record<string, number> = { ArrowLeft: -STEP, ArrowRight: STEP, Home: -100, End: 100 };
            if (e.key in map) {
              e.preventDefault();
              nudge(map[e.key]);
            }
          },
          style: { userSelect: "none", cursor: "ew-resize", touchAction: "pan-y" },
        } as object)
      : {};

  return (
    <View
      testID={testID}
      accessible
      role="slider"
      aria-label={`Before and after comparison: ${label}. Use left and right arrow keys to move the divider.`}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={pct}
      aria-valuetext={`${pct}% ${beforeLabel.toLowerCase()} shown`}
      accessibilityActions={[{ name: "increment" }, { name: "decrement" }]}
      onAccessibilityAction={(e) => nudge(e.nativeEvent.actionName === "increment" ? STEP : -STEP)}
      onLayout={(e) => {
        const w = e.nativeEvent.layout.width;
        widthRef.current = w;
        pos.setValue((pct / 100) * w);
        setWidth(w);
      }}
      {...webProps}
      {...responder.panHandlers}
    >
      <View style={[styles.wrap, { aspectRatio: aspect }]} pointerEvents="none">
        {/* AFTER: full frame underneath */}
        <View style={styles.full}>
          {placeholder ? (
            <Placeholder label={afterLabel} tone="after" />
          ) : (
            <Image source={after!} style={styles.full} contentFit="contain" accessibilityLabel={`${label}, ${afterLabel}`} />
          )}
        </View>
        {/* BEFORE: same size and position, clipped to the divider so landmarks stay aligned */}
        <Animated.View style={[styles.clip, { width: pos }]}>
          <View style={[styles.beforeInner, { width }]}>
            {placeholder ? (
              <Placeholder label={beforeLabel} tone="before" />
            ) : (
              <Image source={before!} style={styles.full} contentFit="contain" accessibilityLabel={`${label}, ${beforeLabel}`} />
            )}
          </View>
        </Animated.View>
        <View style={[styles.tag, styles.tagLeft]}>
          <Text style={styles.tagText}>{beforeLabel}</Text>
        </View>
        <View style={[styles.tag, styles.tagRight]}>
          <Text style={styles.tagText}>{afterLabel}</Text>
        </View>
        <Animated.View style={[styles.handleLine, { transform: [{ translateX: pos }] }]}>
          <View style={styles.knob} testID={`${testID}-handle`}>
            <CaretLeft size={14} color={colors.sage} weight="bold" />
            <CaretRight size={14} color={colors.sage} weight="bold" />
          </View>
        </Animated.View>
      </View>
    </View>
  );
}

function Placeholder({ label, tone }: { label: string; tone: "before" | "after" }) {
  const styles = useStyles();
  const { colors } = useTheme();
  return (
    <View style={[styles.full, styles.ph, tone === "after" && styles.phAfter]}>
      <LockSimple size={22} color={colors.muted} />
      <Text style={styles.phText}>{label} photo</Text>
      <Text style={styles.phSub}>Pending publication approval</Text>
    </View>
  );
}

const useStyles = makeStyles((c) => ({
  wrap: { width: "100%", maxHeight: 520, borderRadius: radius.md, overflow: "hidden", backgroundColor: c.surfaceTertiary },
  full: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0 },
  clip: { position: "absolute", top: 0, left: 0, bottom: 0, overflow: "hidden" },
  beforeInner: { position: "absolute", top: 0, left: 0, bottom: 0 },
  ph: { alignItems: "center", justifyContent: "center", gap: space.xs, backgroundColor: c.surfaceTertiary },
  phAfter: { backgroundColor: c.sageTint },
  phText: { fontFamily: fonts.bold, fontSize: 14, color: c.onSurface },
  phSub: { fontFamily: fonts.regular, fontSize: 12, color: c.muted },
  tag: { position: "absolute", top: space.md, backgroundColor: c.glass, paddingHorizontal: space.sm, height: 26, justifyContent: "center", borderRadius: radius.sm },
  tagLeft: { left: space.md },
  tagRight: { right: space.md },
  tagText: { fontFamily: fonts.bold, fontSize: 11, letterSpacing: 1.2, color: c.onSurface },
  handleLine: { position: "absolute", top: 0, bottom: 0, left: -1, width: 2, backgroundColor: c.surface, alignItems: "center", justifyContent: "center" },
  knob: {
    width: 44,
    height: 44,
    borderRadius: radius.pill,
    backgroundColor: c.surface,
    borderWidth: 1.5,
    borderColor: c.sage,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: c.surfaceInverse,
    shadowOpacity: 0.2,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 4,
  },
}));
